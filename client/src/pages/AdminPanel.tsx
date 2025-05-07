import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import AdminLogin from '@/components/AdminLogin';
import Dashboard from '@/components/admin/Dashboard';

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [, setLocation] = useLocation();

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleClose = () => {
    setLocation('/');
  };

  return (
    <>
      <Helmet>
        <title>Rex Admin Panel</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="terminal-window">
            <div className="terminal-header flex items-center justify-between p-2">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-terminal-orange"></div>
                <div className="w-3 h-3 rounded-full bg-terminal-green"></div>
                <div className="w-3 h-3 rounded-full bg-terminal-cyan"></div>
              </div>
              <div className="text-sm text-terminal-text font-mono">Rex Admin Panel</div>
              <button 
                onClick={handleClose} 
                className="text-terminal-text hover:text-terminal-pink"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-6 bg-terminal-bg">
              {isAuthenticated ? <Dashboard /> : <AdminLogin onSuccess={handleLoginSuccess} />}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default AdminPanel;
