import { useEffect } from "react";
import { DashboardMetricsPage, useBrand } from "@ballisticbrands/frontend-shared";
import { RequireConnection } from "@/components/RequireConnection";

// The dashboard is now the seller's numbers, not a connection manager.
//
// What used to live here (the tabbed Data / Keys / Settings / Support
// shell) is split across routes off the left rail — see AppLayout.
// The page body itself comes from the shared package so Dragon Refunds
// and any future brand get the same one.

export function Dashboard() {
  const brand = useBrand();

  useEffect(() => {
    document.title = `Dashboard — ${brand.displayName}`;
  }, [brand.displayName]);

  return (
    <RequireConnection>
      {/* COGS lives inside each connection's row on the Data sources
          page; that's where the "turn on profit" prompt should land. */}
      <DashboardMetricsPage cogsHref="/data" connectHref="/data" />
    </RequireConnection>
  );
}
