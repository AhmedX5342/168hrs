import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./styles.css";
import { readStore, STORAGE_KEYS } from "@/lib/storage";

// Apply the saved theme before the first render so the loader never flashes the wrong theme
const savedSettings = readStore<{ theme?: string } | null>(STORAGE_KEYS.settings, null);
document.documentElement.classList.toggle("dark", savedSettings?.theme === "dark");

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
