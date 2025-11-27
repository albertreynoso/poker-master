import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { SequenceType, CashRange, CashHandMatrix } from '@/types/cashGame';
import { OpenRaiseSequence } from '@/components/cashgame/OpenRaiseSequence';
import { RaiseOverLimpSequence } from '@/components/cashgame/RaiseOverLimpSequence';
import { ThreeBetSequence } from '@/components/cashgame/ThreeBetSequence';
import { SqueezeSequence } from '@/components/cashgame/SqueezeSequence';
import { Cold4BetSequence } from '@/components/cashgame/Cold4BetSequence';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const sequences = [
    { id: 'OPEN_RAISE' as SequenceType, label: 'Open Raise' },
    { id: 'RAISE_OVER_LIMP' as SequenceType, label: 'Raise Over Limp' },
    { id: '3BET' as SequenceType, label: '3Bet / 4Bet / 5Bet' },
    { id: 'SQUEEZE' as SequenceType, label: 'Squeeze / Call' },
    { id: 'COLD_4BET' as SequenceType, label: 'Cold 4Bet' },
  ];

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar - Sequence Selector */}
      <aside className="w-56 border-r bg-card overflow-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Secuencias</h2>
          <div className="space-y-1">
            {sequences.map((seq) => (
              <button
                key={seq.id}
                onClick={() => setActiveSequence(seq.id)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                  activeSequence === seq.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {seq.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Rangos Cash</h1>
          </div>

          {activeSequence === 'OPEN_RAISE' && (
            <OpenRaiseSequence onSave={saveRange} />
          )}

          {activeSequence === 'RAISE_OVER_LIMP' && (
            <RaiseOverLimpSequence onSave={saveRange} />
          )}

          {activeSequence === '3BET' && (
            <ThreeBetSequence onSave={saveRange} />
          )}

          {activeSequence === 'SQUEEZE' && (
            <SqueezeSequence onSave={saveRange} />
          )}

          {activeSequence === 'COLD_4BET' && (
            <Cold4BetSequence onSave={saveRange} />
          )}
        </div>
      </div>
    </div>
  );
}
