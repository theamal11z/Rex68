import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // For demo purposes, the password is "admin123"
  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter the admin password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/admin', {
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
          description: "Invalid password. Default is 'admin123'",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
      // For demo purposes, allow login with hardcoded password
      if (password === 'admin123') {
        toast({
          title: "Demo Login",
          description: "Logged in with demo credentials",
        });
        onSuccess();
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to authenticate. Try 'admin123'",
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
          <label className="block text-terminal-muted mb-2">Password</label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-terminal-bg text-terminal-text border border-terminal-muted p-3 rounded font-mono"
              placeholder="Enter admin password..."
              autoFocus
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-terminal-muted text-sm">
              <span className="blink-cursor">|</span>
            </div>
          </div>
          <p className="text-terminal-muted text-xs mt-2">Default password: admin123</p>
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
