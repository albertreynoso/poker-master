import { CashAction, getActionColor } from '@/types/cashGame';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RangeEditorSidebarProps {
  availableActions: CashAction[];
  hands: any;
  onHandsChange: (hands: any) => void;
}

export function RangeEditorSidebar({ availableActions }: RangeEditorSidebarProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Acciones</h3>
        <div className="space-y-2">
          {availableActions.map((action) => (
            <div key={action} className="flex items-center gap-3 p-2 rounded border">
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: getActionColor(action) }}
              />
              <span className="text-sm text-foreground flex-1">{action}</span>
            </div>
          ))}
          <Button variant="destructive" size="sm" className="w-full mt-2">
            Clear All
          </Button>
        </div>
      </Card>
    </div>
  );
}