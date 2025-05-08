import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Memory, Setting, Content, Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { calculateMemoryHealth } from '@/lib/memoryManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import tab components
import PersonalityTab from './tabs/PersonalityTab';
import LanguageTab from './tabs/LanguageTab';
import ContentTab from './tabs/ContentTab';
import MemoryTab from './tabs/MemoryTab';
import ConversationsTab from './tabs/ConversationsTab';

// Import dialog components
import EditSettingDialog from './dialogs/EditSettingDialog';
import DeleteSettingDialog from './dialogs/DeleteSettingDialog';
import DeleteConversationDialog from './dialogs/DeleteConversationDialog';
import DeleteContentDialog from './dialogs/DeleteContentDialog';

const Dashboard: React.FC = () => {
  // State management
  const [memories, setMemories] = useState<Memory[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [contentType, setContentType] = useState<string>('microblog');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personality');
  const { toast } = useToast();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<Setting | null>(null);
  const [deleteConversationDialogOpen, setDeleteConversationDialogOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string>("");
  const [deleteContentDialogOpen, setDeleteContentDialogOpen] = useState<boolean>(false);
  const [contentToDelete, setContentToDelete] = useState<Content | null>(null);
  const [conversationSummary, setConversationSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // Form state
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

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch settings for all tabs
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

        // Fetch data specific to active tab
        if (activeTab === 'content') {
          const contentsResponse = await apiRequest('GET', '/api/contents', undefined);
          const contentsData = await contentsResponse.json();
          setContents(contentsData);
        }

        // Fetch conversation user IDs if on logs tab
        if (activeTab === 'conversations') {
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

        // Fetch memory data when on memory tab
        if (activeTab === 'memory') {
          try {
            console.log('Fetching memory data...');
            // Start fresh with empty memories array
            setMemories([]);
            
            // Fetch conversation user IDs to get their memories
            const userIdsResponse = await apiRequest('GET', '/api/conversations', undefined);
            if (userIdsResponse.ok) {
              const userIds = await userIdsResponse.json();
              console.log('User IDs for memory fetch:', userIds);
              
              // Fetch memory for each user
              const memoriesData: Memory[] = [];
              for (const userId of userIds) {
                try {
                  console.log(`Fetching memory for ${userId}...`);
                  const memoryResponse = await apiRequest('GET', `/api/memory/${userId}`, undefined);
                  if (memoryResponse.ok) {
                    const memory = await memoryResponse.json();
                    console.log(`Memory for ${userId}:`, memory);
                    if (memory) {
                      memoriesData.push(memory);
                    }
                  } else {
                    console.log(`No memory found for ${userId}`);
                  }
                } catch (err) {
                  console.error(`Failed to fetch memory for ${userId}:`, err);
                }
              }
              
              console.log(`Collected ${memoriesData.length} user memories`);
              if (memoriesData.length > 0) {
                setMemories(memoriesData);
                // Show a success toast
                toast({
                  title: "Success",
                  description: `Loaded ${memoriesData.length} user memories`,
                });
              } else {
                toast({
                  title: "Information",
                  description: "No memory data found for any users",
                });
              }
            } else {
              console.error('Failed to fetch conversation user IDs');
              toast({
                title: "Error",
                description: "Failed to fetch users for memory data",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Failed to fetch memories:', error);
          }
        }
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

  // Shared handlers
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
      // Fetch conversation messages
      const response = await apiRequest('GET', `/api/messages/${userId}`, undefined);
      const messages = await response.json();
      
      setConversations({
        ...conversations,
        [userId]: messages
      });
      
      setActiveUserId(userId);
      
      // Also fetch memory for this user and add it to memories if it's not already there
      try {
        const memoryResponse = await apiRequest('GET', `/api/memory/${userId}`, undefined);
        if (memoryResponse.ok) {
          const memory = await memoryResponse.json();
          
          // Check if this memory is already in our memories array
          const memoryExists = memories.some(m => m.userId === userId);
          
          if (!memoryExists) {
            setMemories(prev => [...prev, memory]);
          }
        }
      } catch (err) {
        console.error(`Failed to fetch memory for ${userId}:`, err);
      }
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

  // Edit Memory handler
  const handleEditMemory = async (memory: Memory, updatedContext: any) => {
    try {
      const response = await apiRequest('PATCH', `/api/memory/${memory.id}`, { context: updatedContext });
      const updatedMemory = await response.json();
      setMemories(memories.map(m => m.id === memory.id ? updatedMemory : m));
      toast({ title: "Success", description: "Memory updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update memory", variant: "destructive" });
    }
  };

  // Delete Memory handler
  const handleDeleteMemory = async (memoryId: number) => {
    try {
      await apiRequest('DELETE', `/api/memory/${memoryId}`, undefined);
      setMemories(memories.filter(m => m.id !== memoryId));
      toast({ title: "Success", description: "Memory deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete memory", variant: "destructive" });
    }
  };

  // Dialog handlers
  const openEditDialog = (setting: Setting) => {
    setCurrentSetting(setting);
    setFormData({
      ...formData,
      [`edit_${setting.key}`]: setting.value
    });
    setEditDialogOpen(true);
  };

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

  const openDeleteDialog = (setting: Setting) => {
    setCurrentSetting(setting);
    setDeleteDialogOpen(true);
  };

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

  // Format a date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
        const { generateConversationSummary } = await import('@/lib/gemini');
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

  // Props object for each tab
  const tabProps = {
    settings,
    formData,
    handleInputChange,
    updateSetting,
    openEditDialog,
    openDeleteDialog,
    addCustomGuideline,
    formatDate
  };

  const contentTabProps = {
    ...tabProps,
    contents,
    contentType,
    setContentType,
    addContent,
    openDeleteContentDialog
  };

  const memoryTabProps = {
    ...tabProps,
    memories,
    createMemory,
    handleEditMemory,
    handleDeleteMemory
  };

  const conversationsTabProps = {
    ...tabProps,
    conversations,
    activeUserId,
    conversationSummary,
    summaryLoading,
    fetchConversations,
    handleGenerateConversationSummary,
    openDeleteConversationDialog
  };

  return (
    <div>
      <h2 className="text-xl text-terminal-cyan mb-4 font-mono">Rex Configuration Panel</h2>
      
      {/* Dialogs */}
      <EditSettingDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        setting={currentSetting}
        formData={formData}
        handleInputChange={handleInputChange}
        handleEditSetting={handleEditSetting}
      />
      
      <DeleteSettingDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
        setting={currentSetting}
        handleDeleteSetting={handleDeleteSetting}
      />
      
      <DeleteConversationDialog 
        open={deleteConversationDialogOpen} 
        onOpenChange={setDeleteConversationDialogOpen}
        userToDelete={userToDelete}
        handleDeleteConversation={handleDeleteConversation}
      />
      
      <DeleteContentDialog 
        open={deleteContentDialogOpen} 
        onOpenChange={setDeleteContentDialogOpen}
        contentToDelete={contentToDelete}
        handleDeleteContent={handleDeleteContent}
        formatDate={formatDate}
      />
      
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
            <TabsTrigger value="conversations" className="data-[state=active]:bg-terminal-cyan data-[state=active]:text-black">
              Conversations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personality" className="mt-0">
            <PersonalityTab {...tabProps} />
          </TabsContent>
          
          <TabsContent value="language" className="mt-0">
            <LanguageTab {...tabProps} />
          </TabsContent>
          
          <TabsContent value="content" className="mt-0">
            <ContentTab {...contentTabProps} />
          </TabsContent>
          
          <TabsContent value="memory" className="mt-0">
            <MemoryTab {...memoryTabProps} />
          </TabsContent>
          
          <TabsContent value="conversations" className="mt-0">
            <ConversationsTab {...conversationsTabProps} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Dashboard;
