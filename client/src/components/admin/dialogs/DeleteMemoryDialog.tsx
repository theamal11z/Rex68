import React from 'react';
import { Memory } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

interface DeleteMemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory: Memory | null;
  handleDeleteMemory: (memoryId: number) => Promise<void>;
}

const DeleteMemoryDialog: React.FC<DeleteMemoryDialogProps> = ({ open, onOpenChange, memory, handleDeleteMemory }) => {
  const { toast } = useToast();
  if (!memory) return null;

  const onDelete = async () => {
    try {
      await handleDeleteMemory(memory.id);
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete memory", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
        <DialogHeader>
          <DialogTitle className="text-terminal-red">Delete Memory</DialogTitle>
          <DialogDescription className="text-terminal-muted">
            Are you sure you want to delete this memory? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-terminal-text text-sm whitespace-pre-wrap break-words bg-terminal-bg p-2 rounded">
            {memory.context.notes || JSON.stringify(memory.context, null, 2)}
          </div>
        </div>
        <DialogFooter>
          <button
            className="bg-terminal-muted hover:bg-terminal-dark text-terminal-text py-1 px-3 rounded text-sm transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            className="bg-terminal-red hover:bg-terminal-orange text-white py-1 px-3 rounded text-sm transition-colors"
            onClick={onDelete}
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMemoryDialog;
