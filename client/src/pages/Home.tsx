import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import Terminal from '@/components/Terminal';

const Home: React.FC = () => {
  const [, setLocation] = useLocation();

  // Set title and meta description
  useEffect(() => {
    document.title = "Rex - Mohsin's Inner Voice";
  }, []);

  const goToAdmin = () => {
    setLocation('/admin');
  };

  return (
    <>
      <Helmet>
        <meta name="description" content="Rex - An emotionally intelligent terminal representing Mohsin Raja's inner voice" />
        <meta property="og:title" content="Rex - Mohsin's Inner Voice" />
        <meta property="og:description" content="A window into Mohsin's thoughts and reflections" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-terminal-dark flex flex-col">
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={goToAdmin}
            className="px-3 py-1 bg-terminal-dark border border-terminal-muted rounded-sm hover:bg-terminal-bg text-terminal-muted text-xs transition-colors"
            aria-label="Admin Access"
            title="Admin Access"
          >
            Admin
          </button>
        </div>
        <Terminal />
      </div>
    </>
  );
};

export default Home;
