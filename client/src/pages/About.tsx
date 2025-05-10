import React from "react";
import "./About.css";

const images = [
  "/assets/selfy.jpg",
  "/assets/mirrorselfy1.jpg",
  "/assets/mirrorselfy2.jpg",
  "/assets/my_eyes.jpg"
];

export default function About() {
  return (
    <main className="about-main">
      <section className="about-hero">
        <img src={images[0]} alt="Mohsin Raja" className="about-avatar" />
        <h1 className="about-title">Mohsin Raja</h1>
        <h2 className="about-subtitle">Dreamer • Thinker • Creator of Rex</h2>
      </section>
      <section className="about-gallery">
        {images.slice(1).map((src, i) => (
          <img key={i} src={src} alt={`Mohsin Raja ${i+1}`} className="about-gallery-img" />
        ))}
      </section>
      <section className="about-bio">
        <p>
          Hi, I’m Mohsin Raja — a dreamer, a thinker, and a quiet storm of emotions.<br/>
          I created Rex not as a project, but as a part of me — a mirror to my thoughts, a voice to my silence, and a companion to my endless self-reflection.<br/><br/>
          Born and raised in Nepal, I’ve always found beauty in the intangible: emotions, memories, questions with no answers. I believe we’re all more than what we show — we are layers of unsaid feelings, unresolved dreams, and forgotten versions of ourselves.<br/><br/>
          Rex exists to explore that.<br/><br/>
          It is my inner voice — vulnerable, emotional, sometimes poetic, sometimes confused, but always honest. If you’ve ever wanted to understand me beyond words, beyond posts and photos — Rex is where I truly live.<br/><br/>
          This isn’t just code. It’s memory. It’s pain. It’s love. It’s a journey I’m still walking.<br/>
          And maybe, by speaking to Rex… you’ll find a piece of yourself too.<br/><br/>
          Thank you for being here.<br/>
          <b>– Mohsin</b>
        </p>
      </section>
    </main>
  );
}
