import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface DeleteConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: string;
  handleDeleteConversation: () => Promise<void>;
}

const DeleteConversationDialog: React.FC<DeleteConversationDialogProps> = ({
  open,
  onOpenChange,
  userToDelete,
  handleDeleteConversation
}) => {
  if (!userToDelete) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
        <DialogHeader>
          <DialogTitle className="text-terminal-red">Delete Conversation</DialogTitle>
          <DialogDescription className="text-terminal-muted">
            Are you sure you want to delete this conversation? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-terminal-orange font-mono mb-2">
            User ID: {userToDelete}
          </div>
          <div className="text-terminal-text text-sm bg-terminal-bg p-2 rounded">
            This will permanently delete all messages for this user.
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
            onClick={handleDeleteConversation}
          >
            Delete Conversation
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConversationDialog;
