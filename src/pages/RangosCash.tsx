import { useState, useEffect } from 'react';
import { SequenceType, CashRange, CashHandMatrix, CashPosition } from '@/types/cashGame.ts';
import { CashGameGrid } from '@/components/cashgame/CashGameGrid';
import { FrequenciesPanel } from '@/components/cashgame/FrequenciesPanel';
import { RangeEditorSidebar } from '@/components/cashgame/RangeEditorSidebar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';

const STORAGE_KEY = 'poker-cash-ranges';

type ExtraAction = '3BET' | '3BET + CALL' | 'SQUEEZE' | 'COLD 4BET';

type ExtraActionPositions = {
  threeBetPos?: CashPosition;
  callPos?: CashPosition;
  callerPos?: CashPosition;
  squeezePos?: CashPosition;
  fourBetPos?: CashPosition;
};

type SequenceConfig = {
  title: string;
  positions: Record<string, { label: string; options: (CashPosition | 'None')[] }>;
  actions: string[];
  extraActions?: ExtraAction[];
  getFilteredPositions?: (key: string, selectedPositions: Record<string, CashPosition | 'None'>) => (CashPosition | 'None')[];
};

type SequenceConfigMap = {
  [K in SequenceType]: SequenceConfig;
};

// Función helper para obtener posiciones después de otra
const getPositionsAfter = (pos: CashPosition | 'None'): CashPosition[] => {
  if (pos === 'None') return [];
  const order: CashPosition[] = ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const index = order.indexOf(pos);
  return index >= 0 ? order.slice(index + 1) : [];
};

const SEQUENCE_CONFIG: SequenceConfigMap = {
  OPEN_RAISE: {
    title: 'Open Raise',
    positions: {
      hero: { label: 'Your Position (Open Raise)', options: ['EP', 'MP', 'CO', 'BTN', 'SB'] as CashPosition[] }
    },
    actions: ['OR-ALL-IN', 'OR-4BET-ALL-IN', 'OR-4BET-FOLD', 'OR-CALL', 'OR-FOLD'],
    extraActions: ['3BET', '3BET + CALL', 'SQUEEZE', 'COLD 4BET']
  },
  RAISE_OVER_LIMP: {
    title: 'Raise Over Limp',
    positions: {
      limper: { label: 'Limper Position', options: ['EP', 'MP', 'CO', 'BTN', 'SB'] as CashPosition[] },
      secondLimper: { label: 'Second Limper (Optional)', options: ['None'] as (CashPosition | 'None')[] },
      hero: { label: 'Your Position (Raise Over Limp)', options: [] as CashPosition[] }
    },
    actions: ['ROL-ALL-IN', 'ROL-RAISE', 'ROL-FOLD'],
    getFilteredPositions: (key: string, selected: Record<string, CashPosition | 'None'>) => {
      const limperPos = selected.limper as CashPosition;

      if (key === 'secondLimper') {
        const afterLimper = getPositionsAfter(limperPos);
        return ['None', ...afterLimper];
      }

      if (key === 'hero') {
        const limper2 = selected.secondLimper;
        const basePos = limper2 && limper2 !== 'None'
          ? limper2 as CashPosition
          : limperPos;
        return getPositionsAfter(basePos);
      }

      return ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    }
  },
  '3BET': {
    title: '3Bet',
    positions: {
      opponent: { label: 'Open Raiser Position', options: ['EP', 'MP', 'CO', 'BTN', 'SB'] as CashPosition[] },
      hero: { label: 'Your Position (3Bet)', options: [] as CashPosition[] }
    },
    actions: ['3BET-ALL-IN', '3BET-CALL', '3BET-FOLD'],
    getFilteredPositions: (key: string, selected: Record<string, CashPosition | 'None'>) => {
      if (key === 'hero') {
        const opponentPos = selected.opponent as CashPosition;
        return getPositionsAfter(opponentPos);
      }
      return ['EP', 'MP', 'CO', 'BTN', 'SB'];
    }
  },
  SQUEEZE: {
    title: 'Squeeze',
    positions: {
      raiser: { label: 'Open Raiser Position', options: ['EP', 'MP', 'CO', 'BTN', 'SB'] as CashPosition[] },
      caller: { label: 'Caller Position', options: [] as CashPosition[] },
      hero: { label: 'Your Position (Squeeze)', options: [] as CashPosition[] }
    },
    actions: ['SQZ-ALL-IN', 'SQZ-CALL', 'SQZ-FOLD'],
    getFilteredPositions: (key: string, selected: Record<string, CashPosition | 'None'>) => {
      const raiserPos = selected.raiser as CashPosition;
      const callerPos = selected.caller as CashPosition;

      if (key === 'caller') {
        return getPositionsAfter(raiserPos);
      }

      if (key === 'hero') {
        return getPositionsAfter(callerPos);
      }

      return ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    }
  },
  COLD_4BET: {
    title: 'Cold 4Bet',
    positions: {
      opener: { label: 'Open Raiser Position', options: ['EP', 'MP', 'CO', 'BTN', 'SB'] as CashPosition[] },
      threeBetter: { label: '3Better Position', options: [] as CashPosition[] },
      hero: { label: 'Your Position (Cold 4Bet)', options: [] as CashPosition[] }
    },
    actions: ['C4B-ALL-IN', 'C4B-CALL', 'C4B-FOLD'],
    getFilteredPositions: (key: string, selected: Record<string, CashPosition | 'None'>) => {
      const openerPos = selected.opener as CashPosition;
      const threeBetPos = selected.threeBetter as CashPosition;

      if (key === 'threeBetter') {
        return getPositionsAfter(openerPos);
      }

      if (key === 'hero') {
        return getPositionsAfter(threeBetPos);
      }

      return ['EP', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    }
  }
};

export default function RangosCash() {
  const [activeSequence, setActiveSequence] = useState<SequenceType>('OPEN_RAISE');
  const [savedRanges, setSavedRanges] = useState<CashRange[]>([]);
  const [hands, setHands] = useState<CashHandMatrix>({});
  const [selectedPositions, setSelectedPositions] = useState<Record<string, CashPosition | 'None'>>({});
  const [selectedExtraAction, setSelectedExtraAction] = useState<ExtraAction | null>(null);
  const [extraActionPositions, setExtraActionPositions] = useState<ExtraActionPositions>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedRanges(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load saved ranges', e);
      }
    }
  }, []);

  // Reset cuando cambia la secuencia
  useEffect(() => {
    setHands({});
    setSelectedExtraAction(null);
    setExtraActionPositions({});

    const config = SEQUENCE_CONFIG[activeSequence];
    const initialPositions: Record<string, CashPosition | 'None'> = {};

    Object.entries(config.positions).forEach(([key, data]) => {
      if (data.options.length > 0) {
        initialPositions[key] = data.options[0] as CashPosition | 'None';
      }
    });

    setSelectedPositions(initialPositions);
  }, [activeSequence]);

  // Función para obtener posiciones filtradas para acciones extra
  const getExtraActionFilteredPositions = (
    action: ExtraAction,
    posKey: string,
    heroPos: CashPosition,
    currentExtraPositions: ExtraActionPositions
  ): CashPosition[] => {
    const afterHero = getPositionsAfter(heroPos);

    switch (action) {
      case '3BET':
        return afterHero;

      case '3BET + CALL':
        if (posKey === 'threeBetPos') {
          return afterHero;
        }
        if (posKey === 'callPos' && currentExtraPositions.threeBetPos) {
          return getPositionsAfter(currentExtraPositions.threeBetPos);
        }
        return [];

      case 'SQUEEZE':
        if (posKey === 'callerPos') {
          return afterHero;
        }
        if (posKey === 'squeezePos' && currentExtraPositions.callerPos) {
          return getPositionsAfter(currentExtraPositions.callerPos);
        }
        return [];

      case 'COLD 4BET':
        if (posKey === 'threeBetPos') {
          return afterHero;
        }
        if (posKey === 'fourBetPos' && currentExtraPositions.threeBetPos) {
          return getPositionsAfter(currentExtraPositions.threeBetPos);
        }
        return [];

      default:
        return [];
    }
  };

  // Inicializar posiciones de acción extra
  const initializeExtraActionPositions = (action: ExtraAction, heroPos: CashPosition) => {
    const afterHero = getPositionsAfter(heroPos);
    if (afterHero.length === 0) return {};

    const newPositions: ExtraActionPositions = {};

    switch (action) {
      case '3BET':
        newPositions.threeBetPos = afterHero[0];
        break;

      case '3BET + CALL':
        newPositions.threeBetPos = afterHero[0];
        const afterThreeBet = getPositionsAfter(afterHero[0]);
        if (afterThreeBet.length > 0) {
          newPositions.callPos = afterThreeBet[0];
        }
        break;

      case 'SQUEEZE':
        newPositions.callerPos = afterHero[0];
        const afterCaller = getPositionsAfter(afterHero[0]);
        if (afterCaller.length > 0) {
          newPositions.squeezePos = afterCaller[0];
        }
        break;

      case 'COLD 4BET':
        newPositions.threeBetPos = afterHero[0];
        const afterThreeBet2 = getPositionsAfter(afterHero[0]);
        if (afterThreeBet2.length > 0) {
          newPositions.fourBetPos = afterThreeBet2[0];
        }
        break;
    }

    return newPositions;
  };

  // Toggle acción extra
  const handleExtraActionToggle = (action: ExtraAction) => {
    if (selectedExtraAction === action) {
      // Desactivar
      setSelectedExtraAction(null);
      setExtraActionPositions({});
    } else {
      // Activar nueva acción
      setSelectedExtraAction(action);
      const heroPos = selectedPositions.hero as CashPosition;
      const newPositions = initializeExtraActionPositions(action, heroPos);
      setExtraActionPositions(newPositions);
    }
  };

  // Cambiar posición de acción extra
  const handleExtraPositionChange = (posKey: keyof ExtraActionPositions, value: CashPosition) => {
    if (!selectedExtraAction) return;

    const newPositions = { ...extraActionPositions, [posKey]: value };

    // Actualizar posiciones dependientes
    if (selectedExtraAction === '3BET + CALL' && posKey === 'threeBetPos') {
      const afterThreeBet = getPositionsAfter(value);
      if (afterThreeBet.length > 0) {
        newPositions.callPos = afterThreeBet[0];
      } else {
        delete newPositions.callPos;
      }
    }

    if (selectedExtraAction === 'SQUEEZE' && posKey === 'callerPos') {
      const afterCaller = getPositionsAfter(value);
      if (afterCaller.length > 0) {
        newPositions.squeezePos = afterCaller[0];
      } else {
        delete newPositions.squeezePos;
      }
    }

    if (selectedExtraAction === 'COLD 4BET' && posKey === 'threeBetPos') {
      const afterThreeBet = getPositionsAfter(value);
      if (afterThreeBet.length > 0) {
        newPositions.fourBetPos = afterThreeBet[0];
      } else {
        delete newPositions.fourBetPos;
      }
    }

    setExtraActionPositions(newPositions);
  };

  // Cambiar posición base (para otras secuencias)
  const handlePositionChange = (key: string, value: CashPosition | 'None') => {
    // Si es Open Raise y es la posición hero, reinicializar acciones extra
    if (activeSequence === 'OPEN_RAISE' && key === 'hero' && selectedExtraAction) {
      const heroPos = value as CashPosition;
      const newPositions = initializeExtraActionPositions(selectedExtraAction, heroPos);
      setExtraActionPositions(newPositions);
    }

    const newPositions = { ...selectedPositions, [key]: value };

    // Resetear posiciones dependientes (para otras secuencias)
    const config = SEQUENCE_CONFIG[activeSequence];
    const posKeys = Object.keys(config.positions);
    const currentIndex = posKeys.indexOf(key);

    posKeys.slice(currentIndex + 1).forEach(resetKey => {
      const options = config.getFilteredPositions
        ? config.getFilteredPositions(resetKey, newPositions)
        : config.positions[resetKey].options;

      if (options.length > 0) {
        newPositions[resetKey] = options[0] as CashPosition | 'None';
      }
    });

    setSelectedPositions(newPositions);
  };

  // Obtener opciones filtradas
  const getFilteredOptions = (key: string): (CashPosition | 'None')[] => {
    const config = SEQUENCE_CONFIG[activeSequence];

    if (config.getFilteredPositions) {
      return config.getFilteredPositions(key, selectedPositions);
    }

    return config.positions[key]?.options || [];
  };

  const handleSaveRange = (name: string) => {
    // Combinar posiciones base con extra actions, convirtiendo a Record<string, CashPosition>
    const allPositions: Record<string, CashPosition> = {};

    // Agregar posiciones base
    Object.entries(selectedPositions).forEach(([key, value]) => {
      if (value !== 'None') {
        allPositions[key] = value as CashPosition;
      }
    });

    // Agregar posiciones de acciones extra si existen
    Object.entries(extraActionPositions).forEach(([key, value]) => {
      if (value) {
        allPositions[key] = value;
      }
    });

    const newRange: CashRange = {
      id: Date.now().toString(),
      name,
      sequence: activeSequence,
      hands,
      positions: allPositions as any,
      totalPercentage: calculateCashPercentage(hands),
      combinations: calculateCashCombinations(hands),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...savedRanges, newRange];
    setSavedRanges(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(`Range "${name}" saved successfully`);
  };

  const exportRanges = () => {
    const dataStr = JSON.stringify(savedRanges, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cash-game-ranges.json';
    link.click();
    toast.success('Ranges exported');
  };

  const currentConfig = SEQUENCE_CONFIG[activeSequence];
  const combinations = calculateCashCombinations(hands);
  const percentage = calculateCashPercentage(hands);



  return (
    <div className="h-screen flex gap-4 p-4 bg-background">
      {/* COLUMNA 1: Secuencias y Acciones Extra */}
      <div className="w-[400px] flex flex-col gap-4">
        {/* Panel de Secuencias */}
        <div className="border border-border rounded-lg bg-card p-4">
          <h2 className="text-lg font-semibold mb-3">Secuencias</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(SEQUENCE_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant={activeSequence === key ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setActiveSequence(key as SequenceType)}
              >
                {config.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Panel de Configuración */}
        <div className="flex-1 border border-border rounded-lg bg-card p-4 overflow-auto">
          <h2 className="text-lg font-semibold mb-3">Configuración</h2>

          <div className="space-y-4">
            {/* Selectores de Posición Base */}
            {Object.entries(currentConfig.positions).map(([key, posConfig]) => {
              const filteredOptions = getFilteredOptions(key);

              if (filteredOptions.length === 0) return null;

              return (
                <div key={key}>
                  <label className="text-sm font-medium mb-2 block">{posConfig.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {filteredOptions.map((pos) => (
                      <Button
                        key={pos}
                        variant={selectedPositions[key] === pos ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePositionChange(key, pos)}
                      >
                        {pos}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Acciones Extra (solo para OPEN RAISE) */}
            {activeSequence === 'OPEN_RAISE' && currentConfig.extraActions && (
              <>
                <div className="pt-2 border-t">
                  <label className="text-sm font-medium mb-2 block">Acciones Extra</label>
                  <div className="grid grid-cols-2 gap-2">
                    {currentConfig.extraActions.map((action) => (
                      <Button
                        key={action}
                        variant={selectedExtraAction === action ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleExtraActionToggle(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Configuración contextual de acciones extra */}
                {selectedExtraAction && (
                  <div className="pt-2 border-t space-y-3">
                    {selectedExtraAction === '3BET' && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">
                          Posición del 3Better
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {getExtraActionFilteredPositions(
                            '3BET',
                            'threeBetPos',
                            selectedPositions.hero as CashPosition,
                            extraActionPositions
                          ).map((pos) => (
                            <Button
                              key={pos}
                              variant={extraActionPositions.threeBetPos === pos ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleExtraPositionChange('threeBetPos', pos)}
                            >
                              {pos}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedExtraAction === '3BET + CALL' && (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">
                            Posición del 3Better
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {getExtraActionFilteredPositions(
                              '3BET + CALL',
                              'threeBetPos',
                              selectedPositions.hero as CashPosition,
                              extraActionPositions
                            ).map((pos) => (
                              <Button
                                key={pos}
                                variant={extraActionPositions.threeBetPos === pos ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleExtraPositionChange('threeBetPos', pos)}
                              >
                                {pos}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {extraActionPositions.threeBetPos && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">
                              Posición del Caller
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {getExtraActionFilteredPositions(
                                '3BET + CALL',
                                'callPos',
                                selectedPositions.hero as CashPosition,
                                extraActionPositions
                              ).map((pos) => (
                                <Button
                                  key={pos}
                                  variant={extraActionPositions.callPos === pos ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleExtraPositionChange('callPos', pos)}
                                >
                                  {pos}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {selectedExtraAction === 'SQUEEZE' && (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">
                            Posición del Caller
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {getExtraActionFilteredPositions(
                              'SQUEEZE',
                              'callerPos',
                              selectedPositions.hero as CashPosition,
                              extraActionPositions
                            ).map((pos) => (
                              <Button
                                key={pos}
                                variant={extraActionPositions.callerPos === pos ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleExtraPositionChange('callerPos', pos)}
                              >
                                {pos}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {extraActionPositions.callerPos && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">
                              Posición del Squeeze
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {getExtraActionFilteredPositions(
                                'SQUEEZE',
                                'squeezePos',
                                selectedPositions.hero as CashPosition,
                                extraActionPositions
                              ).map((pos) => (
                                <Button
                                  key={pos}
                                  variant={extraActionPositions.squeezePos === pos ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleExtraPositionChange('squeezePos', pos)}
                                >
                                  {pos}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {selectedExtraAction === 'COLD 4BET' && (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">
                            Posición del 3Better
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {getExtraActionFilteredPositions(
                              'COLD 4BET',
                              'threeBetPos',
                              selectedPositions.hero as CashPosition,
                              extraActionPositions
                            ).map((pos) => (
                              <Button
                                key={pos}
                                variant={extraActionPositions.threeBetPos === pos ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleExtraPositionChange('threeBetPos', pos)}
                              >
                                {pos}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {extraActionPositions.threeBetPos && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">
                              Posición del 4Better
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {getExtraActionFilteredPositions(
                                'COLD 4BET',
                                'fourBetPos',
                                selectedPositions.hero as CashPosition,
                                extraActionPositions
                              ).map((pos) => (
                                <Button
                                  key={pos}
                                  variant={extraActionPositions.fourBetPos === pos ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleExtraPositionChange('fourBetPos', pos)}
                                >
                                  {pos}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* COLUMNA 2: Matriz de Rango */}
      <div className="flex-1 border border-border rounded-lg bg-card p-6 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 mb-4">

          {/* Leyenda de Acciones - TAMAÑO REDUCIDO */}
          <div className="flex flex-wrap items-center gap-3">
            {currentConfig.actions.map((action, index) => {
              const colors = [
                'bg-red-500',
                'bg-orange-500',
                'bg-yellow-500',
                'bg-green-500',
                'bg-blue-500',
                'bg-purple-500',
                'bg-gray-500'
              ];
              return (
                <div key={action} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${colors[index % colors.length]}`} />
                  <span className="text-sm font-normal">{action}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matriz con tamaño máximo optimizado */}
        <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto">
          <div className="w-full h-full p-2">
            <CashGameGrid
              hands={hands}
              onChange={setHands}
              availableActions={currentConfig.actions as any}
            />
          </div>
        </div>
      </div>

      {/* COLUMNA 3: Barra Lateral - Controles y Estadísticas */}
      <div className="w-80 border border-border rounded-lg bg-card p-4 flex flex-col gap-4 overflow-auto">
        <h2 className="text-lg font-semibold">Barra lateral</h2>

        {/* Panel de Frecuencias */}
        <FrequenciesPanel
          isOpen={true}
          onToggle={() => { }}
          hands={hands}
          onHandsChange={setHands}
        />

        {/* Sidebar de Estadísticas y Guardar */}
        <RangeEditorSidebar
          availableActions={currentConfig.actions as any}
          hands={hands}
          onHandsChange={setHands}
        />

        {/* Botón Export */}
        <Button onClick={exportRanges} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>
    </div>
  );
}