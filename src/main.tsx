import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { captureAttribution } from "./lib/attribution";
import "./globals.css";

// SPA fallback for GitHub Pages (see public/404.html). On a direct
// hit to /dashboard or /sign-up, GH Pages serves 404.html, which
// stashes the requested path into sessionStorage and redirects to
// /. We pick that path back up here and replace the URL state so
// react-router renders the intended route. After this restore the
// session entry is consumed.
//
// MUST run BEFORE captureAttribution() — the fallback rewrites
// window.location, and captureAttribution reads window.location.search
// to snapshot UTMs. If capture runs first it sees `/` (no UTMs) and
// mis-attributes the visitor as a direct landing. Ordering bug caught
// on the first end-to-end attribution test 2026-07-06.
const redirectPath = sessionStorage.getItem("spa-redirect");
if (redirectPath && redirectPath !== "/") {
  sessionStorage.removeItem("spa-redirect");
  window.history.replaceState(null, "", redirectPath);
}

// Snapshot the visitor's first landing (UTMs / click IDs / referrer /
// landing URL) into localStorage. First-touch wins — if we've already
// captured on a prior page load, this is a no-op. The sign-up form
// reads the blob and POSTs it to the backend. See src/lib/attribution.ts.
captureAttribution();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
