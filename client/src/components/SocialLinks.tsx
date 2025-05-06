import { FaInstagram, FaTwitter, FaEnvelope } from 'react-icons/fa';

const SocialLinks: React.FC = () => {
  return (
    <div className="flex justify-center space-x-6 mt-4 pb-4">
      <a 
        href="https://instagram.com/alamal11x" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-terminal-pink hover:text-terminal-purple transition-colors" 
        aria-label="Instagram"
      >
        <FaInstagram className="text-xl" />
      </a>
      <a 
        href="https://twitter.com/theamal11x" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-terminal-cyan hover:text-terminal-purple transition-colors"
        aria-label="Twitter/X"
      >
        <FaTwitter className="text-xl" />
      </a>
      <a 
        href="mailto:theamal11x@gmail.com" 
        className="text-terminal-green hover:text-terminal-purple transition-colors"
        aria-label="Email"
      >
        <FaEnvelope className="text-xl" />
      </a>
    </div>
  );
};

export default SocialLinks;
