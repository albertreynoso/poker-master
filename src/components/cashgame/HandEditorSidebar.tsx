import { useState } from 'react';
import { CashHandMatrix, CashAction, getActionColor } from '@/types/cashGame';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// Sistema de prioridad de acciones (mismo que en CashGameGrid)
const ACTION_PRIORITY: Record<string, number> = {
  'OR-4BET-ALL-IN': 100, 'ROL-4BET-ALL-IN': 100, '3BET-ALL-IN': 100, 'SQZ-ALL-IN': 100, '4BET-CALL': 100,
  'OR-4BET-FOLD': 90, 'ROL-4BET-FOLD': 90, '3BET-CALL 4BET': 90, '4BET-FOLD': 90,
  'OR-CALL 3BET': 80, 'ROL-CALL 3BET': 80, '3BET-FOLD': 80, 'SQZ-FOLD': 80,
  'OR-FOLD': 70, 'ROL-FOLD': 70, 'COLD-CALL': 70,
};

const getActionPriority = (action: CashAction): number => ACTION_PRIORITY[action] || 0;

interface HandEditorSidebarProps {
  selectedHand: string | null;
  hands: CashHandMatrix;
  availableActions: CashAction[];
  onHandsChange: (hands: CashHandMatrix) => void;
  onClose: () => void;
}

export function HandEditorSidebar({
  selectedHand,
  hands,
  availableActions,
  onHandsChange,
  onClose
}: HandEditorSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedHand) {
    return null;
  }

  const updateHandAction = (hand: string, action: CashAction, percentage: number) => {
    const newHands = { ...hands };
    const actions = newHands[hand] ? [...newHands[hand]] : [];

    const idx = actions.findIndex(a => a.action === action);

    if (percentage === 0) {
      if (idx >= 0) actions.splice(idx, 1);
    } else {
      if (idx >= 0) actions[idx].percentage = percentage;
      else actions.push({ action, percentage });
    }

    newHands[hand] = actions;
    onHandsChange(newHands);
  };

  const getTotalPercentage = () => {
    return hands[selectedHand]?.reduce((s, a) => s + a.percentage, 0) ?? 0;
  };

  // Obtener el espacio disponible (sin contar la acción actual)
  const getAvailableSpace = (action: CashAction) => {
    const otherTotal = (hands[selectedHand] || [])
      .filter(a => a.action !== action)
      .reduce((s, a) => s + a.percentage, 0);
    return Math.max(0, 100 - otherTotal);
  };

  // Validar y ajustar el valor del slider
  const handleSliderChange = (action: CashAction, newValue: number) => {
    const available = getAvailableSpace(action);
    const validValue = Math.min(newValue, available);
    updateHandAction(selectedHand, action, validValue);
  };

  // Verificar si hay una acción principal al 100%
  const hasPrimaryAction = () => {
    return currentActions.some(a => a.percentage === 100);
  };

  // Verificar si se puede editar una acción nueva
  const canAddNewAction = () => {
    const total = getTotalPercentage();
    return total < 100;
  };

  const currentActions = hands[selectedHand] || [];
  
  // Ordenar acciones actuales por prioridad (más agresivo primero)
  const sortedCurrentActions = [...currentActions].sort((a, b) => 
    getActionPriority(b.action) - getActionPriority(a.action)
  );
  
  const missingActions = availableActions.filter(
    a => !currentActions.some(x => x.action === a)
  );

  const hasActions = currentActions.length > 0;
  const isPrimaryLocked = hasPrimaryAction();

  return (
    <div className="border border-border rounded-lg bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">Editar Frecuencias</h3>
          {hasActions && (
            <Badge variant="secondary" className="text-xs">
              {selectedHand}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {!hasActions && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">
                Selecciona un combo de la matriz para editar sus frecuencias
              </p>
            </div>
          )}

          {hasActions && (
            <>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-semibold">{selectedHand}</span>
                <div className="flex items-center gap-3">
                  {/* Total y estado */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Total:</span>
                    <span className={`text-sm font-bold ${
                      getTotalPercentage() > 100 
                        ? 'text-red-500' 
                        : getTotalPercentage() === 100 
                          ? 'text-green-500'
                          : 'text-foreground'
                    }`}>
                      {getTotalPercentage()}%
                    </span>
                    {getTotalPercentage() === 100 && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </div>
                  {/* Botón para limpiar */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const newHands = { ...hands };
                      delete newHands[selectedHand];
                      onHandsChange(newHands);
                      onClose();
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Acciones actuales - ORDENADAS POR PRIORIDAD */}
                {sortedCurrentActions.map((act, index) => {
                  const availableSpace = getAvailableSpace(act.action);
                  const cappedPercentage = (availableSpace / 100) * 100;
                  
                  return (
                    <div key={act.action} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getActionColor(act.action)}>{act.action}</Badge>
                        <span className="text-sm font-medium">{act.percentage}%</span>
                      </div>
                      
                      {/* Slider con indicador visual de límite para TODAS las acciones */}
                      <div className="relative">
                        <Slider
                          value={[act.percentage]}
                          max={100}
                          step={5}
                          onValueChange={([v]) => handleSliderChange(act.action, v)}
                          className="cursor-pointer"
                        />
                        {availableSpace < 100 && (
                          <div 
                            className="absolute top-0 right-0 h-full bg-muted/40 pointer-events-none rounded-r"
                            style={{ 
                              width: `${100 - cappedPercentage}%`,
                              zIndex: 0
                            }}
                          />
                        )}
                      </div>
                      
                      {availableSpace < 100 && (
                        <p className="text-xs text-muted-foreground">
                          Disponible hasta {availableSpace}%
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* Acciones disponibles pero no usadas */}
                {missingActions.length > 0 && (
                  <>
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Agregar acciones:</p>
                    </div>
                    {missingActions.map(a => {
                      const availableSpace = getAvailableSpace(a);
                      const isDisabled = isPrimaryLocked || !canAddNewAction();
                      const cappedPercentage = (availableSpace / 100) * 100;
                      
                      return (
                        <div key={a} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline" 
                              className={`${getActionColor(a)} ${isDisabled ? 'opacity-50' : ''}`}
                            >
                              {a}
                            </Badge>
                            <span className="text-sm text-muted-foreground">0%</span>
                          </div>
                          
                          {/* Slider con indicador visual de límite */}
                          <div className="relative">
                            <Slider
                              value={[0]}
                              max={100}
                              step={5}
                              onValueChange={([v]) => handleSliderChange(a, v)}
                              className="cursor-pointer"
                              disabled={isDisabled}
                            />
                            {!isDisabled && availableSpace < 100 && (
                              <div 
                                className="absolute top-0 right-0 h-full bg-muted/40 pointer-events-none rounded-r"
                                style={{ 
                                  width: `${100 - cappedPercentage}%`,
                                  zIndex: 0
                                }}
                              />
                            )}
                          </div>
                          
                          {isDisabled ? (
                            <p className="text-xs text-muted-foreground">
                              Reduce la acción principal primero
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Disponible hasta {availableSpace}%
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}