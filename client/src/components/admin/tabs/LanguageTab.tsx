import { Setting } from '@/types';

interface LanguageTabProps {
  settings: Setting[];
  formData: Record<string, string>;
  handleInputChange: (field: string, value: string) => void;
  updateSetting: (key: string) => Promise<void>;
}

const LanguageTab: React.FC<LanguageTabProps> = ({
  formData,
  handleInputChange,
  updateSetting
}) => {
  return (
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
  );
};

export default LanguageTab;
