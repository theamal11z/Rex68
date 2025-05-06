import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

// Import font from Google Fonts
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap';
document.head.appendChild(link);

// Add title
const title = document.createElement('title');
title.textContent = "Rex - Mohsin's Inner Voice";
document.head.appendChild(title);

createRoot(document.getElementById("root")!).render(
  <>
    <Toaster />
    <App />
  </>
);
