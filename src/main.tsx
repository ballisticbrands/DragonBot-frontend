import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { captureAttribution } from "./lib/attribution";
import { activeBrand } from "./brands";
import { BrandProvider } from "./lib/brand-context";
import "./globals.css";

// This repo builds one brand (DragonBot). Every downstream step —
// analytics injection, tab title, meta description — reads brand
// config from here. When sibling repos like dragonrefunds-frontend
// do the same they point at their own brand file.
const brand = activeBrand();

// Analytics injection at runtime rather than inline in index.html.
// Keeps the pattern consistent with the sibling brand repo (its own
// GA4 / Clarity IDs) and makes the eventual shared-package extract
// easier — main.tsx of each brand does this the same way.
function injectGa4(measurementId: string): void {
  if (!measurementId) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(s);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).dataLayer = (window as any).dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag = function (...args: unknown[]) { (window as any).dataLayer.push(args); };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId);
}

function injectClarity(projectId: string): void {
  if (!projectId) return;
  // Verbatim port of the standard Clarity snippet — a small IIFE that
  // creates the c[a] queue function and injects the tag script. Only
  // change vs. the pasted code is projectId as an argument instead of
  // an inline string.
  ((c, l, a, r, i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c as any)[a] = (c as any)[a] || function (...args: unknown[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((c as any)[a].q = (c as any)[a].q || []).push(args);
    };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName(r)[0];
    y?.parentNode?.insertBefore(t, y);
  })(window, document, "clarity", "script", projectId);
}

injectGa4(brand.ga4MeasurementId);
injectClarity(brand.clarityId);

// Brand-aware tab title + meta description. index.html no longer sets
// brand-specific text — we swap it in here so both hosts get correct
// SEO / share-preview metadata before the SPA even mounts.
document.title = `${brand.displayName} — Amazon Seller MCP for AI agents`;
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) metaDesc.setAttribute("content", brand.metaDescription);

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
    <BrandProvider brand={brand}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BrandProvider>
  </StrictMode>,
);
