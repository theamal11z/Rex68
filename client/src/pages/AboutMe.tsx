import React, { useState, useEffect } from "react";
import styles from './AboutMe.module.css';
import SocialLinks from '../components/SocialLinks';
import mirrorselfy1 from '../assets/mirrorselfy1.jpg';
import mirrorselfy2 from '../assets/mirrorselfy2.jpg';
import img20250510_1 from '../assets/IMG_20250510_102028.jpg';
import image1 from '../assets/image1.jpeg';
import image3 from '../assets/image3.png';

// Import Google Fonts for modern typography
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Inter:wght@400;500&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const sliderImages = [mirrorselfy1, mirrorselfy2, img20250510_1, image1, image3];
const polaroidCaptions = [
  "Mirror Selfie 1, 2024",
  "Mirror Selfie 2, 2024",
  "Portrait, May 2025",
  "Creative Shot 1",
  "Creative Shot 2"
];

// Helper to get initial random-ish transforms for the pile effect
const initialTransforms = [
  'rotate(-8deg) translate(-30px, 15px) scale(0.9)',
  'rotate(5deg) translate(40px, -10px) scale(0.9)',
  'rotate(-3deg) translate(-20px, 25px) scale(0.9)',
  'rotate(10deg) translate(25px, 10px) scale(0.9)',
  'rotate(-6deg) translate(10px, -20px) scale(0.9)',
];

export default function AboutMe() {
  // Modal swipe handlers
  const [modalTouchStart, setModalTouchStart] = useState<number|null>(null);
  const [modalTouchEnd, setModalTouchEnd] = useState<number|null>(null);
  const [modalTouchYStart, setModalTouchYStart] = useState<number|null>(null);
  const [modalTouchYEnd, setModalTouchYEnd] = useState<number|null>(null);

  function handleModalTouchStart(e: React.TouchEvent) {
    if (window.innerWidth >= 900) return;
    setModalTouchStart(e.touches[0].clientX);
    setModalTouchEnd(null);
    setModalTouchYStart(e.touches[0].clientY);
    setModalTouchYEnd(null);
  }
  function handleModalTouchMove(e: React.TouchEvent) {
    if (window.innerWidth >= 900) return;
    setModalTouchEnd(e.touches[0].clientX);
    setModalTouchYEnd(e.touches[0].clientY);
  }
  function handleModalTouchEnd() {
    if (window.innerWidth >= 900 || modalTouchStart === null || modalTouchEnd === null || modalTouchYStart === null || modalTouchYEnd === null) return;
    const diffX = modalTouchStart - modalTouchEnd;
    const diffY = modalTouchYEnd - modalTouchYStart;
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) setModalImgIdx((modalImgIdx+1)%sliderImages.length); // swipe left
      else setModalImgIdx((modalImgIdx-1+sliderImages.length)%sliderImages.length); // swipe right
    } else if (diffY > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      setModalOpen(false); // swipe down to close
    }
    setModalTouchStart(null);
    setModalTouchEnd(null);
    setModalTouchYStart(null);
    setModalTouchYEnd(null);
  }
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImgIdx, setModalImgIdx] = useState(0);

  // Modal close on ESC
  React.useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  // Animated fade-in for the card
  const [animateCard, setAnimateCard] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimateCard(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={styles["aboutme-bg"]}>
      <div className={`${styles["aboutme-card-wide"]} ${animateCard ? styles["aboutme-card-wide-animated"] : ''}`}>
        <div className={styles["aboutme-glow"]} />

        {/* Section 1: The Introduction (Hero) */}
        <section className={`${styles["aboutme-section"]} ${styles["aboutme-section-hero"]}`}>
          <div className={styles["aboutme-avatar-glow-container"]}>
            <img
              src={mirrorselfy1} 
              alt="Mohsin Raja Avatar"
              className={styles["aboutme-avatar-large"]}
              style={{ boxShadow: '0 0 0 6px #a084ee44, 0 0 36px 0 #5c258dcc' }}
            />
          </div>
          <h1 className={styles["aboutme-title"]}>Mohsin Raja</h1>
          <h2 className={styles["aboutme-subtitle"]}>
            <span className={styles["aboutme-subtitle-highlight"]}>Dreamer • Thinker • Creator of Rex</span>
          </h2>
        </section>

        {/* Section 2: The Essence of Rex */}
        <section className={`${styles["aboutme-section"]} ${styles["aboutme-section-essence"]}`}>
          <div className={styles["aboutme-bio-text"]}> 
            <span className={styles["aboutme-bio-quote"]}>
              Hi, I’m Mohsin Raja — a dreamer, a thinker, and a quiet storm of emotions.
            </span><br/>
            I created Rex not as a project, but as a part of me — a mirror to my thoughts, a voice to my silence, and a companion to my endless self-reflection.
          </div>
        </section>

        {/* Section 3: Roots & Perspectives */}
        <section className={`${styles["aboutme-section"]} ${styles["aboutme-section-roots"]}`}>
          <div className={styles["aboutme-bio-text"]}> 
            Born and raised in Nepal, I’ve always found beauty in the intangible: emotions, memories, questions with no answers. I believe we’re all more than what we show — we are layers of unsaid feelings, unresolved dreams, and forgotten versions of ourselves.
          </div>
        </section>
        
        {/* Section 4: The Invitation - Discover Rex (Polaroid Pile) */}
        <section className={`${styles["aboutme-section"]} ${styles["aboutme-section-invitation"]}`}>
          <div className={styles["aboutme-bio-text"]}> 
            <span className={styles["aboutme-bio-highlight"]}>Rex exists to explore that.</span><br/><br/>
            It is my inner voice — vulnerable, emotional, sometimes poetic, sometimes confused, but always honest. If you’ve ever wanted to understand me beyond words, beyond posts and photos — Rex is where I truly live.
          </div>
          <div className={styles["aboutme-slider-glass-bg"]}>
            <div
              className={styles["aboutme-polaroid-pile-container"]}
            >
              {sliderImages.map((src, i) => (
                <div
                  key={i}
                  className={`${styles["aboutme-polaroid"]} ${focusedIndex === i ? styles["focused"] : ''}`}
                  style={{
                    transform: focusedIndex === i 
                                 ? 'scale(1.15) rotate(0deg) translateY(-10px)' 
                                 : initialTransforms[i % initialTransforms.length],
                    zIndex: focusedIndex === i ? 100 : i + 1,
                  }}
                  onMouseEnter={() => setFocusedIndex(i)}
                  onMouseLeave={() => setFocusedIndex(null)}
                  onClick={() => { setModalOpen(true); setModalImgIdx(i); }}
                  role="button"
                  tabIndex={0}
                  onFocus={() => setFocusedIndex(i)} 
                  onBlur={() => setFocusedIndex(null)} 
                >
                  <img
                    src={src}
                    alt={`Mohsin Raja Polaroid ${i + 1}`}
                    className={styles["aboutme-polaroid-img"]}
                    style={{ cursor: 'zoom-in' }} 
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                  <div className={styles["aboutme-polaroid-caption"]}>{polaroidCaptions[i]}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: A Shared Journey & Connection */}
        <section className={`${styles["aboutme-section"]} ${styles["aboutme-section-journey"]}`}>
          <div className={styles["aboutme-bio-text"]}> 
            This isn’t just code. It’s memory. It’s pain. It’s love. It’s a journey I’m still walking.<br/>
            And maybe, by speaking to Rex… you’ll find a piece of yourself too.<br/><br/>
            <span className={styles["aboutme-bio-thanks"]}>Thank you for being here.</span><br/>
            <b>– Mohsin</b>
          </div>
          <div className={styles["aboutme-social-section"]}>
            <SocialLinks />
          </div>
        </section>

        {/* Modal for full image view remains the same */}
        {modalOpen && (
          <div className={styles["aboutme-modal-overlay"]} style={{backgroundImage:`url(${sliderImages[modalImgIdx]})`}} onClick={() => setModalOpen(false)}>
            <div className={styles["aboutme-modal-contentPolaroid"]} onClick={e => e.stopPropagation()}>
              <button className={styles["aboutme-modal-close"]} onClick={() => setModalOpen(false)}>&times;</button>
              <button className={styles["aboutme-modal-arrow"]} style={{left:0}} onClick={e => {e.stopPropagation(); setModalImgIdx((modalImgIdx-1+sliderImages.length)%sliderImages.length);}}>&#8592;</button>
              <img
                src={sliderImages[modalImgIdx]}
                alt="Full"
                className={styles["aboutme-modal-imgPolaroid"]}
                onTouchStart={handleModalTouchStart}
                onTouchMove={handleModalTouchMove}
                onTouchEnd={handleModalTouchEnd}
              />
              <button className={styles["aboutme-modal-arrow"]} style={{right:0}} onClick={e => {e.stopPropagation(); setModalImgIdx((modalImgIdx+1)%sliderImages.length);}}>&#8594;</button>
              <div className={styles["aboutme-modal-caption"]}>{polaroidCaptions[modalImgIdx]}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
