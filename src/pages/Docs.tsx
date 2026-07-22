import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { useBrand } from "@ballisticbrands/frontend-shared";
import { getDoc, defaultDoc } from "@/docs/registry";

/**
 * Renders a single documentation page by its `:slug` route param. Unknown
 * slugs bounce to the first doc. /docs (no slug) is handled by a redirect
 * in App.tsx to the default doc.
 */
export function Docs() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getDoc(slug) : undefined;
  const brand = useBrand();

  useEffect(() => {
    if (doc) document.title = `${doc.title} — ${brand.displayName} Docs`;
  }, [doc, brand.displayName]);

  if (!doc) return <Navigate to={`/docs/${defaultDoc.slug}`} replace />;

  const { Content } = doc;
  return (
    <DocsLayout>
      <Content />
    </DocsLayout>
  );
}
