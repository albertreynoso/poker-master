import { useState } from 'react';
import { CashAction, getActionColor } from '@/types/cashGame';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ActionSelectorPanelProps {
  availableActions: CashAction[];
  selectedAction: CashAction;
  onActionChange: (action: CashAction) => void;
}

export function ActionSelectorPanel({
  availableActions,
  selectedAction,
  onActionChange
}: ActionSelectorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-border rounded-lg bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <h3 className="font-semibold text-base">Seleccionar Acción</h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-3">
          <p className="text-sm text-muted-foreground mb-3">
            Selecciona una acción y luego haz clic en los combos de la matriz para asignarla
          </p>

          <div className="space-y-2">
            {availableActions.map((action) => {
              const isSelected = selectedAction === action;
              const colorClass = getActionColor(action);

              return (
                <button
                  key={action}
                  onClick={() => onActionChange(action)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded ${colorClass} shadow-sm`} />
                    <span className="font-medium text-sm">{action}</span>
                  </div>

                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Activa
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}