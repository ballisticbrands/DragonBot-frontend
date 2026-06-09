import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { TOOL_DOMAINS } from "@/lib/tools";
import { listConnections, type Connection } from "@/lib/connections";
import { config } from "@/lib/config";
import {
  ConnectAmazonAdsButton,
  ConnectAmazonButton,
  DisconnectButton,
} from "./ConnectionButtons";

export function DataTab() {
  const [connections, setConnections] = useState<Connection[] | null>(null);

  const refresh = useCallback(async () => {
    const list = await listConnections();
    setConnections(list);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const amazons = (connections ?? []).filter((c) => c.provider === "amazon-selling-partner");
  const amazonAds = (connections ?? []).filter((c) => c.provider === "amazon-ads");

  return (
    <div
      id="dashboard-data-panel"
      role="tabpanel"
      aria-labelledby="dashboard-data-tab"
      className="space-y-6"
    >
      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Amazon Seller Central</CardTitle>
            <CardDescription className="mt-1">
              Connect your Amazon Seller accounts to give your agent access to ads, inventory,
              catalog, finance, fulfillment, and ranking data. You can connect multiple seller
              accounts.
            </CardDescription>
          </div>
          <ConnectedCountBadge count={amazons.length} />
        </CardHeader>
        <CardBody>
          {connections === null ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : amazons.length === 0 ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Authorize {config.brand.name} to read from your Seller Central account via SP-API.
              </p>
              <ConnectAmazonButton
                label="Connect Amazon Seller Central account"
                onConnected={refresh}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {amazons.map((c, i) => (
                <SpApiConnectionRow
                  key={c.id}
                  conn={c}
                  index={i + 1}
                  total={amazons.length}
                  onDisconnected={refresh}
                />
              ))}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <ConnectAmazonButton
                  label="Connect another Seller Central account"
                  variant="secondary"
                  onConnected={refresh}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Amazon Ads</CardTitle>
            <CardDescription className="mt-1">
              Connect your Amazon Ads accounts to pull campaign, ad-group, keyword, and reporting
              data into your agent. You can connect multiple ads accounts.
            </CardDescription>
          </div>
          <ConnectedCountBadge count={amazonAds.length} />
        </CardHeader>
        <CardBody>
          {connections === null ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : amazonAds.length === 0 ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Authorize {config.brand.name} to read from your Amazon Ads account via the
                Advertising API.
              </p>
              <ConnectAmazonAdsButton label="Connect Amazon Ads account" onConnected={refresh} />
            </div>
          ) : (
            <div className="space-y-4">
              {amazonAds.map((c, i) => (
                <AdsConnectionRow
                  key={c.id}
                  conn={c}
                  index={i + 1}
                  total={amazonAds.length}
                  onDisconnected={refresh}
                />
              ))}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <ConnectAmazonAdsButton
                  label="Connect another Ads account"
                  variant="secondary"
                  onConnected={refresh}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available data</CardTitle>
          <CardDescription className="mt-1">
            Once connected, your agent gets these tools across three domains.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOL_DOMAINS.map((d) => (
              <div key={d.id} className="rounded-md border border-[var(--border)] p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{d.name}</h4>
                  <Badge tone="accent">{d.toolCount} tools</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{d.description}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function SpApiConnectionRow({
  conn,
  index,
  total,
  onDisconnected,
}: {
  conn: Connection;
  index: number;
  total: number;
  onDisconnected: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        {total > 1 && (
          <h4 className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">
            Account {index}
          </h4>
        )}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {conn.account_name && (
            <>
              <dt className="text-[var(--muted-foreground)]">Account</dt>
              <dd>{conn.account_name}</dd>
            </>
          )}
          <dt className="text-[var(--muted-foreground)]">Marketplaces</dt>
          <dd>
            {conn.countries && conn.countries.length > 0 ? conn.countries.join(", ") : <PendingHint />}
          </dd>
          {conn.brands && conn.brands.length > 0 && (
            <>
              <dt className="text-[var(--muted-foreground)]">Brands</dt>
              <dd>{conn.brands.join(", ")}</dd>
            </>
          )}
          {conn.currencies && conn.currencies.length > 0 && (
            <>
              <dt className="text-[var(--muted-foreground)]">Currency</dt>
              <dd>{conn.currencies.join(", ")}</dd>
            </>
          )}
          <dt className="text-[var(--muted-foreground)]">Orders synced</dt>
          <dd>
            {typeof conn.synced_order_count === "number"
              ? conn.synced_order_count.toLocaleString()
              : <PendingHint />}
          </dd>
          <dt className="text-[var(--muted-foreground)]">Connected</dt>
          <dd>{conn.connected_at ? new Date(conn.connected_at).toLocaleString() : "—"}</dd>
        </dl>
      </div>
      <div className="flex items-center gap-2 self-start">
        <StatusPill status={conn.status} />
        <DisconnectButton id={conn.id} onDisconnected={onDisconnected} />
      </div>
    </div>
  );
}

function AdsConnectionRow({
  conn,
  index,
  total,
  onDisconnected,
}: {
  conn: Connection;
  index: number;
  total: number;
  onDisconnected: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        {total > 1 && (
          <h4 className="mb-2 text-sm font-medium text-[var(--muted-foreground)]">
            Account {index}
          </h4>
        )}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <dt className="text-[var(--muted-foreground)]">Account</dt>
          <dd>{conn.account_name ?? <PendingHint />}</dd>
          <dt className="text-[var(--muted-foreground)]">Account type</dt>
          <dd className="capitalize">{conn.account_type ?? <PendingHint />}</dd>
          <dt className="text-[var(--muted-foreground)]">Profiles</dt>
          <dd>
            {conn.profile_ids && conn.profile_ids.length > 0
              ? `${conn.profile_ids.length}${
                  conn.countries && conn.countries.length > 0
                    ? ` (${conn.countries.join(", ")})`
                    : ""
                }`
              : <PendingHint />}
          </dd>
          <dt className="text-[var(--muted-foreground)]">Connected</dt>
          <dd>{conn.connected_at ? new Date(conn.connected_at).toLocaleString() : "—"}</dd>
        </dl>
      </div>
      <div className="flex items-center gap-2 self-start">
        <StatusPill status={conn.status} />
        <DisconnectButton id={conn.id} onDisconnected={onDisconnected} />
      </div>
    </div>
  );
}

function ConnectedCountBadge({ count }: { count: number }) {
  if (count === 0) return <Badge tone="warn">Not connected</Badge>;
  return <Badge tone="success">{count === 1 ? "1 account" : `${count} accounts`}</Badge>;
}

function PendingHint() {
  // Shown for fields populated from the first BigQuery sync. Until that
  // runs, we can't display the value. Once Airbyte's initial sync
  // completes (~10 min), the row gets enriched on the next reload.
  return (
    <span
      className="text-[var(--muted-foreground)]"
      title="Will appear after the first sync completes"
    >
      syncing…
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: "success" | "warn" | "danger" | "neutral"; label: string }> = {
    connected: { tone: "success", label: "Connected" },
    pending: { tone: "warn", label: "Pending" },
    expired: { tone: "warn", label: "Expired" },
    error: { tone: "danger", label: "Error" },
  };
  const item = map[status] ?? { tone: "neutral" as const, label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
