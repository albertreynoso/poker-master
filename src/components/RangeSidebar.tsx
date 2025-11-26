import { useState } from 'react';
import { RangeFolder, PokerRange } from '@/types/poker';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { ChevronDown, ChevronRight, Folder, File, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RangeSidebarProps {
  folders: RangeFolder[];
  selectedRange: PokerRange | null;
  onSelectRange: (range: PokerRange) => void;
  onAddFolder: (name: string) => void;
  onAddRange: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDeleteRange: (rangeId: string) => void;
  onToggleFolder: (folderId: string) => void;
}

export function RangeSidebar({
  folders,
  selectedRange,
  onSelectRange,
  onAddFolder,
  onAddRange,
  onDeleteFolder,
  onDeleteRange,
  onToggleFolder,
}: RangeSidebarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [addRangeFolderId, setAddRangeFolderId] = useState<string | null>(null);
  const [newRangeName, setNewRangeName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowAddFolder(false);
    }
  };

  const handleAddRange = (folderId: string) => {
    if (newRangeName.trim()) {
      onAddRange(folderId, newRangeName.trim());
      setNewRangeName('');
      setAddRangeFolderId(null);
    }
  };

  const renderFolder = (folder: RangeFolder, depth: number = 0) => (
    <div key={folder.id} className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer group",
          depth > 0 && "ml-4"
        )}
      >
        <button
          onClick={() => onToggleFolder(folder.id)}
          className="p-0 h-auto hover:bg-transparent"
        >
          {folder.isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium text-foreground">{folder.name}</span>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <button
            onClick={() => setAddRangeFolderId(folder.id)}
            className="p-1 hover:bg-accent rounded"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDeleteFolder(folder.id)}
            className="p-1 hover:bg-destructive/20 rounded"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
      </div>

      {folder.isExpanded && (
        <div className="space-y-1">
          {addRangeFolderId === folder.id && (
            <div className={cn("flex gap-2 px-2 py-1", depth > 0 && "ml-4")}>
              <Input
                value={newRangeName}
                onChange={(e) => setNewRangeName(e.target.value)}
                placeholder="Range name"
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleAddRange(folder.id)}
              />
              <Button
                size="sm"
                onClick={() => handleAddRange(folder.id)}
                className="h-7 px-2"
              >
                Add
              </Button>
            </div>
          )}

          {folder.ranges.map((range) => (
            <div
              key={range.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/50 cursor-pointer group ml-8",
                selectedRange?.id === range.id && "bg-accent"
              )}
              onClick={() => onSelectRange(range)}
            >
              <File className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">{range.name}</span>
              <span className="text-xs text-muted-foreground">
                {range.totalPercentage}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRange(range.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-80 border-r bg-card flex flex-col h-screen">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg text-foreground">My Ranges</h2>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {folders.map((folder) => renderFolder(folder))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        {showAddFolder ? (
          <div className="flex gap-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            />
            <Button size="sm" onClick={handleAddFolder}>
              Add
            </Button>
          </div>
        ) : (
          <Button onClick={() => setShowAddFolder(true)} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Folder
          </Button>
        )}
      </div>
    </div>
  );
}
