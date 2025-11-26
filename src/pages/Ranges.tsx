import { useState, useEffect } from 'react';
import { RangeGrid } from '@/components/RangeGrid';
import { RangeSidebar } from '@/components/RangeSidebar';
import { RangeStats } from '@/components/RangeStats';
import { RangeFolder, PokerRange, HandMatrix, calculatePercentage, calculateCombinations } from '@/types/poker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Download } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'poker-ranges';

const Ranges = () => {
  const [folders, setFolders] = useState<RangeFolder[]>([]);
  const [currentHands, setCurrentHands] = useState<HandMatrix>({});
  const [selectedRange, setSelectedRange] = useState<PokerRange | null>(null);
  const [currentRangeName, setCurrentRangeName] = useState('Untitled Range');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFolders(parsed);
      } catch (e) {
        console.error('Failed to parse stored ranges', e);
      }
    } else {
      // Initialize with default folders
      const defaultFolders: RangeFolder[] = [
        {
          id: 'default-1',
          name: 'My Ranges',
          ranges: [],
          isExpanded: true,
        },
        {
          id: 'default-2',
          name: 'Position Ranges',
          ranges: [],
          isExpanded: false,
        },
      ];
      setFolders(defaultFolders);
    }
  }, []);

  // Save to localStorage whenever folders change
  useEffect(() => {
    if (folders.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    }
  }, [folders]);

  const handleAddFolder = (name: string) => {
    const newFolder: RangeFolder = {
      id: `folder-${Date.now()}`,
      name,
      ranges: [],
      isExpanded: true,
    };
    setFolders([...folders, newFolder]);
    toast.success(`Folder "${name}" created`);
  };

  const handleAddRange = (folderId: string, name: string) => {
    const newRange: PokerRange = {
      id: `range-${Date.now()}`,
      name,
      hands: { ...currentHands },
      totalPercentage: calculatePercentage(currentHands),
      combinations: calculateCombinations(currentHands),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFolders(
      folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, ranges: [...folder.ranges, newRange] }
          : folder
      )
    );
    toast.success(`Range "${name}" saved`);
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter((f) => f.id !== folderId));
    toast.success('Folder deleted');
  };

  const handleDeleteRange = (rangeId: string) => {
    setFolders(
      folders.map((folder) => ({
        ...folder,
        ranges: folder.ranges.filter((r) => r.id !== rangeId),
      }))
    );
    if (selectedRange?.id === rangeId) {
      setSelectedRange(null);
    }
    toast.success('Range deleted');
  };

  const handleToggleFolder = (folderId: string) => {
    setFolders(
      folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };

  const handleSelectRange = (range: PokerRange) => {
    setSelectedRange(range);
    setCurrentHands(range.hands);
    setCurrentRangeName(range.name);
  };

  const handleSaveCurrentRange = () => {
    if (selectedRange) {
      // Update existing range
      const updatedRange: PokerRange = {
        ...selectedRange,
        hands: currentHands,
        totalPercentage: calculatePercentage(currentHands),
        combinations: calculateCombinations(currentHands),
        updatedAt: new Date().toISOString(),
      };

      setFolders(
        folders.map((folder) => ({
          ...folder,
          ranges: folder.ranges.map((r) =>
            r.id === selectedRange.id ? updatedRange : r
          ),
        }))
      );
      setSelectedRange(updatedRange);
      toast.success('Range updated');
    } else {
      toast.info('Select a folder and add a new range to save');
    }
  };

  const handleExportRange = () => {
    const dataStr = JSON.stringify(
      {
        name: currentRangeName,
        hands: currentHands,
        totalPercentage: calculatePercentage(currentHands),
        combinations: calculateCombinations(currentHands),
      },
      null,
      2
    );
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentRangeName}.json`;
    link.click();
    toast.success('Range exported');
  };

  return (
    <div className="flex h-screen w-full">
      <RangeSidebar
        folders={folders}
        selectedRange={selectedRange}
        onSelectRange={handleSelectRange}
        onAddFolder={handleAddFolder}
        onAddRange={handleAddRange}
        onDeleteFolder={handleDeleteFolder}
        onDeleteRange={handleDeleteRange}
        onToggleFolder={handleToggleFolder}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input
                value={currentRangeName}
                onChange={(e) => setCurrentRangeName(e.target.value)}
                className="text-lg font-semibold"
                placeholder="Range name..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveCurrentRange} variant="default">
                <Save className="h-4 w-4 mr-2" />
                Save Range
              </Button>
              <Button onClick={handleExportRange} variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RangeGrid hands={currentHands} onChange={setCurrentHands} />
            </div>
            <div>
              <RangeStats hands={currentHands} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranges;
