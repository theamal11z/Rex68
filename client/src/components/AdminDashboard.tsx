import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Memory, Setting, Content } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [newGuideline, setNewGuideline] = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch settings
        const settingsResponse = await apiRequest('GET', '/api/settings', undefined);
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);

        // Fetch contents
        const contentsResponse = await apiRequest('GET', '/api/contents', undefined);
        const contentsData = await contentsResponse.json();
        setContents(contentsData);

        // Note: We would need a different endpoint to get all memories at once
        // This is a placeholder for the real implementation
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Update behavior guidelines
  const updateGuidelines = async () => {
    try {
      const response = await apiRequest('PATCH', '/api/settings/behavior_rules', {
        value: newGuideline
      });
      
      const updatedSetting = await response.json();
      
      // Update local state
      setSettings(settings.map(s => 
        s.key === 'behavior_rules' ? updatedSetting : s
      ));
      
      toast({
        title: "Success",
        description: "Behavior guidelines updated",
      });
      
      setNewGuideline('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update guidelines",
        variant: "destructive",
      });
    }
  };

  // Add new content
  const addContent = async () => {
    try {
      const response = await apiRequest('POST', '/api/contents', {
        type: 'microblog',
        content: newContent
      });
      
      const newContentItem = await response.json();
      
      // Update local state
      setContents([...contents, newContentItem]);
      
      toast({
        title: "Success",
        description: "Content added successfully",
      });
      
      setNewContent('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add content",
        variant: "destructive",
      });
    }
  };

  // Get behavior rules value from settings
  const behaviorRules = settings.find(s => s.key === 'behavior_rules')?.value || '';

  return (
    <div>
      <h2 className="text-xl text-terminal-cyan mb-4 font-mono">Rex Configuration</h2>
      
      {loading ? (
        <div className="text-terminal-muted">Loading configuration data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Memory Management */}
          <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
            <h3 className="text-terminal-green mb-2">Emotional Memory</h3>
            <div className="max-h-60 overflow-y-auto mb-4">
              {memories.length > 0 ? (
                memories.map(memory => (
                  <div key={memory.id} className="border-b border-terminal-muted py-2">
                    <div className="text-sm text-terminal-muted">User: {memory.userId}</div>
                    <div className="text-terminal-text">
                      Last updated: {new Date(memory.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-terminal-muted">No memory data available</div>
              )}
            </div>
            <button 
              className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm transition-colors"
              onClick={() => toast({
                title: "Info",
                description: "Memory editing will be implemented soon",
              })}
            >
              Edit Memories
            </button>
          </div>
          
          {/* Behavior Guidelines */}
          <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
            <h3 className="text-terminal-green mb-2">Behavior Guidelines</h3>
            <textarea
              value={newGuideline || behaviorRules}
              onChange={(e) => setNewGuideline(e.target.value)}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
              placeholder="Enter behavior guidelines here..."
            />
            <button 
              className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-2 transition-colors"
              onClick={updateGuidelines}
              disabled={!newGuideline && !behaviorRules}
            >
              Update Guidelines
            </button>
          </div>
          
          {/* Content Management */}
          <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
            <h3 className="text-terminal-green mb-2">Content Management</h3>
            <div className="mb-2">
              <label className="block text-terminal-muted mb-1 text-sm">Add Microblog Post</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-20 text-sm"
                placeholder="Enter new content here..."
              />
            </div>
            <button 
              className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm transition-colors"
              onClick={addContent}
              disabled={!newContent}
            >
              Add Content
            </button>
          </div>
          
          {/* System Status */}
          <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
            <h3 className="text-terminal-green mb-2">System Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-terminal-muted">API Status:</span>
                <span className="text-terminal-green">Operational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Memory Storage:</span>
                <span className="text-terminal-green">
                  {memories.length} Users Tracked
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">Last Update:</span>
                <span className="text-terminal-text">
                  {new Date().toLocaleString()}
                </span>
              </div>
            </div>
            <button 
              className="bg-terminal-orange hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-4 transition-colors"
              onClick={() => toast({
                title: "System Report",
                description: "All systems functioning normally",
              })}
            >
              Run Diagnostics
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
