import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { TOOL_DOMAINS } from "@/lib/tools";
import {
  listConnections,
  getSyncStatus,
  triggerResync,
  type Connection,
  type SyncStatus,
} from "@/lib/connections";
import { useBrand } from "@ballisticbrands/frontend-shared";
import { trackAccountConnected } from "@ballisticbrands/frontend-shared";
import {
  ConnectAmazonAdsButton,
  ConnectAmazonButton,
  DisconnectButton,
  ReauthenticateAmazonButton,
} from "./ConnectionButtons";
import { CogsPanel } from "./CogsPanel";

export function DataTab() {
  const brand = useBrand();
  const [connections, setConnections] = useState<Connection[] | null>(null);

  const refresh = useCallback(async () => {
    const list = await listConnections();
    setConnections(list);
  }, []);

  // Fire an activation event + set a durable "serious user" property when
  // a NEW account is connected, then refresh the list. Wired only to the
  // connect buttons (not re-auth) so re-authentication doesn't count as a
  // new activation.
  const onSpApiConnected = useCallback(() => {
    trackAccountConnected("amazon_seller");
    void refresh();
  }, [refresh]);

  const onAdsConnected = useCallback(() => {
    trackAccountConnected("amazon_ads");
    void refresh();
  }, [refresh]);

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
                Authorize {brand.displayName} to read from your Seller Central account via SP-API.
              </p>
              <ConnectAmazonButton
                label="Connect Amazon Seller Central account"
                onConnected={onSpApiConnected}
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
                  onConnected={onSpApiConnected}
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
                Authorize {brand.displayName} to read from your Amazon Ads account via the
                Advertising API.
              </p>
              <ConnectAmazonAdsButton label="Connect Amazon Ads account" onConnected={onAdsConnected} />
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
                  onConnected={onAdsConnected}
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
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Account {index}
          </h4>
        )}

        {/* Identity block — the three things the user asked us to make
            primary: store name, seller ID, marketplaces. All three are
            now sourced directly from credentials.spapi (set by the
            OAuth callback + the marketplaceParticipations probe), not
            from Ads cross-pollination. */}
        <div className="mb-3">
          <h3 className="text-base font-semibold leading-tight">
            {conn.account_name ?? <PendingHint />}
          </h3>
          {conn.seller_id && (
            <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
              Seller ID: {conn.seller_id}
            </p>
          )}
        </div>

        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Marketplaces
          </p>
          {conn.countries && conn.countries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {conn.countries.map((c) => (
                <Badge key={c} tone="neutral">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <PendingHint />
          )}
        </div>

        {/* Secondary metadata — kept small + dense so the identity
            block above stays the visual focus. */}
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
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
          {typeof conn.synced_order_count === "number" && (
            <>
              <dt className="text-[var(--muted-foreground)]">Orders synced</dt>
              <dd>{conn.synced_order_count.toLocaleString()}</dd>
            </>
          )}
          <dt className="text-[var(--muted-foreground)]">Connected</dt>
          <dd>{conn.connected_at ? new Date(conn.connected_at).toLocaleString() : "—"}</dd>
        </dl>

        <SyncProgress connectionId={conn.id} connectedAt={conn.connected_at ?? null} />

        {/* Product costs (COGS) — user-uploaded, feeds profit metrics.
            Seller (SP-API) connections only; the backend rejects ads. */}
        <CogsPanel connectionId={conn.id} />
      </div>
      <div className="flex items-center gap-2 self-start">
        <StatusPill status={conn.status} />
        <ReauthenticateAmazonButton id={conn.id} onReauthenticated={onDisconnected} />
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
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Account {index}
          </h4>
        )}

        {/* Identity block — same layout as SP-API. account_name comes
            from credentials.ads.profiles[0].accountName; seller_id is
            populated only when all profiles agree on one merchant
            token (vendor / agency profiles legitimately have no
            sellerId, so the row hides when null). */}
        <div className="mb-3">
          <h3 className="text-base font-semibold leading-tight">
            {conn.account_name ?? <PendingHint />}
          </h3>
          {conn.seller_id && (
            <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
              Seller ID: {conn.seller_id}
            </p>
          )}
        </div>

        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Marketplaces
          </p>
          {conn.countries && conn.countries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {conn.countries.map((c) => (
                <Badge key={c} tone="neutral">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <PendingHint />
          )}
        </div>

        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
          {conn.account_type && (
            <>
              <dt className="text-[var(--muted-foreground)]">Account type</dt>
              <dd className="capitalize">{conn.account_type}</dd>
            </>
          )}
          {conn.profile_ids && conn.profile_ids.length > 0 && (
            <>
              <dt className="text-[var(--muted-foreground)]">Profiles</dt>
              <dd>{conn.profile_ids.length}</dd>
            </>
          )}
          <dt className="text-[var(--muted-foreground)]">Connected</dt>
          <dd>{conn.connected_at ? new Date(conn.connected_at).toLocaleString() : "—"}</dd>
        </dl>

        <SyncProgress connectionId={conn.id} connectedAt={conn.connected_at ?? null} />
      </div>
      <div className="flex items-center gap-2 self-start">
        <StatusPill status={conn.status} />
        <DisconnectButton id={conn.id} onDisconnected={onDisconnected} />
      </div>
    </div>
  );
}

function SyncProgress({
  connectionId,
  connectedAt,
}: {
  connectionId: string;
  connectedAt: string | null;
}) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const stopRef = useRef(false);
  const refresh = useCallback(async () => {
    const s = await getSyncStatus(connectionId);
    setStatus(s);
  }, [connectionId]);
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setRetryError(null);
    const result = await triggerResync(connectionId);
    if (result.error) {
      setRetryError(result.error);
      setRetrying(false);
      return;
    }
    // Refresh status immediately so the panel reflects the new run;
    // the polling loop will keep things fresh afterwards.
    await refresh();
    // Leave `retrying` on for a short beat so the button text doesn't
    // flicker back to "Retry sync" before the backend stamps a new
    // lastSync. The polling loop catches up within ~10s.
    setTimeout(() => setRetrying(false), 5_000);
  }, [connectionId, refresh]);

  useEffect(() => {
    stopRef.current = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const s = await getSyncStatus(connectionId);
      if (stopRef.current) return;
      setStatus(s);
      // Poll faster while the sync is actively progressing (fewer
      // tables than expected reports), slow down once everything has
      // landed at least once.
      const done =
        s !== null &&
        s.expected_tables > 0 &&
        s.tables_with_rows >= s.expected_tables;
      const delay = done ? 60_000 : 10_000;
      timer = setTimeout(tick, delay);
    };

    void tick();
    return () => {
      stopRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [connectionId]);

  const expected = useMemo(() => {
    if (!status) return 0;
    // expected_tables is the precise ceiling the backend computes
    // (handles multi-marketplace reports + agency-profile skipping).
    // Falls back to the legacy product for older backend versions
    // that don't surface expected_tables yet.
    if (typeof status.expected_tables === "number" && status.expected_tables > 0) {
      return status.expected_tables;
    }
    return status.expected_reports * Math.max(1, status.marketplace_count);
  }, [status]);

  // ETA derived from observed throughput since the connection started.
  // We use `connected_at` (set by the OAuth callback) as t0 — it's the
  // closest stable signal we have to "sync started". Once at least one
  // table has landed, rate = completed / elapsed; remaining time =
  // (expected - completed) / rate. We only show the estimate after the
  // second table lands so the rate isn't dominated by Amazon's
  // ~minute-long first-report cold start.
  const eta = useMemo(() => {
    if (!status || !connectedAt || expected === 0) return null;
    const completed = status.tables_with_rows;
    if (completed >= expected) return null;
    if (completed < 2) return null;
    const startedMs = new Date(connectedAt).getTime();
    if (!Number.isFinite(startedMs)) return null;
    const elapsedMs = Date.now() - startedMs;
    if (elapsedMs <= 0) return null;
    const ratePerMs = completed / elapsedMs;
    if (ratePerMs <= 0) return null;
    const remainingMs = (expected - completed) / ratePerMs;
    return formatDuration(remainingMs);
  }, [status, connectedAt, expected]);

  if (!status) return null;

  const last = status.last_sync;
  // `batch_progress` is set while the orchestrator is mid-batch and
  // cleared when it completes. We use it (not table-population
  // counts) as the source-of-truth for "is the sync done":
  // many reports legitimately return empty data (seller has no
  // stranded inventory, no FBA in some markets, no ad activity in
  // a profile, etc.) so populated_tables < expected is the steady
  // state for almost every account. "Done" means the orchestrator
  // walked every catalog slot, regardless of whether each slot
  // produced rows.
  const isBatchInFlight = status.batch_progress != null;
  const isDone = !isBatchInFlight;
  const isFailed = !isBatchInFlight && last?.status === "failed";

  // While a batch is running, show progress based on slots processed
  // (batchProgress.nextIndex / total). Once finished, the bar is
  // pinned at 100% — the populated-tables number is informational.
  const bp = status.batch_progress;
  const progressPct = isDone
    ? 100
    : bp && bp.total > 0
      ? Math.min(100, Math.round((bp.nextIndex / bp.total) * 100))
      : expected > 0
        ? Math.min(100, Math.round((status.tables_with_rows / expected) * 100))
        : 0;

  // "Stalled" — nothing landed in a long while. Catches the orchestrator
  // dying mid-batch without stamping a lastSync. Threshold is 15 min,
  // not 5 — SP-API report processing on Amazon's side legitimately
  // takes 5-10 min for the bigger inventory / orders reports, and we
  // don't want to false-positive while a report is in flight. We use
  // the MAX of (BQ table last_modified, orchestrator lastSync stamp,
  // connectedAt) because either signal "the loader did something
  // recently" or "the orchestrator stamped recently" means we're not
  // actually stalled.
  const stalledMs = 15 * 60_000;
  const activityCandidates = [status.last_modified, last?.finishedAt, connectedAt]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .map((s) => new Date(s).getTime())
    .filter((n) => Number.isFinite(n));
  const lastActivityMs = activityCandidates.length > 0 ? Math.max(...activityCandidates) : null;
  const isStalled =
    !isDone && !isFailed && lastActivityMs != null && Date.now() - lastActivityMs > stalledMs;

  // Show the retry button whenever the sync is in a "stable" state —
  // failed, stalled, or done. Hide while progress is actively landing
  // so people don't accidentally restart a healthy sync.
  const showRetry = isFailed || isStalled || isDone;

  return (
    <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-muted,transparent)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Sync progress</div>
        <div className="flex items-center gap-3">
          {showRetry && (
            <button
              type="button"
              className="rounded border border-[var(--border)] px-2 py-0.5 text-xs hover:bg-[var(--border)] disabled:opacity-50"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? "Restarting…" : isDone ? "Resync" : "Retry sync"}
            </button>
          )}
          <button
            type="button"
            className="text-xs text-[var(--muted-foreground)] hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
        </div>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className={`h-full transition-all ${
            isFailed
              ? "bg-[var(--destructive,#dc2626)]"
              : isStalled
                ? "bg-[var(--warning,#d97706)]"
                : "bg-[var(--accent,#3b82f6)]"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-xs text-[var(--muted-foreground)]">
        <span>
          {isDone && bp == null
            ? `${status.tables_with_rows} table${status.tables_with_rows === 1 ? "" : "s"} with data`
            : bp
              ? `${bp.nextIndex} / ${bp.total} reports processed`
              : `${status.tables_with_rows} / ${expected || "?"} tables populated`}
          {status.total_rows > 0 && ` · ${status.total_rows.toLocaleString()} rows`}
          {status.total_bytes > 0 && ` · ${formatBytes(status.total_bytes)}`}
        </span>
        <span>
          {isFailed
            ? "Sync failed"
            : isStalled
              ? "Sync stalled"
              : isDone
                ? "Sync complete"
                : eta
                  ? `~${eta} remaining`
                  : bp && bp.nextIndex === 0
                    ? "Waiting for first report…"
                    : "Estimating…"}
        </span>
      </div>

      {isFailed && last?.error && (
        <div className="mt-2 rounded border border-[var(--destructive,#dc2626)] bg-[var(--destructive,#dc2626)]/10 p-2 text-xs">
          <div className="font-medium text-[var(--destructive,#dc2626)]">
            Last report failed
            {last.reportType && (
              <span className="ml-1 font-mono text-[var(--muted-foreground)]">
                ({last.reportType})
              </span>
            )}
          </div>
          <div className="mt-1 break-words text-[var(--muted-foreground)]">{last.error}</div>
        </div>
      )}

      {retryError && (
        <div className="mt-2 text-xs text-[var(--destructive,#dc2626)]">{retryError}</div>
      )}

      {last && !isFailed && (
        <div className="mt-2 text-xs text-[var(--muted-foreground)]">
          Last report:{" "}
          <span className="font-mono">{last.reportType ?? last.reportTypeId ?? "—"}</span>{" "}
          <Badge tone="success">ok</Badge>
          {last.finishedAt && ` · ${new Date(last.finishedAt).toLocaleTimeString()}`}
          {typeof last.rowsLoaded === "number" && ` · ${last.rowsLoaded.toLocaleString()} rows`}
        </div>
      )}

      {expanded && (
        <div className="mt-3 max-h-64 overflow-auto">
          {status.tables.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              No tables yet. The first report should land within ~10 minutes of connecting.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-left text-[var(--muted-foreground)]">
                <tr>
                  <th className="py-1 pr-2 font-normal">Table</th>
                  <th className="py-1 pr-2 font-normal">Rows</th>
                  <th className="py-1 pr-2 font-normal">Size</th>
                  <th className="py-1 font-normal">Updated</th>
                </tr>
              </thead>
              <tbody>
                {status.tables.map((t) => (
                  <tr key={t.name} className="border-t border-[var(--border)]">
                    <td className="py-1 pr-2 font-mono">{t.name}</td>
                    <td className="py-1 pr-2">{t.row_count.toLocaleString()}</td>
                    <td className="py-1 pr-2">{formatBytes(t.bytes)}</td>
                    <td className="py-1 text-[var(--muted-foreground)]">
                      {new Date(t.last_modified).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${Math.max(sec, 1)} sec`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `${hr} hr ${remMin} min` : `${hr} hr`;
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
