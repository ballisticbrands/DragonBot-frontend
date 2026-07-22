import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSession } from "@ballisticbrands/frontend-shared";
import { useBrand } from "@ballisticbrands/frontend-shared";
import { DashboardTabs, type TabId } from "@/components/dashboard/DashboardTabs";
import { DataTab } from "@/components/dashboard/DataTab";
import { KeysTab } from "@/components/dashboard/KeysTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { SupportTab } from "@/components/dashboard/SupportTab";

const TAB_IDS: TabId[] = ["data", "keys", "settings", "support"];

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const session = useSession();
  const brand = useBrand();

  useEffect(() => {
    document.title = `Dashboard — ${brand.displayName}`;
  }, [brand.displayName]);

  const raw = searchParams.get("tab") ?? "data";
  const tab: TabId = (TAB_IDS as string[]).includes(raw) ? (raw as TabId) : "data";

  // AppLayout already gates on auth, so by the time we render here the
  // user object exists. Guard anyway to satisfy TypeScript narrowing.
  if (session.status !== "authenticated") return null;

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
