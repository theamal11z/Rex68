import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/admin', {
        email,
        password
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Welcome to the admin panel!",
        });
        onSuccess();
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Error",
        description: "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl text-terminal-cyan mb-4 font-mono">Admin Authentication</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-terminal-muted mb-2">Email</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-3 rounded font-mono"
              placeholder="Enter admin email..."
              autoFocus
            />
          </div>
        </div>
        <div>
          <label className="block text-terminal-muted mb-2">Password</label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-3 rounded font-mono"
              placeholder="Enter admin password..."
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-terminal-muted text-sm">
              <span className="blink-cursor">|</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-terminal-pink hover:bg-terminal-purple text-white py-2 px-4 rounded transition-colors disabled:opacity-50 w-full"
        >
          {loading ? 'Authenticating...' : 'Access Panel'}
        </button>
      </div>
    </motion.div>
  );
};

export default AdminLogin;
