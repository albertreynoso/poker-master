import { useState } from 'react';
import { HAND_LABELS } from '@/types/poker';
import { CashHandMatrix, CashAction, getActionColor } from '@/types/cashGame';
import { cn } from '@/lib/utils';

// Sistema de prioridad de acciones
const ACTION_PRIORITY: Record<string, number> = {
  'OR-4BET-ALL-IN': 100, 'ROL-4BET-ALL-IN': 100, '3BET-ALL-IN': 100, 'SQZ-ALL-IN': 100, '4BET-CALL': 100,
  'OR-4BET-FOLD': 90, 'ROL-4BET-FOLD': 90, '3BET-CALL 4BET': 90, '4BET-FOLD': 90,
  'OR-CALL 3BET': 80, 'ROL-CALL 3BET': 80, '3BET-FOLD': 80, 'SQZ-FOLD': 80,
  'OR-FOLD': 70, 'ROL-FOLD': 70, 'COLD-CALL': 70,
};

const getActionPriority = (action: CashAction): number => ACTION_PRIORITY[action] || 0;

interface CashGameGridProps {
  hands: CashHandMatrix;
  onChange: (hands: CashHandMatrix) => void;
  availableActions: CashAction[];
  currentAction: CashAction;
  isEditing?: boolean;
  onHandSelect?: (hand: string | null) => void;
  selectedHand?: string | null;
}

export function CashGameGrid({ 
  hands, 
  onChange, 
  availableActions,
  currentAction,
  isEditing,
  onHandSelect,
  selectedHand 
}: CashGameGridProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoveredHand, setHoveredHand] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // ---------------------------------------
  // Hand interaction
  // ---------------------------------------

  const toggleHand = (hand: string) => {
    const current = hands[hand] || [];
    const exists = current.find(a => a.action === currentAction);
    const newValue = exists?.percentage === 100 ? 0 : 100;
    updateHandAction(hand, currentAction, newValue);
  };

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
    onChange(newHands);
  };

  const handleCellClick = (hand: string, e: React.MouseEvent) => {
    // Solo abrir editor si es click simple (sin modificadores)
    if (onHandSelect && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      onHandSelect(hand);
    }
  };

  const handleMouseDown = (hand: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir selección de texto
    
    // Iniciar modo de selección y aplicar acción inmediatamente
    setIsSelecting(true);
    toggleHand(hand);
  };

  const handleMouseEnter = (hand: string, e: React.MouseEvent) => {
    setHoveredHand(hand);
    
    // Calcular posición inteligente del tooltip
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 200;
    const tooltipHeight = 150; // estimado
    const offset = 8;

    let x = rect.left + rect.width / 2;
    let y = rect.top - tooltipHeight - offset;

    // Si está muy arriba, mostrar abajo
    if (y < 0) {
      y = rect.bottom + offset;
    }

    // Si está muy a la derecha, alinear a la derecha
    if (x + tooltipWidth / 2 > window.innerWidth) {
      x = window.innerWidth - tooltipWidth / 2 - 10;
    }

    // Si está muy a la izquierda, alinear a la izquierda
    if (x - tooltipWidth / 2 < 0) {
      x = tooltipWidth / 2 + 10;
    }

    setTooltipPosition({ x, y });
    
    if (isSelecting) toggleHand(hand);
  };

  const handleMouseLeave = () => {
    setHoveredHand(null);
    setTooltipPosition(null);
  };

  const handleMouseUp = () => setIsSelecting(false);

  // ---------------------------------------
  // Display & Coloring - Multi-color support
  // ---------------------------------------

  const getTotalPercentage = (hand: string) => {
    return hands[hand]?.reduce((s, a) => s + a.percentage, 0) ?? 0;
  };

  // Generar gradiente HORIZONTAL con múltiples colores según porcentajes
  const getMultiColorStyle = (hand: string): React.CSSProperties => {
    const acts = hands[hand];
    if (!acts || acts.length === 0) {
      return { backgroundColor: 'hsl(var(--muted) / 0.2)' };
    }

    // Ordenar acciones por PRIORIDAD (más agresivo primero)
    const sortedActions = [...acts].sort((a, b) => 
      getActionPriority(b.action) - getActionPriority(a.action)
    );

    if (sortedActions.length === 1) {
      // Un solo color
      const color = getActionColor(sortedActions[0].action);
      return { 
        backgroundColor: getColorFromTailwind(color),
        opacity: sortedActions[0].percentage / 100 
      };
    }

    // Múltiples colores - crear gradiente lineal HORIZONTAL (90deg)
    let currentPos = 0;
    const gradientStops: string[] = [];

    sortedActions.forEach((action) => {
      const color = getColorFromTailwind(getActionColor(action.action));
      const percentage = action.percentage;
      
      gradientStops.push(`${color} ${currentPos}%`);
      currentPos += percentage;
      gradientStops.push(`${color} ${currentPos}%`);
    });

    return {
      background: `linear-gradient(90deg, ${gradientStops.join(', ')})`
    };
  };

  // Convertir clases de Tailwind a colores CSS
  const getColorFromTailwind = (tailwindClass: string): string => {
    const colorMap: Record<string, string> = {
      'bg-red-500': '#ef4444',
      'bg-orange-500': '#f97316',
      'bg-yellow-500': '#eab308',
      'bg-green-500': '#22c55e',
      'bg-blue-500': '#3b82f6',
      'bg-cyan-500': '#06b6d4',
      'bg-purple-500': '#a855f7',
      'bg-gray-500': '#6b7280'
    };
    return colorMap[tailwindClass] || '#6b7280';
  };

  // ---------------------------------------

  return (
    <div 
      className="h-full flex flex-col" 
      onMouseUp={handleMouseUp} 
      onMouseLeave={() => {
        handleMouseUp();
        handleMouseLeave();
      }}
    >
      {/* Matrix */}
      <div 
        className="flex-1 grid grid-cols-13 gap-1 select-none" 
        style={{ gridTemplateRows: 'repeat(13, 1fr)' }}
      >
        {HAND_LABELS.map((row, rowIndex) =>
          row.map((hand, colIndex) => {
            const total = getTotalPercentage(hand);
            const multiColorStyle = getMultiColorStyle(hand);
            const isSelected = selectedHand === hand;
            const isHovered = hoveredHand === hand;

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "w-full h-full flex items-center justify-center text-base font-bold transition-all border rounded relative overflow-hidden",
                  isSelected && "ring-2 ring-primary ring-offset-1",
                  total > 0 ? "border-foreground/20" : "border-border"
                )}
                style={multiColorStyle}
                onClick={(e) => handleCellClick(hand, e)}
                onMouseDown={(e) => handleMouseDown(hand, e)}
                onMouseEnter={(e) => handleMouseEnter(hand, e)}
                onMouseLeave={handleMouseLeave}
              >
                <span className={cn(
                  "relative z-10 drop-shadow-sm text-l font-medium",
                  total > 50 ? "text-white" : "text-foreground"
                )}>
                  {hand}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Tooltip flotante - Fixed position overlay */}
      {hoveredHand && tooltipPosition && hands[hoveredHand] && hands[hoveredHand].length > 0 && (
        <div
          className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-xl p-3 min-w-[200px] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-100"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-center mb-2">
            <span className="font-bold text-xl">{hoveredHand}</span>
          </div>
          <div className="space-y-1.5">
            {[...hands[hoveredHand]]
              .sort((a, b) => getActionPriority(b.action) - getActionPriority(a.action))
              .map((act) => (
                <div key={act.action} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: getColorFromTailwind(getActionColor(act.action)) }}
                    />
                    <span className="text-foreground font-medium">{act.action}</span>
                  </div>
                  <span className="font-semibold text-foreground ml-2">{act.percentage}%</span>
                </div>
              ))}
            <div className="border-t pt-1.5 mt-1.5 flex justify-between font-bold text-sm">
              <span>Total:</span>
              <span className={getTotalPercentage(hoveredHand) === 100 ? 'text-green-500' : ''}>
                {getTotalPercentage(hoveredHand)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
