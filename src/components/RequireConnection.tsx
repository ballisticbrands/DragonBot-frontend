import { useCallback, useEffect, useState } from "react";
import { listConnections, type Connection } from "@/lib/connections";
import { ConnectAmazonPrompt } from "@/components/dashboard/ConnectAmazonPrompt";

// Without at least one connected Amazon account (Seller Central OR Ads
// — DragonBot is usable Ads-only) the product has nothing to work with,
// so we replace the page with the full-page onboarding prompt.
//
// `null` = still loading; distinguishes the "no data yet" flash from
// the confirmed empty state. Previously this lived inside Dashboard.tsx
// and gated the whole tab set; now that the tabs are routes, it wraps
// each route that needs data. Settings and Support deliberately don't
// use it — a user should always be able to reach their billing and a
// support form, connected or not.

export function RequireConnection({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<Connection[] | null>(null);

  const refresh = useCallback(async () => {
    setConnections(await listConnections());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (connections === null) return <div className="min-h-screen" />;
  if (connections.length === 0) return <ConnectAmazonPrompt onConnected={refresh} />;
  return <>{children}</>;
}
