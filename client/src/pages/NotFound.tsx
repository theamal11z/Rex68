import React from "react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-terminal-dark via-black to-terminal-purple p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 max-w-lg w-full flex flex-col items-center border border-terminal-purple/40">
        <h1 className="text-6xl font-bold text-terminal-purple mb-4 drop-shadow">404</h1>
        <h2 className="text-2xl text-terminal-dark mb-4 text-center">Page Not Found</h2>
        <p className="text-lg text-white/90 mb-8 text-center">Sorry, the page you are looking for does not exist or has been moved.</p>
        <a href="/" className="px-6 py-2 rounded-lg bg-terminal-purple text-white font-semibold shadow hover:bg-terminal-pink transition">Go Home</a>
      </div>
    </main>
  );
}
