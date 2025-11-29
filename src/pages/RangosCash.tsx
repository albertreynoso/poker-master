import { useState, useEffect } from 'react';
import { SequenceType, CashRange, CashHandMatrix, CashPosition, CashAction, getActionColor } from '@/types/cashGame.ts';
import { CashGameGrid } from '@/components/cashgame/CashGameGrid';
import { ActionSelectorPanel } from '@/components/cashgame/ActionSelectorPanel';
import { HandEditorSidebar } from '@/components/cashgame/HandEditorSidebar';
import { RangeStatisticsPanel } from '@/components/cashgame/RangeStatisticsPanel'; 
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, Edit, Save } from 'lucide-react';
import { calculateCashCombinations, calculateCashPercentage } from '@/types/cashGame';

const STORAGE_KEY = 'poker-cash-ranges';

// Sistema de prioridad de acciones (de menos a más agresivo)
const ACTION_PRIORITY: Record<string, number> = {
  'OR-FOLD': 10, 'ROL-FOLD': 10, '3BET-FOLD': 10, 'SQZ-FOLD': 10, '4BET-FOLD': 10,
  'COLD-CALL': 20,
  'OR-CALL 3BET': 30, 'ROL-CALL 3BET': 30,
  '3BET-CALL 4BET': 40, '4BET-CALL': 40,
  'OR-4BET-FOLD': 50, 'ROL-4BET-FOLD': 50,
  'OR-4BET-ALL-IN': 60, 'ROL-4BET-ALL-IN': 60, '3BET-ALL-IN': 60, 'SQZ-ALL-IN': 60,
};

const getActionPriority = (action: CashAction): number => ACTION_PRIORITY[action] || 50;

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
    actions: ['OR-4BET-ALL-IN', 'OR-4BET-FOLD', 'OR-CALL 3BET', 'OR-FOLD'],
    extraActions: ['3BET', '3BET + CALL', 'SQUEEZE', 'COLD 4BET']
  },
  RAISE_OVER_LIMP: {
    title: 'Raise Over Limp',
    positions: {
      limper: { label: 'Limper Position', options: ['EP', 'MP', 'CO', 'BTN', 'SB'] as CashPosition[] },
      secondLimper: { label: 'Second Limper (Optional)', options: ['None'] as (CashPosition | 'None')[] },
      hero: { label: 'Your Position (Raise Over Limp)', options: [] as CashPosition[] }
    },
    actions: ['ROL-4BET-ALL-IN', 'ROL-4BET-FOLD', 'ROL-CALL 3BET', 'ROL-FOLD'],
    getFilteredPositions: (key: string, selected: Record<string, CashPosition | 'None'>) => {
      const limperPos = selected.limper as CashPosition;
      if (key === 'secondLimper') {
        const afterLimper = getPositionsAfter(limperPos);
        return ['None', ...afterLimper];
      }
      if (key === 'hero') {
        const limper2 = selected.secondLimper;
        const basePos = limper2 && limper2 !== 'None' ? limper2 as CashPosition : limperPos;
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
    actions: ['3BET-ALL-IN', '3BET-CALL 4BET', '3BET-FOLD'],
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
    actions: ['SQZ-ALL-IN', 'SQZ-FOLD', 'COLD-CALL'],
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
    actions: ['4BET-CALL', '4BET-FOLD'],
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
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<CashAction>('OR-4BET-ALL-IN');
  const [isEditMode, setIsEditMode] = useState(false);

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

  useEffect(() => {
    setHands({});
    setSelectedExtraAction(null);
    setExtraActionPositions({});
    setSelectedHand(null);
    setIsEditMode(false);

    const config = SEQUENCE_CONFIG[activeSequence];
    const initialPositions: Record<string, CashPosition | 'None'> = {};

    Object.entries(config.positions).forEach(([key, data]) => {
      if (data.options.length > 0) {
        initialPositions[key] = data.options[0] as CashPosition | 'None';
      }
    });

    setSelectedPositions(initialPositions);
    
    if (config.actions.length > 0) {
      setCurrentAction(config.actions[0] as CashAction);
    }
  }, [activeSequence]);

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
        if (posKey === 'threeBetPos') return afterHero;
        if (posKey === 'callPos' && currentExtraPositions.threeBetPos) {
          return getPositionsAfter(currentExtraPositions.threeBetPos);
        }
        return [];
      case 'SQUEEZE':
        if (posKey === 'callerPos') return afterHero;
        if (posKey === 'squeezePos' && currentExtraPositions.callerPos) {
          return getPositionsAfter(currentExtraPositions.callerPos);
        }
        return [];
      case 'COLD 4BET':
        if (posKey === 'threeBetPos') return afterHero;
        if (posKey === 'fourBetPos' && currentExtraPositions.threeBetPos) {
          return getPositionsAfter(currentExtraPositions.threeBetPos);
        }
        return [];
      default:
        return [];
    }
  };

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

  const handleExtraActionToggle = (action: ExtraAction) => {
    if (selectedExtraAction === action) {
      setSelectedExtraAction(null);
      setExtraActionPositions({});
    } else {
      setSelectedExtraAction(action);
      const heroPos = selectedPositions.hero as CashPosition;
      const newPositions = initializeExtraActionPositions(action, heroPos);
      setExtraActionPositions(newPositions);
    }
  };

  const handleExtraPositionChange = (posKey: keyof ExtraActionPositions, value: CashPosition) => {
    if (!selectedExtraAction) return;

    const newPositions = { ...extraActionPositions, [posKey]: value };

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

  const handlePositionChange = (key: string, value: CashPosition | 'None') => {
    if (activeSequence === 'OPEN_RAISE' && key === 'hero' && selectedExtraAction) {
      const heroPos = value as CashPosition;
      const newPositions = initializeExtraActionPositions(selectedExtraAction, heroPos);
      setExtraActionPositions(newPositions);
    }

    const newPositions = { ...selectedPositions, [key]: value };
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

  const getFilteredOptions = (key: string): (CashPosition | 'None')[] => {
    const config = SEQUENCE_CONFIG[activeSequence];
    if (config.getFilteredPositions) {
      return config.getFilteredPositions(key, selectedPositions);
    }
    return config.positions[key]?.options || [];
  };

  const handleSaveRange = (name: string) => {
    const allPositions: Record<string, CashPosition> = {};

    Object.entries(selectedPositions).forEach(([key, value]) => {
      if (value !== 'None') {
        allPositions[key] = value as CashPosition;
      }
    });

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

  // Calcular estadísticas por acción (ordenadas de menos a más agresiva)
  const getActionStats = () => {
    const stats: { action: CashAction; combos: number; percentage: number }[] = [];
    
    currentConfig.actions.forEach(action => {
      let combos = 0;
      Object.entries(hands).forEach(([hand, actions]) => {
        const actionData = actions.find(a => a.action === action);
        if (actionData && actionData.percentage > 0) {
          // Calcular combos para esta mano
          const handCombos = hand.includes('s') ? 4 : hand.includes('o') ? 12 : 6;
          combos += (handCombos * actionData.percentage) / 100;
        }
      });
      
      if (combos > 0) {
        const percentage = (combos / 1326) * 100;
        stats.push({ action: action as CashAction, combos: Math.round(combos * 10) / 10, percentage: Math.round(percentage * 100) / 100 });
      }
    });
    
    // Ordenar por prioridad (menor a mayor agresividad)
    return stats.sort((a, b) => getActionPriority(a.action) - getActionPriority(b.action));
  };

  return (
    <div className="h-screen flex gap-4 p-4 bg-background">
      {/* COLUMNA 1: Secuencias */}
      <div className="w-[400px] flex flex-col gap-4">
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

        <div className="flex-1 border border-border rounded-lg bg-card p-4 overflow-auto">
          <h2 className="text-lg font-semibold mb-3">Configuración</h2>
          <div className="space-y-4">
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

      {/* COLUMNA 2: Matriz */}
      <div className="flex-1 border border-border rounded-lg bg-card p-6 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center justify-between">
            {/* Leyenda de acciones */}
            <div className="flex flex-wrap items-center gap-3">
              {currentConfig.actions.map((action) => (
                <div key={action} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${getActionColor(action as any)}`} />
                  <span className="text-sm font-normal">{action}</span>
                </div>
              ))}
            </div>
            
            {/* Botón de Edición */}
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex items-center gap-2"
            >
              {isEditMode ? (
                <>
                  <Save className="h-4 w-4" />
                  Guardar
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  Editar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0 overflow-auto">
          <div className="w-full h-full p-2">
            <CashGameGrid
              hands={hands}
              onChange={isEditMode ? setHands : () => {}}
              availableActions={currentConfig.actions as any}
              currentAction={currentAction}
              onHandSelect={setSelectedHand}
              selectedHand={selectedHand}
            />
          </div>
        </div>
      </div>

      {/* COLUMNA 3: Sidebar */}
      <div className="w-80 flex flex-col gap-4 overflow-auto">
        {isEditMode ? (
          <>
            {/* Modo Edición: Selector de Acción */}
            <ActionSelectorPanel
              availableActions={currentConfig.actions as any}
              selectedAction={currentAction}
              onActionChange={setCurrentAction}
            />

            {/* Modo Edición: Editor de Frecuencias */}
            <HandEditorSidebar
              selectedHand={selectedHand}
              hands={hands}
              availableActions={currentConfig.actions as any}
              onHandsChange={setHands}
              onClose={() => setSelectedHand(null)}
            />
          </>
        ) : (
          <>
            {/* Modo Vista: Estadísticas del Rango */}
            <RangeStatisticsPanel
              hands={hands}
              availableActions={currentConfig.actions as any}
            />
          </>
        )}

        {/* Botón Export */}
        <Button onClick={exportRanges} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>
    </div>
  );
}