import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "@ballisticbrands/frontend-shared";
import { useBrand } from "@ballisticbrands/frontend-shared";
import { DashboardTabs, type TabId } from "@/components/dashboard/DashboardTabs";
import { DataTab } from "@/components/dashboard/DataTab";
import { KeysTab } from "@/components/dashboard/KeysTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { SupportTab } from "@/components/dashboard/SupportTab";
import { ConnectAmazonPrompt } from "@/components/dashboard/ConnectAmazonPrompt";
import { listConnections, type Connection } from "@/lib/connections";

const TAB_IDS: TabId[] = ["data", "keys", "settings", "support"];

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const session = useSession();
  const brand = useBrand();
  // Without at least one connected Amazon account (Seller Central OR
  // Ads — DragonBot is usable Ads-only) the product has nothing to work
  // with, so we replace the whole tabbed dashboard with a full-page
  // onboarding prompt. `null` = still loading connections; distinguishes
  // the "no data yet" flash from the confirmed empty state. Same gate
  // as DragonRefunds-frontend's Dashboard.
  const [connections, setConnections] = useState<Connection[] | null>(null);

  const refresh = useCallback(async () => {
    setConnections(await listConnections());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    document.title = `Dashboard — ${brand.displayName}`;
  }, [brand.displayName]);

  const raw = searchParams.get("tab") ?? "data";
  const tab: TabId = (TAB_IDS as string[]).includes(raw) ? (raw as TabId) : "data";

  // AppLayout already gates on auth, so by the time we render here the
  // user object exists. Guard anyway to satisfy TypeScript narrowing.
  if (session.status !== "authenticated") return null;

  // Loading gate: show a blank shell (matches AppLayout's loading
  // pattern) instead of flashing the empty-state prompt while the
  // /v1/connections call is in flight.
  if (connections === null) {
    return <div className="min-h-screen" />;
  }

  if (connections.length === 0) {
    return <ConnectAmazonPrompt onConnected={refresh} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Connect your Amazon Seller account, mint API keys, and wire up your agent.
        </p>
      </div>
      <DashboardTabs active={tab} />
      <div className="mt-6">
        {tab === "data" && <DataTab />}
        {tab === "keys" && <KeysTab />}
        {tab === "settings" && <SettingsTab user={session.user} />}
        {tab === "support" && <SupportTab />}
      </div>
    </div>
  );
}
