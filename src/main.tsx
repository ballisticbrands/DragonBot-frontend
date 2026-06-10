import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./globals.css";

// SPA fallback for GitHub Pages (see public/404.html). On a direct
// hit to /dashboard or /sign-up, GH Pages serves 404.html, which
// stashes the requested path into sessionStorage and redirects to
// /. We pick that path back up here and replace the URL state so
// react-router renders the intended route. After this restore the
// session entry is consumed.
const redirectPath = sessionStorage.getItem("spa-redirect");
if (redirectPath && redirectPath !== "/") {
  sessionStorage.removeItem("spa-redirect");
  window.history.replaceState(null, "", redirectPath);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
