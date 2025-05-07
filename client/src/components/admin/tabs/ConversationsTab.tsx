import { Message } from '@/types';

interface ConversationsTabProps {
  conversations: Record<string, Message[]>;
  activeUserId: string;
  conversationSummary: string;
  summaryLoading: boolean;
  fetchConversations: (userId: string) => Promise<void>;
  handleGenerateConversationSummary: (userId: string) => Promise<void>;
  openDeleteConversationDialog: (userId: string) => void;
  formatDate: (dateString: string | Date) => string;
}

const ConversationsTab: React.FC<ConversationsTabProps> = ({
  conversations,
  activeUserId,
  conversationSummary,
  summaryLoading,
  fetchConversations,
  handleGenerateConversationSummary,
  openDeleteConversationDialog,
  formatDate
}) => {
  // Get user IDs from conversations object
  const userIds = Object.keys(conversations);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Users list */}
      <div className="bg-terminal-dark p-4 rounded border border-terminal-muted">
        <h3 className="text-terminal-green mb-2">Users</h3>
        
        {userIds.length > 0 ? (
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {userIds.map(userId => (
              <div 
                key={userId} 
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${activeUserId === userId ? 'bg-terminal-purple' : 'bg-terminal-bg hover:bg-terminal-muted'}`}
                onClick={() => fetchConversations(userId)}
              >
                <span className="text-terminal-text text-sm truncate">{userId}</span>
                <div className="flex space-x-1">
                  <button
                    className="text-terminal-red text-xs hover:text-terminal-orange"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteConversationDialog(userId);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-terminal-muted">
            No conversation history available.
          </div>
        )}
      </div>
      
      {/* Messages panel */}
      <div className="bg-terminal-dark p-4 rounded border border-terminal-muted lg:col-span-2">
        {activeUserId ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-terminal-green">Conversation with {activeUserId}</h3>
              <button
                className="bg-terminal-cyan hover:bg-terminal-purple text-white py-1 px-2 rounded text-xs transition-colors"
                onClick={() => handleGenerateConversationSummary(activeUserId)}
                disabled={!conversations[activeUserId] || conversations[activeUserId].length === 0 || summaryLoading}
              >
                {summaryLoading ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
            
            {/* Summary section */}
            {conversationSummary && (
              <div className="mb-3 p-2 bg-terminal-bg rounded border border-terminal-cyan">
                <h4 className="text-terminal-cyan text-sm mb-1">AI Generated Summary</h4>
                <p className="text-terminal-text text-sm whitespace-pre-wrap break-words">
                  {conversationSummary}
                </p>
              </div>
            )}
            
            {/* Messages list */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {conversations[activeUserId] && conversations[activeUserId].length > 0 ? (
                conversations[activeUserId].map((message, index) => (
                  <div key={index} className={`p-2 rounded border ${message.isFromUser === 1 ? 'border-terminal-orange bg-terminal-bg' : 'border-terminal-cyan bg-black bg-opacity-30'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-semibold ${message.isFromUser === 1 ? 'text-terminal-orange' : 'text-terminal-cyan'}`}>
                        {message.isFromUser === 1 ? 'User' : 'Rex'}
                      </span>
                      <span className="text-terminal-muted text-xs">
                        {message.timestamp ? formatDate(message.timestamp) : 'No timestamp'}
                      </span>
                    </div>
                    <div className="text-terminal-text text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-terminal-muted">
                  {conversations[activeUserId] ? 'No messages in this conversation.' : 'Loading messages...'}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-terminal-muted">
            Select a user to view their conversation history.
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsTab;
