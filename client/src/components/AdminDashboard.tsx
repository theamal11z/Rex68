import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Memory, Setting, Content, Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { generateConversationSummary } from '@/lib/gemini';

const AdminDashboard: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [contentType, setContentType] = useState<string>('microblog');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personality');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<Setting | null>(null);
  const [conversationSummary, setConversationSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [deleteConversationDialogOpen, setDeleteConversationDialogOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string>("");
  const [deleteContentDialogOpen, setDeleteContentDialogOpen] = useState<boolean>(false);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);
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
    api_key: '',
    new_guideline_key: '',
    new_guideline_value: ''
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

        // Fetch conversation user IDs if on logs tab
        if (activeTab === 'logs') {
          try {
            const userIdsResponse = await apiRequest('GET', '/api/conversations', undefined);
            const userIds = await userIdsResponse.json();
            
            const conversationsObj: Record<string, Message[]> = {};
            userIds.forEach((userId: string) => {
              conversationsObj[userId] = [];
            });
            setConversations(conversationsObj);
          } catch (error) {
            console.error('Failed to fetch conversation user IDs:', error);
          }
        }

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
  }, [toast, activeTab]);

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

  // Add a new custom guideline
  const addCustomGuideline = async () => {
    if (!formData.new_guideline_key || !formData.new_guideline_value) {
      toast({
        title: "Error",
        description: "Both guideline key and value are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/api/settings', {
        key: formData.new_guideline_key,
        value: formData.new_guideline_value
      });
      
      const newSetting = await response.json();
      
      // Update local state
      setSettings([...settings, newSetting]);
      
      toast({
        title: "Success",
        description: "Custom guideline added successfully",
      });
      
      handleInputChange('new_guideline_key', '');
      handleInputChange('new_guideline_value', '');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add custom guideline",
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

  // Open the edit dialog for a setting
  const openEditDialog = (setting: Setting) => {
    setCurrentSetting(setting);
    setFormData({
      ...formData,
      [`edit_${setting.key}`]: setting.value
    });
    setEditDialogOpen(true);
  };

  // Handle the edit of a setting
  const handleEditSetting = async () => {
    if (!currentSetting) return;
    
    try {
      const response = await apiRequest('PATCH', `/api/settings/${currentSetting.key}`, {
        value: formData[`edit_${currentSetting.key}` as keyof typeof formData] as string
      });
      
      const updatedSetting = await response.json();
      
      // Update local state
      setSettings(settings.map(s => 
        s.key === currentSetting.key ? updatedSetting : s
      ));
      
      toast({
        title: "Success",
        description: `Guideline "${currentSetting.key}" updated successfully`,
      });
      
      setEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update guideline",
        variant: "destructive",
      });
    }
  };

  // Open the delete dialog for a setting
  const openDeleteDialog = (setting: Setting) => {
    setCurrentSetting(setting);
    setDeleteDialogOpen(true);
  };

  // Handle the deletion of a setting
  const handleDeleteSetting = async () => {
    if (!currentSetting) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/settings/${currentSetting.key}`, undefined);
      
      if (response.ok) {
        // Update local state
        setSettings(settings.filter(s => s.key !== currentSetting.key));
        
        toast({
          title: "Success",
          description: `Guideline "${currentSetting.key}" deleted successfully`,
        });
      } else {
        throw new Error('Failed to delete');
      }
      
      setDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete guideline",
        variant: "destructive",
      });
    }
  };

  // Generate AI summary for conversation
  const handleGenerateConversationSummary = async (userId: string) => {
    if (!userId || !conversations[userId] || conversations[userId].length === 0) {
      toast({
        title: "Error",
        description: "No conversation data available to summarize",
        variant: "destructive",
      });
      return;
    }
    
    setSummaryLoading(true);
    try {
      // Try getting a summary from the backend first
      const response = await apiRequest('GET', `/api/conversations/${userId}/summary`, undefined);
      
      if (response.ok) {
        const data = await response.json();
        setConversationSummary(data.summary);
      } else {
        // If the backend doesn't provide a summary, generate one client-side
        const summary = await generateConversationSummary(conversations[userId] as any);
        setConversationSummary(summary);
      }
      
      toast({
        title: "Success",
        description: "Conversation summary generated",
      });
    } catch (error) {
      console.error('Failed to generate conversation summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate conversation summary",
        variant: "destructive",
      });
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Open delete conversation dialog
  const openDeleteConversationDialog = (userId: string) => {
    setUserToDelete(userId);
    setDeleteConversationDialogOpen(true);
  };
  
  // Delete a conversation
  const handleDeleteConversation = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/conversations/${userToDelete}`, undefined);
      
      if (response.ok) {
        // Update local state by removing the deleted conversation
        const { [userToDelete]: _, ...remainingConversations } = conversations;
        setConversations(remainingConversations);
        
        // If the active user was deleted, clear it
        if (activeUserId === userToDelete) {
          setActiveUserId('');
          setConversationSummary('');
        }
        
        toast({
          title: "Success",
          description: `Conversation with ${userToDelete} deleted successfully`,
        });
      } else {
        throw new Error('Failed to delete conversation');
      }
      
      setDeleteConversationDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };
  
  // Open delete content dialog
  const openDeleteContentDialog = (content: Content) => {
    setContentToDelete(content);
    setDeleteContentDialogOpen(true);
  };
  
  // Delete a content item
  const handleDeleteContent = async () => {
    if (!contentToDelete) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/contents/${contentToDelete.id}`, undefined);
      
      if (response.ok) {
        // Update local state
        setContents(contents.filter(content => content.id !== contentToDelete.id));
        
        toast({
          title: "Success",
          description: `${contentToDelete.type} deleted successfully`,
        });
      } else {
        throw new Error('Failed to delete content');
      }
      
      setDeleteContentDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete content:', error);
      toast({
        title: "Error",
        description: "Failed to delete content",
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
      
      {/* Edit Guideline Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
          <DialogHeader>
            <DialogTitle className="text-terminal-cyan">Edit Guideline</DialogTitle>
            <DialogDescription className="text-terminal-muted">
              Edit the guideline value below. The key cannot be changed.
            </DialogDescription>
          </DialogHeader>
          
          {currentSetting && (
            <div className="space-y-4 py-4">
              <div className="text-terminal-orange font-mono">
                {currentSetting.key}
              </div>
              <textarea 
                value={formData[`edit_${currentSetting.key}` as keyof typeof formData] as string || currentSetting.value}
                onChange={(e) => handleInputChange(`edit_${currentSetting.key}`, e.target.value)}
                className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
                placeholder="Enter guideline value..."
              />
            </div>
          )}
          
          <DialogFooter>
            <button
              className="bg-terminal-muted hover:bg-terminal-dark text-terminal-text py-1 px-3 rounded text-sm transition-colors"
              onClick={() => setEditDialogOpen(false)}
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
      
      {/* Delete Guideline Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
          <DialogHeader>
            <DialogTitle className="text-terminal-red">Delete Guideline</DialogTitle>
            <DialogDescription className="text-terminal-muted">
              Are you sure you want to delete this guideline? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {currentSetting && (
            <div className="py-4">
              <div className="text-terminal-orange font-mono mb-2">
                {currentSetting.key}
              </div>
              <div className="text-terminal-text text-sm whitespace-pre-wrap break-words bg-terminal-bg p-2 rounded">
                {currentSetting.value}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <button
              className="bg-terminal-muted hover:bg-terminal-dark text-terminal-text py-1 px-3 rounded text-sm transition-colors"
              onClick={() => setDeleteDialogOpen(false)}
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
      
      {/* Delete Conversation Dialog */}
      <Dialog open={deleteConversationDialogOpen} onOpenChange={setDeleteConversationDialogOpen}>
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
              onClick={() => setDeleteConversationDialogOpen(false)}
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
      
      {/* Delete Content Dialog */}
      <Dialog open={deleteContentDialogOpen} onOpenChange={setDeleteContentDialogOpen}>
        <DialogContent className="bg-terminal-dark border border-terminal-muted text-terminal-text">
          <DialogHeader>
            <DialogTitle className="text-terminal-red">Delete Content</DialogTitle>
            <DialogDescription className="text-terminal-muted">
              Are you sure you want to delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {contentToDelete && (
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
          )}
          
          <DialogFooter>
            <button
              className="bg-terminal-muted hover:bg-terminal-dark text-terminal-text py-1 px-3 rounded text-sm transition-colors"
              onClick={() => setDeleteContentDialogOpen(false)}
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
              
              {/* Custom Guidelines */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Custom Guidelines</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Create New Guideline</label>
                    
                    <div className="mb-2">
                      <label className="block text-terminal-muted text-xs mb-1">Guideline Key</label>
                      <input
                        type="text"
                        value={formData.new_guideline_key}
                        onChange={(e) => handleInputChange('new_guideline_key', e.target.value)}
                        className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
                        placeholder="e.g., response_style_formal, topic_politics, etc."
                      />
                    </div>
                    
                    <div className="mb-2">
                      <label className="block text-terminal-muted text-xs mb-1">Guideline Value</label>
                      <textarea
                        value={formData.new_guideline_value}
                        onChange={(e) => handleInputChange('new_guideline_value', e.target.value)}
                        className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-24 text-sm"
                        placeholder="Enter the guideline content here..."
                      />
                    </div>
                    
                    <button 
                      className="bg-terminal-orange hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm transition-colors"
                      onClick={addCustomGuideline}
                      disabled={!formData.new_guideline_key || !formData.new_guideline_value}
                    >
                      Add Custom Guideline
                    </button>
                  </div>
                  
                  <div>
                    <h4 className="text-terminal-cyan text-sm mb-2">All Guidelines</h4>
                    <div className="space-y-2">
                      {settings.filter(s => 
                        !['greeting_style', 'behavior_rules', 'personality', 'language_preference', 'api_key'].includes(s.key)
                      ).map(setting => (
                        <div key={setting.id} className="bg-terminal-bg p-3 rounded border border-terminal-muted">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-terminal-orange text-sm font-mono">{setting.key}</span>
                            <div className="flex space-x-2">
                              <button
                                className="text-terminal-cyan text-xs hover:text-terminal-purple"
                                onClick={() => openEditDialog(setting)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-terminal-red text-xs hover:text-terminal-orange"
                                onClick={() => openDeleteDialog(setting)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="text-terminal-text text-xs whitespace-pre-wrap break-words">
                            {setting.value}
                          </div>
                        </div>
                      ))}
                      
                      {settings.filter(s => 
                        !['greeting_style', 'behavior_rules', 'personality', 'language_preference', 'api_key'].includes(s.key)
                      ).length === 0 && (
                        <div className="text-center py-4 text-terminal-muted">
                          No custom guidelines available yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="language" className="mt-0">
            <div className="grid grid-cols-1 gap-4">
              {/* Language Settings */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Language Settings</h3>
                
                <div className="space-y-4">
                  {/* Language Preference */}
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Language Preference</label>
                    <textarea
                      value={formData.language_preference}
                      onChange={(e) => handleInputChange('language_preference', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-20 text-sm"
                      placeholder="Language preference (e.g., English, Hinglish, English with occasional Hinglish)..."
                    />
                    <button 
                      className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-1 transition-colors"
                      onClick={() => updateSetting('language_preference')}
                      disabled={!formData.language_preference}
                    >
                      Update Language Preference
                    </button>
                  </div>
                  
                  {/* API Key */}
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Gemini API Key</label>
                    <input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => handleInputChange('api_key', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded text-sm"
                      placeholder="Enter Gemini API key..."
                    />
                    <button 
                      className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm mt-1 transition-colors"
                      onClick={() => updateSetting('api_key')}
                      disabled={!formData.api_key}
                    >
                      Update API Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="mt-0">
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
                      Add Content
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Content Browser */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
                <h3 className="text-terminal-green mb-2">Content Browser</h3>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    className={`text-xs py-1 px-2 rounded transition-colors ${contentType === 'all' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-text'}`}
                    onClick={() => setContentType('all')}
                  >
                    All
                  </button>
                  <button
                    className={`text-xs py-1 px-2 rounded transition-colors ${contentType === 'microblog' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-text'}`}
                    onClick={() => setContentType('microblog')}
                  >
                    Microblogs
                  </button>
                  <button
                    className={`text-xs py-1 px-2 rounded transition-colors ${contentType === 'reflection' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-text'}`}
                    onClick={() => setContentType('reflection')}
                  >
                    Reflections
                  </button>
                  <button
                    className={`text-xs py-1 px-2 rounded transition-colors ${contentType === 'quote' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-text'}`}
                    onClick={() => setContentType('quote')}
                  >
                    Quotes
                  </button>
                  <button
                    className={`text-xs py-1 px-2 rounded transition-colors ${contentType === 'insight' ? 'bg-terminal-cyan text-black' : 'bg-terminal-bg text-terminal-text'}`}
                    onClick={() => setContentType('insight')}
                  >
                    Insights
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {contents
                    .filter(content => contentType === 'all' || content.type === contentType)
                    .map(content => (
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
                    ))}
                  
                  {contents.filter(content => contentType === 'all' || content.type === contentType).length === 0 && (
                    <div className="text-center py-8 text-terminal-muted">
                      No content available yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="memory" className="mt-0">
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
                      placeholder="Enter user ID for this memory..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-terminal-muted mb-1 text-sm">Memory Context</label>
                    <textarea
                      value={formData.new_memory_context}
                      onChange={(e) => handleInputChange('new_memory_context', e.target.value)}
                      className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-2 rounded h-40 text-sm"
                      placeholder="Enter memory context (JSON or simple text)..."
                    />
                  </div>
                  
                  <div className="text-terminal-muted text-xs mb-2">
                    <p>You can enter either simple text or a JSON object. Simple text will be converted to:</p>
                    <pre className="bg-terminal-bg p-1 rounded mt-1">
                      {`{
  "sentiment": "neutral",
  "lastInteraction": "[current date]",
  "notes": "[your text]"
}`}
                    </pre>
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
                <div className="space-y-2">
                  {Object.keys(conversations).map(userId => (
                    <div key={userId} className="bg-terminal-bg rounded border border-terminal-muted p-2">
                      <div className="flex justify-between items-center">
                        <button
                          className={`text-left py-1 px-2 rounded text-xs flex-grow ${userId === activeUserId ? 'text-terminal-cyan font-bold' : 'text-terminal-text'}`}
                          onClick={() => {
                            setActiveUserId(userId);
                            fetchConversations(userId);
                          }}
                        >
                          {userId}
                        </button>
                        <button
                          className="text-terminal-red text-xs hover:text-terminal-orange"
                          onClick={() => openDeleteConversationDialog(userId)}
                          title="Delete conversation"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Conversation Display */}
              <div className="bg-terminal-dark p-4 rounded border border-terminal-muted md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-terminal-green">
                    {activeUserId ? `Conversation with ${activeUserId}` : 'Select a User'}
                  </h3>
                  
                  {activeUserId && conversations[activeUserId]?.length > 0 && (
                    <button
                      className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-3 rounded text-sm transition-colors"
                      onClick={() => handleGenerateConversationSummary(activeUserId)}
                      disabled={summaryLoading}
                    >
                      {summaryLoading ? 'Generating...' : 'Generate AI Summary'}
                    </button>
                  )}
                </div>
                
                {conversationSummary && (
                  <div className="bg-terminal-bg p-3 mb-4 rounded border border-terminal-muted">
                    <h4 className="text-terminal-orange text-sm mb-1">AI Summary</h4>
                    <p className="text-terminal-text text-sm whitespace-pre-wrap">{conversationSummary}</p>
                  </div>
                )}
                
                {activeUserId && conversations[activeUserId]?.length > 0 ? (
                  <div className="bg-terminal-bg rounded border border-terminal-muted p-2 h-96 overflow-y-auto font-mono text-sm">
                    {conversations[activeUserId].map((message) => (
                      <div key={message.id} className={`mb-3 ${message.isFromUser ? 'pl-4' : 'pl-0'}`}>
                        <div className="flex items-start">
                          <span className={`mr-2 ${message.isFromUser ? 'text-terminal-orange' : 'text-terminal-cyan'}`}>
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