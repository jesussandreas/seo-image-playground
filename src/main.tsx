import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@primer/react-brand";
import "@primer/react-brand/lib/css/main.css";
import App from "./App";
import "./global.css";

const root = document.getElementById("root");

if (!root) throw new Error("The gallery root element is missing.");

createRoot(root).render(
  <StrictMode>
    <ThemeProvider colorMode="auto">
      <App />
    </ThemeProvider>
  </StrictMode>,
);
