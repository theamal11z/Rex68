import { Setting } from '@/types';

interface PersonalityTabProps {
  settings: Setting[];
  formData: Record<string, string>;
  handleInputChange: (field: string, value: string) => void;
  updateSetting: (key: string) => Promise<void>;
  openEditDialog: (setting: Setting) => void;
  openDeleteDialog: (setting: Setting) => void;
  addCustomGuideline: () => Promise<void>;
  formatDate: (dateString: string | Date) => string;
}

const PersonalityTab: React.FC<PersonalityTabProps> = ({
  settings,
  formData,
  handleInputChange,
  updateSetting,
  openEditDialog,
  openDeleteDialog,
  addCustomGuideline
}) => {
  return (
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
  );
};

export default PersonalityTab;
