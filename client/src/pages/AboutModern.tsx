import React from "react";

const images = [
  require('./assets/selfy.jpg'),
  require('./assets/mirrorselfy1.jpg'),
  require('./assets/mirrorselfy2.jpg'),
  require('./assets/my_eyes.jpg')
];

export default function AboutModern() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-terminal-dark via-black to-terminal-purple flex flex-col items-center justify-center py-10 px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-2xl w-full flex flex-col items-center border border-terminal-purple/40">
        <img
          src={images[0]}
          alt="Mohsin Raja"
          className="w-36 h-36 rounded-full border-4 border-terminal-purple shadow-lg mb-4 object-cover bg-white/30"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
        <h1 className="text-4xl font-bold text-terminal-purple mb-1 text-center drop-shadow-lg">Mohsin Raja</h1>
        <h2 className="text-lg text-terminal-dark mb-6 text-center">Dreamer • Thinker • Creator of Rex</h2>
        <p className="text-base md:text-lg text-white/90 leading-relaxed text-center">
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
        <div className="flex gap-4 mt-8 flex-wrap justify-center">
          {images.slice(1).map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Mohsin Raja ${i+1}`}
              className="w-28 h-28 rounded-2xl border-2 border-terminal-purple object-cover bg-white/20 shadow"
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
