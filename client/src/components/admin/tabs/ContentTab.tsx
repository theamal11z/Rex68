import { Content } from '@/types';
import { Badge } from "@/components/ui/badge";

interface ContentTabProps {
  contents: Content[];
  contentType: string;
  setContentType: (type: string) => void;
  formData: Record<string, string>;
  handleInputChange: (field: string, value: string) => void;
  addContent: () => Promise<void>;
  openDeleteContentDialog: (content: Content) => void;
  formatDate: (dateString: string | Date) => string;
}

const ContentTab: React.FC<ContentTabProps> = ({
  contents,
  contentType,
  setContentType,
  formData,
  handleInputChange,
  addContent,
  openDeleteContentDialog,
  formatDate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Content Creation */}
      <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
        <h3 className="text-terminal-green mb-2">Create Content</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-terminal-muted mb-1 text-sm">Content Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
            >
              <option value="microblog">Microblog</option>
              <option value="reflection">Reflection</option>
              <option value="quote">Quote</option>
              <option value="insight">Personal Insight</option>
            </select>
          </div>
          
          <div>
            <label className="block text-terminal-muted mb-1 text-sm">Content</label>
            <textarea
              value={formData.new_content}
              onChange={(e) => handleInputChange('new_content', e.target.value)}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
              placeholder="Enter content here..."
            />
            <button 
              className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-1 transition-colors"
              onClick={addContent}
              disabled={!formData.new_content}
            >
              Add {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </button>
          </div>
        </div>
      </div>
      
      {/* Content List */}
      <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
        <h3 className="text-terminal-green mb-2">Content Library</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {contents.length > 0 ? contents.map(content => (
            <div key={content.id} className="bg-terminal-bg p-3 rounded border border-terminal-muted">
              <div className="flex justify-between items-center mb-2">
                <Badge className="bg-terminal-purple text-white">
                  {content.type}
                </Badge>
                <div className="flex items-center space-x-3">
                  <span className="text-terminal-muted text-xs">{formatDate(content.timestamp)}</span>
                  <button
                    className="text-terminal-red text-xs hover:text-terminal-orange"
                    onClick={() => openDeleteContentDialog(content)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-terminal-text text-sm whitespace-pre-wrap break-words">
                {content.content}
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-terminal-muted">
              No content available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentTab;
