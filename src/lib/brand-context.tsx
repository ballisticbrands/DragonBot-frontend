// React context that exposes the resolved BrandConfig to every
// component in the tree. Detection happens once at mount time (see
// main.tsx) based on window.location.hostname; the resolved brand
// stays stable for the whole session.
//
// Consumer pattern:
//
//   const brand = useBrand();
//   return <h1>Welcome to {brand.displayName}</h1>;
//
// Prefer useBrand() over importing detectBrand() directly — the hook
// ensures every component reads from the same source of truth and
// makes it trivial to override brand in tests via a test-only
// <BrandProvider brand={fixture}>.

import { createContext, useContext, type ReactNode } from "react";
import type { BrandConfig } from "@/brands";

const BrandContext = createContext<BrandConfig | null>(null);

export function BrandProvider({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandConfig {
  const brand = useContext(BrandContext);
  if (!brand) {
    throw new Error("useBrand() must be called from a component wrapped in <BrandProvider>");
  }
  return brand;
}
