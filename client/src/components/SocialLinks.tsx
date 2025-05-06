import { FaInstagram, FaTwitter, FaEnvelope } from 'react-icons/fa';

const SocialLinks: React.FC = () => {
  return (
    <div className="flex justify-center space-x-6 mt-4 py-4">
      <a 
        href="https://instagram.com/alamal11x" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-terminal-pink hover:text-terminal-purple transition-colors p-2" 
        aria-label="Instagram"
      >
        <FaInstagram className="text-2xl sm:text-xl" />
      </a>
      <a 
        href="https://twitter.com/theamal11x" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-terminal-cyan hover:text-terminal-purple transition-colors p-2"
        aria-label="Twitter/X"
      >
        <FaTwitter className="text-2xl sm:text-xl" />
      </a>
      <a 
        href="mailto:theamal11x@gmail.com" 
        className="text-terminal-green hover:text-terminal-purple transition-colors p-2"
        aria-label="Email"
      >
        <FaEnvelope className="text-2xl sm:text-xl" />
      </a>
    </div>
  );
};

export default SocialLinks;
