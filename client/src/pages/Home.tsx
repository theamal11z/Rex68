import { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Terminal from '@/components/Terminal';

const Home: React.FC = () => {
  // Set title and meta description
  useEffect(() => {
    document.title = "Rex - Mohsin's Inner Voice";
  }, []);

  return (
    <>
      <Helmet>
        <meta name="description" content="Rex - An emotionally intelligent terminal representing Mohsin Raja's inner voice" />
        <meta property="og:title" content="Rex - Mohsin's Inner Voice" />
        <meta property="og:description" content="A window into Mohsin's thoughts and reflections" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-terminal-dark via-black to-terminal-purple flex items-center justify-center animate-pulse-gradient-bg">
        <Terminal />
      </div>
    </>
  );
};

export default Home;
