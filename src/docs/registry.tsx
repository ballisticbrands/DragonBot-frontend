import type { ReactNode } from "react";
import { GettingStarted } from "@/docs/content/getting-started";

// A single documentation page. `slug` is the URL segment under /docs,
// `title` shows in the sidebar + browser tab, and `Content` renders the
// body (authored as semantic HTML inside the .docs-prose container — see
// globals.css for the prose styling).
export type Doc = {
  slug: string;
  title: string;
  // Short blurb shown in the sidebar / on the docs index. Optional.
  description?: string;
  Content: () => ReactNode;
};

// The ordered list of docs. Add new pages here — the sidebar, routing,
// and the /docs index all read from this single registry.
export const docs: Doc[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    description: "Set up DragonBot and connect your first AI agent.",
    Content: GettingStarted,
  },
];

export function getDoc(slug: string): Doc | undefined {
  return docs.find((d) => d.slug === slug);
}

// The first doc is the default landing page for /docs.
export const defaultDoc = docs[0];
