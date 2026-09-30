import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./lib/stable-vh";
import "./index.css";
import App from "./App";

// O site sempre abre no início (a embalagem rasgando): sem restaurar scroll antigo nem pular para #seção.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(null, "", location.pathname + location.search);
window.scrollTo(0, 0);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
