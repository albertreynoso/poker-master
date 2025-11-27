import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { SequenceType, CashRange, CashHandMatrix } from '@/types/cashGame';
import { OpenRaiseSequence } from '@/components/cashgame/OpenRaiseSequence';
import { RaiseOverLimpSequence } from '@/components/cashgame/RaiseOverLimpSequence';
import { ThreeBetSequence } from '@/components/cashgame/ThreeBetSequence';
import { SqueezeSequence } from '@/components/cashgame/SqueezeSequence';
import { Cold4BetSequence } from '@/components/cashgame/Cold4BetSequence';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';

const STORAGE_KEY = 'poker-cash-ranges';

export default function RangosCash() {
  const [activeSequence, setActiveSequence] = useState<SequenceType>('OPEN_RAISE');
  const [savedRanges, setSavedRanges] = useState<CashRange[]>([]);

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

  const saveRange = (name: string, hands: CashHandMatrix, positions: any) => {
    const newRange: CashRange = {
      id: Date.now().toString(),
      name,
      sequence: activeSequence,
      hands,
      positions,
      totalPercentage: 0,
      combinations: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...savedRanges, newRange];
    setSavedRanges(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(`Range "${name}" saved successfully`);
  };

  const deleteRange = (id: string) => {
    const updated = savedRanges.filter(r => r.id !== id);
    setSavedRanges(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success('Range deleted');
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

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Rangos Cash</h1>
            <Button onClick={exportRanges} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>

          <Tabs value={activeSequence} onValueChange={(v) => setActiveSequence(v as SequenceType)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="OPEN_RAISE">Open Raise</TabsTrigger>
              <TabsTrigger value="RAISE_OVER_LIMP">Raise Over Limp</TabsTrigger>
              <TabsTrigger value="3BET">3Bet</TabsTrigger>
              <TabsTrigger value="SQUEEZE">Squeeze</TabsTrigger>
              <TabsTrigger value="COLD_4BET">Cold 4Bet</TabsTrigger>
            </TabsList>

            <TabsContent value="OPEN_RAISE" className="mt-6">
              <OpenRaiseSequence onSave={saveRange} />
            </TabsContent>

            <TabsContent value="RAISE_OVER_LIMP" className="mt-6">
              <RaiseOverLimpSequence onSave={saveRange} />
            </TabsContent>

            <TabsContent value="3BET" className="mt-6">
              <ThreeBetSequence onSave={saveRange} />
            </TabsContent>

            <TabsContent value="SQUEEZE" className="mt-6">
              <SqueezeSequence onSave={saveRange} />
            </TabsContent>

            <TabsContent value="COLD_4BET" className="mt-6">
              <Cold4BetSequence onSave={saveRange} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <aside className="w-80 border-l bg-card p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Saved Ranges</h2>
        <div className="space-y-2">
          {savedRanges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved ranges yet</p>
          ) : (
            savedRanges.map((range) => (
              <Card key={range.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{range.name}</p>
                    <p className="text-xs text-muted-foreground">{range.sequence}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRange(range.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
