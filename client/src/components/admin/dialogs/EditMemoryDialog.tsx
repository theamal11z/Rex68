import React, { useState, useEffect } from 'react';
import { Memory } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

interface EditMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
  handleEditMemory: (memory: Memory, updatedContext: any) => Promise<void>;
}

const EditMemoryDialog: React.FC<EditMemoryDialogProps> = ({ open, onOpenChange, memory, handleEditMemory }) => {
  const toast = useToast();
  const [jsonStr, setJsonStr] = useState<string>('');

  useEffect(() => {
    if (memory) {
      setJsonStr(JSON.stringify(memory.context, null, 2));
    }
  }, [memory]);

  if (!memory) return null;

  const onSave = async () => {
    try {
      const updatedContext = JSON.parse(jsonStr);
      await handleEditMemory(memory, updatedContext);
      onOpenChange(false);
    } catch (err) {
      toast.toast({
        title: "Error",
        description: "Invalid JSON",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
        <DialogHeader>
          <DialogTitle>Edit Memory</DialogTitle>
          <DialogDescription>Edit the memory context as JSON</DialogDescription>
        </DialogHeader>
        <textarea
          className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-48 text-sm"
          value={jsonStr}
          onChange={(e) => setJsonStr(e.target.value)}
        />
        <DialogFooter>
          <button
            className="bg-terminal-muted hover:bg-terminal-dark text-terminal-text py-1 px-3 rounded text-sm transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm transition-colors"
            onClick={onSave}
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditMemoryDialog;
