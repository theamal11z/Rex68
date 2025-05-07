import { Setting } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface DeleteSettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: Setting | null;
  handleDeleteSetting: () => Promise<void>;
}

const DeleteSettingDialog: React.FC<DeleteSettingDialogProps> = ({
  open,
  onOpenChange,
  setting,
  handleDeleteSetting
}) => {
  if (!setting) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
        <DialogHeader>
          <DialogTitle className="text-terminal-red">Delete Guideline</DialogTitle>
          <DialogDescription className="text-terminal-muted">
            Are you sure you want to delete this guideline? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-terminal-orange font-mono mb-2">
            {setting.key}
          </div>
          <div className="text-terminal-text text-sm whitespace-pre-wrap break-words bg-terminal-bg p-2 rounded">
            {setting.value}
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
            onClick={handleDeleteSetting}
          >
            Delete Guideline
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSettingDialog;
