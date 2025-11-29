import { CashHandMatrix, CashAction, getActionColor } from '@/types/cashGame';

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

interface RangeStatisticsPanelProps {
  hands: CashHandMatrix;
  availableActions: CashAction[];
}

export function RangeStatisticsPanel({ hands, availableActions }: RangeStatisticsPanelProps) {
  // Calcular estadísticas generales del rango
  const calculateGeneralStats = () => {
    let totalCombos = 0;
    let pocketPairs = 0;
    let suitedHands = 0;
    let offsuitHands = 0;

    Object.entries(hands).forEach(([hand, actions]) => {
      // Calcular combos base de esta mano
      const isPair = hand.length === 2 && hand[0] === hand[1];
      const isSuited = hand.includes('s');
      const isOffsuit = hand.includes('o');
      
      const handBaseCombos = isPair ? 6 : isSuited ? 4 : 12;

      // Sumar el porcentaje total de esta mano
      const totalPercentage = actions.reduce((sum, a) => sum + a.percentage, 0);
      const handCombos = (handBaseCombos * totalPercentage) / 100;

      totalCombos += handCombos;

      if (isPair) {
        pocketPairs += (handBaseCombos * totalPercentage) / 100;
      } else if (isSuited) {
        suitedHands += (handBaseCombos * totalPercentage) / 100;
      } else if (isOffsuit) {
        offsuitHands += (handBaseCombos * totalPercentage) / 100;
      }
    });

    const totalPercentage = (totalCombos / 1326) * 100;

    return {
      totalPercentage: Math.round(totalPercentage * 100) / 100,
      totalCombos: Math.round(totalCombos * 10) / 10,
      pocketPairs: Math.round(pocketPairs * 10) / 10,
      suitedHands: Math.round(suitedHands * 10) / 10,
      offsuitHands: Math.round(offsuitHands * 10) / 10,
    };
  };

  // Calcular estadísticas por acción (ordenadas de menos a más agresiva)
  const calculateActionStats = () => {
    const stats: { action: CashAction; combos: number; percentage: number }[] = [];
    
    availableActions.forEach(action => {
      let combos = 0;
      Object.entries(hands).forEach(([hand, actions]) => {
        const actionData = actions.find(a => a.action === action);
        if (actionData && actionData.percentage > 0) {
          const isPair = hand.length === 2 && hand[0] === hand[1];
          const isSuited = hand.includes('s');
          const handCombos = isPair ? 6 : isSuited ? 4 : 12;
          combos += (handCombos * actionData.percentage) / 100;
        }
      });
      
      if (combos > 0) {
        const percentage = (combos / 1326) * 100;
        stats.push({ 
          action: action as CashAction, 
          combos: Math.round(combos * 10) / 10, 
          percentage: Math.round(percentage * 100) / 100 
        });
      }
    });
    
    // Ordenar por prioridad (menor a mayor agresividad)
    return stats.sort((a, b) => getActionPriority(a.action) - getActionPriority(b.action));
  };

  const generalStats = calculateGeneralStats();
  const actionStats = calculateActionStats();

  return (
    <div className="border border-border rounded-lg bg-card p-4">
      <h3 className="font-semibold text-lg mb-4">Estadísticas del Rango</h3>
      
      {/* Estadísticas Generales */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Rango Total</span>
          <div className="text-right">
            <div className="text-2xl font-bold">{generalStats.totalPercentage}%</div>
            <div className="text-xs text-muted-foreground">{generalStats.totalCombos} combos</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-muted/30 rounded text-center">
            <div className="text-lg font-bold">{generalStats.pocketPairs}</div>
            <div className="text-xs text-muted-foreground">Pares</div>
          </div>
          <div className="p-2 bg-muted/30 rounded text-center">
            <div className="text-lg font-bold">{generalStats.suitedHands}</div>
            <div className="text-xs text-muted-foreground">Suited</div>
          </div>
          <div className="p-2 bg-muted/30 rounded text-center">
            <div className="text-lg font-bold">{generalStats.offsuitHands}</div>
            <div className="text-xs text-muted-foreground">Offsuit</div>
          </div>
        </div>
      </div>

      {/* Separador */}
      {actionStats.length > 0 && <div className="border-t my-4" />}

      {/* Estadísticas por Acción */}
      {actionStats.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">
            FRECUENCIAS POR ACCIÓN
          </h4>
          {actionStats.map((stat, index) => (
            <div 
              key={stat.action} 
              className="p-3 bg-muted/30 rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${getActionColor(stat.action)}`} />
                  <span className="text-sm font-medium">{stat.action}</span>
                </div>
                <span className="text-lg font-bold">{stat.percentage}%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Combinaciones</span>
                <span className="font-medium">{stat.combos}</span>
              </div>

              {/* Barra de progreso visual */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getActionColor(stat.action)}`}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {actionStats.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No hay acciones configuradas aún.</p>
          <p className="text-xs mt-2">Activa el modo edición para agregar combos.</p>
        </div>
      )}
    </div>
  );
}