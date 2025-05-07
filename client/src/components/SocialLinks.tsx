import { FaInstagram, FaTwitter, FaEnvelope } from 'react-icons/fa';

const SocialLinks: React.FC = () => {
  return (
    <div className="flex justify-center mt-4 pb-4">
      <div className="bg-terminal-dark/90 rounded-xl shadow-lg px-6 py-3 flex space-x-8 items-center border border-terminal-muted backdrop-blur-md">
        <a 
          href="https://instagram.com/alamal11x" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-terminal-pink hover:text-terminal-purple transition-transform transform hover:scale-110 focus:scale-110 outline-none"
          aria-label="Instagram"
          tabIndex={0}
          title="Instagram"
        >
          <FaInstagram className="text-2xl" />
        </a>
        <a 
          href="https://twitter.com/theamal11x" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-terminal-cyan hover:text-terminal-purple transition-transform transform hover:scale-110 focus:scale-110 outline-none"
          aria-label="Twitter/X"
          tabIndex={0}
          title="Twitter/X"
        >
          <FaTwitter className="text-2xl" />
        </a>
        <a 
          href="mailto:theamal11x@gmail.com" 
          className="text-terminal-green hover:text-terminal-purple transition-transform transform hover:scale-110 focus:scale-110 outline-none"
          aria-label="Email"
          tabIndex={0}
          title="Email"
        >
          <FaEnvelope className="text-2xl" />
        </a>
      </div>
    </div>
  );
};

export default SocialLinks;
