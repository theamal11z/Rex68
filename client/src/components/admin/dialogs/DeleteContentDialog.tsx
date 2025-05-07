import { Content } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface DeleteContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentToDelete: Content | null;
  handleDeleteContent: () => Promise<void>;
  formatDate: (dateString: string | Date) => string;
}

const DeleteContentDialog: React.FC<DeleteContentDialogProps> = ({
  open,
  onOpenChange,
  contentToDelete,
  handleDeleteContent,
  formatDate
}) => {
  if (!contentToDelete) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
        <DialogHeader>
          <DialogTitle className="text-terminal-red">Delete Content</DialogTitle>
          <DialogDescription className="text-terminal-muted">
            Are you sure you want to delete this content? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-between items-center mb-2">
            <Badge className="bg-terminal-purple text-white">
              {contentToDelete.type}
            </Badge>
            <span className="text-terminal-muted text-xs">{formatDate(contentToDelete.timestamp)}</span>
          </div>
          <div className="text-terminal-text text-sm whitespace-pre-wrap break-words bg-terminal-bg p-2 rounded">
            {contentToDelete.content}
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
            onClick={handleDeleteContent}
          >
            Delete Content
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteContentDialog;
