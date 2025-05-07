import { Setting } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface EditSettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: Setting | null;
  formData: Record<string, string>;
  handleInputChange: (field: string, value: string) => void;
  handleEditSetting: () => Promise<void>;
}

const EditSettingDialog: React.FC<EditSettingDialogProps> = ({
  open,
  onOpenChange,
  setting,
  formData,
  handleInputChange,
  handleEditSetting
}) => {
  if (!setting) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
        <DialogHeader>
          <DialogTitle className="text-terminal-cyan">Edit Guideline</DialogTitle>
          <DialogDescription className="text-terminal-muted">
            Edit the guideline value below. The key cannot be changed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-terminal-orange font-mono">
            {setting.key}
          </div>
          <textarea 
            value={formData[`edit_${setting.key}` as keyof typeof formData] as string || setting.value}
            onChange={(e) => handleInputChange(`edit_${setting.key}`, e.target.value)}
            className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
            placeholder="Enter guideline value..."
          />
        </div>
        
        <DialogFooter>
          <button
            className="bg-terminal-muted hover:bg-terminal-dark text-terminal-text py-1 px-3 rounded text-sm transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm transition-colors"
            onClick={handleEditSetting}
          >
            Save Changes
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSettingDialog;
