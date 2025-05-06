import { FaInstagram, FaTwitter, FaEnvelope } from 'react-icons/fa';

const SocialLinks: React.FC = () => {
  return (
    <div className="flex justify-center space-x-6 mt-2 sm:mt-4 pb-2 sm:pb-4">
      <a 
        href="https://instagram.com/alamal11x" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-terminal-pink hover:text-terminal-purple transition-colors p-2 touch-action-manipulation" 
        aria-label="Instagram"
      >
        <FaInstagram className="text-lg sm:text-xl" />
      </a>
      <a 
        href="https://twitter.com/theamal11x" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-terminal-cyan hover:text-terminal-purple transition-colors p-2 touch-action-manipulation"
        aria-label="Twitter/X"
      >
        <FaTwitter className="text-lg sm:text-xl" />
      </a>
      <a 
        href="mailto:theamal11x@gmail.com" 
        className="text-terminal-green hover:text-terminal-purple transition-colors p-2 touch-action-manipulation"
        aria-label="Email"
      >
        <FaEnvelope className="text-lg sm:text-xl" />
      </a>
    </div>
  );
};

export default SocialLinks;
