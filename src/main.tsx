import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  BrandProvider,
  captureAttribution,
  configureShared,
} from "@ballisticbrands/frontend-shared";
import App from "./App";
import { activeBrand } from "./brands";
import { config } from "./lib/config";
import "./globals.css";

// Resolve the active brand once at boot. Every downstream step —
// analytics injection, tab title, meta description, shared library
// runtime — keys off it.
const brand = activeBrand();

// Configure @ballisticbrands/frontend-shared BEFORE any of its
// functions run. Sets the module-level singleton non-React code
// (attribution helpers, fetch wrapper) reads apiUrl + brand from.
// React components read brand via useBrand() from the same package.
configureShared({ apiUrl: config.apiUrl, brand });

// Per-brand analytics injection. Moved out of index.html so a single
// codebase can serve differently-branded builds without shipping
// every brand's IDs to every user. GA4 + Clarity scripts are
// injected into <head> at runtime after brand is resolved.
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
  // Verbatim port of the standard Clarity snippet.
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

// Brand-aware tab title + meta description. index.html no longer
// sets brand-specific text — swap in here so search-preview /
// share-preview metadata is correct before the SPA even mounts.
document.title = `${brand.displayName} — Amazon Seller MCP for AI agents`;
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) metaDesc.setAttribute("content", brand.metaDescription);

// SPA fallback for GitHub Pages (see public/404.html). MUST run
// BEFORE captureAttribution() — the fallback rewrites
// window.location, and captureAttribution reads
// window.location.search to snapshot UTMs.
const redirectPath = sessionStorage.getItem("spa-redirect");
if (redirectPath && redirectPath !== "/") {
  sessionStorage.removeItem("spa-redirect");
  window.history.replaceState(null, "", redirectPath);
}

// Snapshot the visitor's first landing into localStorage. First-touch
// wins — no-op on subsequent loads.
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
