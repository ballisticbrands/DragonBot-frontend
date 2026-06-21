import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { config } from "@/lib/config";
import { getDoc, defaultDoc } from "@/docs/registry";

/**
 * Renders a single documentation page by its `:slug` route param. Unknown
 * slugs bounce to the first doc. /docs (no slug) is handled by a redirect
 * in App.tsx to the default doc.
 */
export function Docs() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getDoc(slug) : undefined;

  useEffect(() => {
    if (doc) document.title = `${doc.title} — ${config.brand.name} Docs`;
  }, [doc]);

  if (!doc) return <Navigate to={`/docs/${defaultDoc.slug}`} replace />;

  const { Content } = doc;
  return (
    <DocsLayout>
      <Content />
    </DocsLayout>
  );
}
