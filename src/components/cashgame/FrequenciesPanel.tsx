import { CashHandMatrix } from '@/types/cashGame';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FrequenciesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  hands: CashHandMatrix;
  onHandsChange: (hands: CashHandMatrix) => void;
}

export function FrequenciesPanel({ isOpen, onToggle, hands, onHandsChange }: FrequenciesPanelProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">Frecuencias</span>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            Edit A8s
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">OR ALL IN</span>
              <div className="w-8 h-3 bg-red-500 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">OR 4BET FOLD</span>
              <div className="w-8 h-3 bg-orange-500 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">OR CALL</span>
              <div className="w-8 h-3 bg-green-500 rounded"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">OR FOLD</span>
              <div className="w-8 h-3 bg-gray-500 rounded"></div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              Total OK
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}