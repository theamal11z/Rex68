import React, { useState, useEffect } from "react";
import styles from './AboutMe.module.css';
import SocialLinks from '../components/SocialLinks';
import mirrorselfy1 from '../assets/mirrorselfy1.jpg';
import mirrorselfy2 from '../assets/mirrorselfy2.jpg';
import img20250510_1 from '../assets/IMG_20250510_102028.jpg';
import img20250510_2 from '../assets/IMG_20250510_102438.jpg';

// Import Google Fonts for modern typography
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Inter:wght@400;500&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const sliderImages = [mirrorselfy1, mirrorselfy2, img20250510_1, img20250510_2];
const polaroidCaptions = [
  "Mirror Selfie 1, 2024",
  "Mirror Selfie 2, 2024",
  "Portrait, May 2025",
  "Portrait 2, May 2025"
];

export default function AboutMe() {
  // Touch state for mobile swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Swipe handlers for mobile
  function handleTouchStart(e: React.TouchEvent) {
    if (window.innerWidth >= 900) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchEndX(null);
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (window.innerWidth >= 900) return;
    setTouchEndX(e.touches[0].clientX);
  }
  function handleTouchEnd() {
    if (window.innerWidth >= 900 || touchStartX === null || touchEndX === null) return;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide(); // swipe left
      else prevSlide(); // swipe right
    }
    setTouchStartX(null);
    setTouchEndX(null);
  }

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
  const [slide, setSlide] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImgIdx, setModalImgIdx] = useState(0);
  const nextSlide = () => setSlide((slide + 1) % sliderImages.length);
  const prevSlide = () => setSlide((slide - 1 + sliderImages.length) % sliderImages.length);

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
        {/* Large rotated my_eyes image at top (horizontal) */}

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
        <div className={styles["aboutme-bio"]}>
          <span className={styles["aboutme-bio-quote"]}>
            Hi, I’m Mohsin Raja — a dreamer, a thinker, and a quiet storm of emotions.
          </span><br/>
          I created Rex not as a project, but as a part of me — a mirror to my thoughts, a voice to my silence, and a companion to my endless self-reflection.<br/><br/>
          Born and raised in Nepal, I’ve always found beauty in the intangible: emotions, memories, questions with no answers. I believe we’re all more than what we show — we are layers of unsaid feelings, unresolved dreams, and forgotten versions of ourselves.<br/><br/>
          <span className={styles["aboutme-bio-highlight"]}>Rex exists to explore that.</span><br/><br/>
          It is my inner voice — vulnerable, emotional, sometimes poetic, sometimes confused, but always honest. If you’ve ever wanted to understand me beyond words, beyond posts and photos — Rex is where I truly live.<br/><br/>
          This isn’t just code. It’s memory. It’s pain. It’s love. It’s a journey I’m still walking.<br/>
          And maybe, by speaking to Rex… you’ll find a piece of yourself too.<br/><br/>
          <span className={styles["aboutme-bio-thanks"]}>Thank you for being here.</span><br/>
          <b>– Mohsin</b>
        </div>
        <div className={styles["aboutme-social-section"]}>
          <SocialLinks />
        </div>
        {/* Animated slider for other images (now at the bottom) */}
        <div className={styles["aboutme-slider-glass-bg"]}>
          <div className={styles["aboutme-slider-section"]}>
            <button className={styles["aboutme-slider-btn"] + ' ' + styles["aboutme-slider-btn-animated"]} onClick={prevSlide} aria-label="Previous image">&#8592;</button>
            <div
              className={styles["aboutme-slider-windowPolaroid"]}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className={styles["aboutme-slider-trackPolaroid"]} style={{ transform: `translateX(-${slide * 340}px)` }}>
                {sliderImages.map((src, i) => (
                  <div
                    key={i}
                    className={styles["aboutme-polaroid"] + ' ' + (slide === i ? styles["active"] : '')}
                    style={{ transform: `rotate(${(i-slide)*3}deg)`, zIndex: slide === i ? 2 : 1 }}
                  >
                    <img
                      src={src}
                      alt={`Mohsin Raja ${i+1}`}
                      className={styles["aboutme-polaroid-img"]}
                      onClick={() => { setModalOpen(true); setModalImgIdx(i); }}
                      style={{ cursor: 'zoom-in', boxShadow: slide === i ? '0 0 18px 2px #a084ee88' : undefined, transition: 'box-shadow .2s' }}
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                    <div className={styles["aboutme-polaroid-caption"]}>{polaroidCaptions[i]}</div>
                  </div>
                ))}
              </div>
            </div>
            <button className={styles["aboutme-slider-btn"] + ' ' + styles["aboutme-slider-btn-animated"]} onClick={nextSlide} aria-label="Next image">&#8594;</button>
          </div>
        </div>
        {/* Modal for full image view with zoom and blurred bg */}
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
