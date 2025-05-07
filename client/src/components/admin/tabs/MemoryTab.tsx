import { Memory } from '@/types';

interface MemoryTabProps {
  memories: Memory[];
  formData: Record<string, string>;
  handleInputChange: (field: string, value: string) => void;
  createMemory: () => Promise<void>;
  formatDate: (dateString: string | Date) => string;
}

const MemoryTab: React.FC<MemoryTabProps> = ({
  memories,
  formData,
  handleInputChange,
  createMemory,
  formatDate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Memory Creation */}
      <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
        <h3 className="text-terminal-green mb-2">Create Memory</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-terminal-muted mb-1 text-sm">User ID</label>
            <input
              type="text"
              value={formData.new_memory_userId}
              onChange={(e) => handleInputChange('new_memory_userId', e.target.value)}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
              placeholder="Enter a user ID..."
            />
          </div>
          
          <div>
            <label className="block text-terminal-muted mb-1 text-sm">Context</label>
            <textarea
              value={formData.new_memory_context}
              onChange={(e) => handleInputChange('new_memory_context', e.target.value)}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
              placeholder="Enter context as JSON or plain text..."
            />
            <div className="text-terminal-muted text-xs mt-1 mb-2">
              You can enter a simple string, or a JSON object with sentiment, lastInteraction, and notes fields.
            </div>
            <button 
              className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm transition-colors"
              onClick={createMemory}
              disabled={!formData.new_memory_userId || !formData.new_memory_context}
            >
              Create Memory
            </button>
          </div>
        </div>
      </div>
      
      {/* Memory List */}
      <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
        <h3 className="text-terminal-green mb-2">Memory Store</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {memories && memories.length > 0 ? memories.map((memory, idx) => (
            <div key={memory?.id || memory?.userId || idx} className="bg-terminal-bg p-3 rounded border border-terminal-muted">
              <div className="flex justify-between items-center mb-2">
                <span className="text-terminal-orange text-sm font-mono">{memory?.userId || 'Unknown User'}</span>
                <span className="text-terminal-muted text-xs">
                  {memory?.context?.lastInteraction ? formatDate(memory.context.lastInteraction) : 'No date'}
                </span>
              </div>
              <div>
                <span className="text-terminal-cyan text-xs mr-2">Sentiment:</span>
                <span className="text-terminal-text text-xs">{memory?.context?.sentiment || 'neutral'}</span>
              </div>
              <div className="text-terminal-text text-sm whitespace-pre-wrap break-words mt-2">
                {memory?.context ? (memory.context.notes || JSON.stringify(memory.context, null, 2)) : 'No context data'}
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-terminal-muted">
              No memories available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryTab;
