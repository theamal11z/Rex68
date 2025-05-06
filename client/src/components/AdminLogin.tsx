import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
        description: "Please provide both email and password",
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
          description: "Login successful",
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
      toast({
        title: "Error",
        description: "Failed to authenticate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl text-terminal-cyan mb-4 font-mono">Admin Authentication</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-terminal-muted mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-terminal-dark text-terminal-text border border-terminal-muted p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-terminal-muted mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-terminal-dark text-terminal-text border border-terminal-muted p-2 rounded"
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-terminal-pink hover:bg-terminal-purple text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
