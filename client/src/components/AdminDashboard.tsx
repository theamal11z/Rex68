import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Memory, Setting, Content, Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const AdminDashboard: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [contentType, setContentType] = useState<string>('microblog');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personality');
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    greeting_style: '',
    behavior_rules: '',
    personality: '',
    language_preference: '',
    new_content: '',
    new_memory_userId: '',
    new_memory_context: '',
    api_key: ''
  });

  // Fetch all data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch settings
        const settingsResponse = await apiRequest('GET', '/api/settings', undefined);
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
        // Update form data with settings
        const formUpdate = {...formData};
        settingsData.forEach((setting: Setting) => {
          if (formUpdate.hasOwnProperty(setting.key)) {
            // @ts-ignore - we know the properties exist
            formUpdate[setting.key] = setting.value;
          }
        });
        setFormData(formUpdate);

        // Fetch contents
        const contentsResponse = await apiRequest('GET', '/api/contents', undefined);
        const contentsData = await contentsResponse.json();
        setContents(contentsData);

        // Since we can't get all memories at once, we'll fetch them when needed
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

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Update a setting
  const updateSetting = async (key: string) => {
    if (!formData[key as keyof typeof formData]) {
      toast({
        title: "Error",
        description: "Value cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest('PATCH', `/api/settings/${key}`, {
        value: formData[key as keyof typeof formData]
      });
      
      const updatedSetting = await response.json();
      
      // Update local state
      setSettings(settings.map(s => 
        s.key === key ? updatedSetting : s
      ));
      
      toast({
        title: "Success",
        description: `${key.replace('_', ' ')} setting updated`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${key.replace('_', ' ')}`,
        variant: "destructive",
      });
    }
  };

  // Add new content
  const addContent = async () => {
    if (!formData.new_content) {
      toast({
        title: "Error",
        description: "Content cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/api/contents', {
        type: contentType,
        content: formData.new_content
      });
      
      const newContentItem = await response.json();
      
      // Update local state
      setContents([...contents, newContentItem]);
      
      toast({
        title: "Success",
        description: `${contentType} added successfully`,
      });
      
      handleInputChange('new_content', '');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add content",
        variant: "destructive",
      });
    }
  };

  // Fetch conversations for a user
  const fetchConversations = async (userId: string) => {
    if (!userId) return;
    
    try {
      const response = await apiRequest('GET', `/api/messages/${userId}`, undefined);
      const messages = await response.json();
      
      setConversations({
        ...conversations,
        [userId]: messages
      });
      
      setActiveUserId(userId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch conversation history",
        variant: "destructive",
      });
    }
  };

  // Create a new memory
  const createMemory = async () => {
    if (!formData.new_memory_userId || !formData.new_memory_context) {
      toast({
        title: "Error",
        description: "Both user ID and context are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Try to parse the context as JSON
      let contextObj;
      try {
        contextObj = JSON.parse(formData.new_memory_context);
      } catch (e) {
        // If it fails, use it as a string with sentiment
        contextObj = { 
          sentiment: "neutral",
          lastInteraction: new Date().toISOString(),
          notes: formData.new_memory_context
        };
      }
      
      const response = await apiRequest('POST', '/api/memory', {
        userId: formData.new_memory_userId,
        context: contextObj
      });
      
      const newMemory = await response.json();
      
      // Update local state
      setMemories([...memories, newMemory]);
      
      toast({
        title: "Success",
        description: "Memory created successfully",
      });
      
      handleInputChange('new_memory_userId', '');
      handleInputChange('new_memory_context', '');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create memory",
        variant: "destructive",
      });
    }
  };

  // Format a date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <h2 className="text-xl text-terminal-cyan mb-4 font-mono">Rex Configuration Panel</h2>
      
      {loading ? (
        <div className="text-terminal-muted">Loading configuration data...</div>
      ) : (
        <Tabs defaultValue="personality" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4 bg-terminal-dark border border-terminal-muted">
            <TabsTrigger value="personality" className="data-[state=active]:bg-terminal-cyan data-[state=active]:text-black">
              Personality
            </TabsTrigger>
            <TabsTrigger value="language" className="data-[state=active]:bg-terminal-cyan data-[state=active]:text-black">
              Language
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-terminal-cyan data-[state=active]:text-black">
              Content
            </TabsTrigger>
            <TabsTrigger value="memory" className="data-[state=active]:bg-terminal-cyan data-[state=active]:text-black">
              Memory
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-terminal-cyan data-[state=active]:text-black">
              Conversations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personality" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {/* Personality Settings */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Personality Settings</h3>
                
                <div className="space-y-4">
                  {/* Greeting Style */}
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Greeting Style</label>
                    <textarea
                      value={formData.greeting_style}
                      onChange={(e) => handleInputChange('greeting_style', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-20 text-sm"
                      placeholder="How Rex greets users..."
                    />
                    <button 
                      className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-1 transition-colors"
                      onClick={() => updateSetting('greeting_style')}
                      disabled={!formData.greeting_style}
                    >
                      Update Greeting
                    </button>
                  </div>
                  
                  {/* Personality Traits */}
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Personality Traits</label>
                    <textarea
                      value={formData.personality}
                      onChange={(e) => handleInputChange('personality', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-20 text-sm"
                      placeholder="Comma-separated personality traits..."
                    />
                    <button 
                      className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-1 transition-colors"
                      onClick={() => updateSetting('personality')}
                      disabled={!formData.personality}
                    >
                      Update Personality
                    </button>
                  </div>
                  
                  {/* Behavior Rules */}
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Behavior Guidelines</label>
                    <textarea
                      value={formData.behavior_rules}
                      onChange={(e) => handleInputChange('behavior_rules', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
                      placeholder="Guidelines for how Rex should behave..."
                    />
                    <button 
                      className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-1 transition-colors"
                      onClick={() => updateSetting('behavior_rules')}
                      disabled={!formData.behavior_rules}
                    >
                      Update Guidelines
                    </button>
                  </div>
                </div>
              </div>
              
              {/* API Configuration */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">API Configuration</h3>
                <div>
                  <label className="block text-terminal-muted mb-1 text-sm">Gemini API Key</label>
                  <div className="flex">
                    <input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => handleInputChange('api_key', e.target.value)}
                      className="flex-1 bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded-l text-sm"
                      placeholder="Enter Gemini API key"
                    />
                    <button 
                      className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded-r text-sm transition-colors"
                      onClick={() => updateSetting('api_key')}
                      disabled={!formData.api_key}
                    >
                      Update Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="language" className="mt-0">
            <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
              <h3 className="text-terminal-green mb-2">Language Settings</h3>
              
              <div className="space-y-4">
                {/* Language Preference */}
                <div>
                  <label className="block text-terminal-muted mb-1 text-sm">Language Preference</label>
                  <select
                    value={formData.language_preference}
                    onChange={(e) => handleInputChange('language_preference', e.target.value)}
                    className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
                  >
                    <option value="English only">English only</option>
                    <option value="English with Hinglish when user initiates">English with Hinglish when user initiates</option>
                    <option value="Mix of English and Hinglish">Mix of English and Hinglish</option>
                    <option value="Primarily Hinglish">Primarily Hinglish</option>
                  </select>
                  <button 
                    className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-2 transition-colors"
                    onClick={() => updateSetting('language_preference')}
                  >
                    Update Language Preference
                  </button>
                </div>
                
                {/* Custom Response Templates */}
                <div>
                  <h4 className="text-terminal-cyan text-sm mb-2">Response Templates</h4>
                  <p className="text-terminal-muted text-sm mb-4">
                    Add custom response templates for different situations to maintain consistent tone and style.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="bg-terminal-bg p-3 rounded border border-terminal-muted">
                      <div className="text-terminal-green text-xs mb-1">Error Response</div>
                      <p className="text-terminal-text text-sm">I'm sorry, I'm having trouble understanding. Could you rephrase that?</p>
                    </div>
                    
                    <div className="bg-terminal-bg p-3 rounded border border-terminal-muted">
                      <div className="text-terminal-green text-xs mb-1">Emotional Support</div>
                      <p className="text-terminal-text text-sm">I hear you. That sounds really challenging. What would help you right now?</p>
                    </div>
                  </div>
                  
                  <button 
                    className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-3 transition-colors"
                    onClick={() => toast({
                      title: "Feature Coming Soon",
                      description: "Custom response template editor will be available in the next update."
                    })}
                  >
                    Edit Templates
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Content Creation */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Create Content</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Content Type</label>
                    <select
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
                    >
                      <option value="microblog">Microblog Post</option>
                      <option value="reflection">Personal Reflection</option>
                      <option value="quote">Quote</option>
                      <option value="fact">Interesting Fact</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Content</label>
                    <textarea
                      value={formData.new_content}
                      onChange={(e) => handleInputChange('new_content', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
                      placeholder="Enter your content here..."
                    />
                  </div>
                  
                  <button 
                    className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-2 transition-colors"
                    onClick={addContent}
                    disabled={!formData.new_content}
                  >
                    Add Content
                  </button>
                </div>
              </div>
              
              {/* Content Browser */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Content Library</h3>
                
                <div className="space-y-1 mb-2">
                  <button 
                    className={`py-1 px-2 text-xs rounded-full mr-1 ${contentType === 'all' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-muted'}`}
                    onClick={() => setContentType('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`py-1 px-2 text-xs rounded-full mr-1 ${contentType === 'microblog' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-muted'}`}
                    onClick={() => setContentType('microblog')}
                  >
                    Microblogs
                  </button>
                  <button 
                    className={`py-1 px-2 text-xs rounded-full mr-1 ${contentType === 'reflection' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-muted'}`}
                    onClick={() => setContentType('reflection')}
                  >
                    Reflections
                  </button>
                  <button 
                    className={`py-1 px-2 text-xs rounded-full ${contentType === 'quote' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-muted'}`}
                    onClick={() => setContentType('quote')}
                  >
                    Quotes
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto mt-3">
                  {contents.length > 0 ? (
                    <div className="space-y-3">
                      {contents
                        .filter(content => contentType === 'all' || content.type === contentType)
                        .map(content => (
                          <div key={content.id} className="bg-terminal-bg p-3 rounded border border-terminal-muted">
                            <div className="flex justify-between items-start mb-1">
                              <Badge variant="outline" className="text-terminal-orange text-xs capitalize">
                                {content.type}
                              </Badge>
                              <span className="text-terminal-muted text-xs">
                                {formatDate(content.timestamp)}
                              </span>
                            </div>
                            <p className="text-terminal-text text-sm whitespace-pre-wrap">
                              {content.content}
                            </p>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="text-terminal-muted text-center py-8">
                      No content available. Create some!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="memory" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Add Memory */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Create Memory</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">User ID</label>
                    <input
                      type="text"
                      value={formData.new_memory_userId}
                      onChange={(e) => handleInputChange('new_memory_userId', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
                      placeholder="Enter user ID (e.g. user_abcd1234)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Context (JSON or plain text)</label>
                    <textarea
                      value={formData.new_memory_context}
                      onChange={(e) => handleInputChange('new_memory_context', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm font-mono"
                      placeholder='{"sentiment": "positive", "interests": ["tech", "philosophy"], "notes": "Enjoys discussing AI ethics"}'
                    />
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
              
              {/* Memory Browser */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Memory Explorer</h3>
                
                <div className="text-terminal-muted text-sm mb-4">
                  Memories will be shown here as they are created. You can also view them by selecting a user's conversation history.
                </div>
                
                <div className="space-y-2">
                  {memories.length > 0 ? (
                    memories.map(memory => (
                      <div key={memory.id} className="bg-terminal-bg p-3 rounded border border-terminal-muted">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-terminal-green text-sm">User: {memory.userId}</span>
                          <span className="text-terminal-muted text-xs">{formatDate(memory.lastUpdated)}</span>
                        </div>
                        <pre className="text-terminal-text text-xs overflow-x-auto">
                          {JSON.stringify(memory.context, null, 2)}
                        </pre>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-terminal-muted">
                      No memories available yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="logs" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User IDs */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Conversation History</h3>
                
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Enter a user ID to fetch"
                    value={activeUserId}
                    onChange={(e) => setActiveUserId(e.target.value)}
                    className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
                  />
                  <button 
                    className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-2 w-full transition-colors"
                    onClick={() => fetchConversations(activeUserId)}
                    disabled={!activeUserId}
                  >
                    Fetch Conversations
                  </button>
                </div>
                
                <div className="text-terminal-muted text-xs mb-2">
                  User IDs from known conversations:
                </div>
                <div className="space-y-1">
                  {Object.keys(conversations).map(userId => (
                    <button
                      key={userId}
                      className={`block w-full text-left py-1 px-2 rounded text-xs ${userId === activeUserId ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-text'}`}
                      onClick={() => setActiveUserId(userId)}
                    >
                      {userId}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Conversation Display */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted md:col-span-2">
                <h3 className="text-terminal-green mb-2">
                  {activeUserId ? `Conversation with ${activeUserId}` : 'Select a User'}
                </h3>
                
                {activeUserId && conversations[activeUserId] ? (
                  <div className="bg-terminal-bg rounded border border-terminal-muted p-2 h-96 overflow-y-auto font-mono text-sm">
                    {conversations[activeUserId].map((message, index) => (
                      <div key={index} className={`mb-3 ${message.isFromUser ? 'pl-4' : 'pl-0'}`}>
                        <div className="flex items-start">
                          <span className={`mr-2 ${message.isFromUser ? 'text-terminal-orange' : 'text-terminal-pink'}`}>
                            {message.isFromUser ? 'user>' : 'rex>'}
                          </span>
                          <span className={`${message.isFromUser ? 'text-terminal-text' : 'text-terminal-green'}`}>
                            {message.content}
                          </span>
                        </div>
                        <div className="text-terminal-muted text-xs mt-1 pl-6">
                          {formatDate(message.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-terminal-muted text-center py-16">
                    {activeUserId 
                      ? "No conversation history found for this user" 
                      : "Select a user to view their conversation history"}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminDashboard;
