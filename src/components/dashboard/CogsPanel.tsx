// Per-connection COGS manager — expandable panel inside the SP-API
// connection row (same in-row-panel pattern as SyncProgress).
//
// COGS is user-uploaded, per SKU, effective-dated: a row applies from
// its "From" date until the next From date for the same
// (SKU, ASIN, currency). Upload a CSV (our format or a SellerBoard
// export), edit single rows inline, export what's stored, or clear
// everything. The backend joins these costs onto orders in BigQuery
// (orders_with_cogs) so profit questions become answerable.

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@ballisticbrands/frontend-shared";
import { Input, Label } from "@ballisticbrands/frontend-shared";
import {
  COGS_FROM_SENTINEL,
  COGS_SAMPLE_CSV,
  clearCogs,
  downloadCogsExport,
  getCogsCatalog,
  listCogs,
  uploadCogsCsv,
  upsertCogsRow,
  type CatalogRow,
  type CogsRow,
  type CogsUploadResult,
} from "@/lib/cogs";

const PAGE_SIZE = 25;
const CATALOG_PAGE_SIZE = 25;

export function CogsPanel({ connectionId }: { connectionId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<"products" | "bulk">("products");
  const [rows, setRows] = useState<CogsRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async (newOffset = offset) => {
    const res = await listCogs(connectionId, { limit: PAGE_SIZE, offset: newOffset });
    if ("error" in res) {
      setLoadError(res.error);
      return;
    }
    setLoadError(null);
    setRows(res.rows);
    setTotal(res.total);
    setOffset(newOffset);
  }, [connectionId, offset]);

  useEffect(() => {
    if (expanded && view === "bulk" && rows === null) void refresh(0);
  }, [expanded, view, rows, refresh]);

  return (
    <div className="mt-3 rounded-md border border-[var(--border)]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-[var(--muted)]"
        aria-expanded={expanded}
      >
        <span>
          COGS{" "}
          <span className="font-normal text-[var(--muted-foreground)]">
            — product costs for profit tracking
          </span>
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">{expanded ? "Hide" : "Manage"}</span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-3 py-3">
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            Enter what you pay per unit (item + inbound shipping) next to each of your products.
            Costs are effective-dated, and your agent can then answer profit questions via the{" "}
            <code className="font-mono">profit_by_sku_and_date</code> and{" "}
            <code className="font-mono">profit_by_date</code> reports.
          </p>

          <div className="mb-3 flex gap-1 border-b border-[var(--border)]">
            {(["products", "bulk"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`-mb-px border-b-2 px-2 py-1.5 text-xs font-medium ${
                  view === v
                    ? "border-[var(--foreground)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {v === "products" ? "Products" : "Bulk CSV & entries"}
              </button>
            ))}
          </div>

          {view === "products" ? (
            <CatalogEditor connectionId={connectionId} />
          ) : (
            <>
              <UploadForm connectionId={connectionId} onUploaded={() => void refresh(0)} />

              {loadError && <p className="mt-3 text-xs text-[var(--danger)]">{loadError}</p>}

              {rows === null && !loadError ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">Loading…</p>
              ) : rows !== null && total === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                  No costs uploaded yet. Fill them in on the Products tab, start from the sample
                  file above, or import your SellerBoard COGS export.
                </p>
              ) : rows !== null ? (
                <CogsTable
                  rows={rows}
                  total={total}
                  offset={offset}
                  onPage={(o) => void refresh(o)}
                />
              ) : null}

              <EditorRow connectionId={connectionId} onSaved={() => void refresh(offset)} />

              <PanelFooter connectionId={connectionId} total={total} onCleared={() => void refresh(0)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── catalog editor (§20): costs next to your real products ──────────

function CatalogEditor({ connectionId }: { connectionId: string }) {
  const [rows, setRows] = useState<CatalogRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [listingsSynced, setListingsSynced] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (newOffset: number, query: string) => {
    const res = await getCogsCatalog(connectionId, {
      limit: CATALOG_PAGE_SIZE,
      offset: newOffset,
      q: query || undefined,
    });
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setError(null);
    setRows(res.rows);
    setTotal(res.total);
    setListingsSynced(res.listingsSynced);
    setOffset(newOffset);
  }, [connectionId]);

  useEffect(() => {
    void load(0, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  function onSearch(value: string) {
    setQ(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void load(0, value), 350);
  }

  if (rows === null && !error) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading your products…</p>;
  }
  if (error) return <p className="text-xs text-[var(--danger)]">{error}</p>;
  if (!listingsSynced) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Your product listings are still syncing from Amazon — check back shortly. You can use the
        Bulk CSV tab meanwhile.
      </p>
    );
  }
  if (rows !== null && total === 0 && q === "") {
    return <p className="text-sm text-[var(--muted-foreground)]">No listings found for this account.</p>;
  }

  return (
    <div>
      <Input
        placeholder="Search by product name, ASIN, or SKU"
        value={q}
        onChange={(e) => onSearch(e.target.value)}
        className="mb-2 h-8 max-w-sm"
      />
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium text-right">Price</th>
              <th className="px-3 py-2 font-medium text-right">Stock</th>
              <th className="px-3 py-2 font-medium text-right">Item cost</th>
              <th className="px-3 py-2 font-medium text-right">Shipping / unit</th>
              <th className="px-3 py-2 font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows!.map((r) => (
              <CatalogCostRow key={`${r.sku}|${r.asin}`} connectionId={connectionId} row={r} />
            ))}
          </tbody>
        </table>
      </div>
      {total > CATALOG_PAGE_SIZE && (
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {offset + 1}–{Math.min(offset + CATALOG_PAGE_SIZE, total)} of {total.toLocaleString()} products
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={offset === 0}
              onClick={() => void load(Math.max(0, offset - CATALOG_PAGE_SIZE), q)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={offset + CATALOG_PAGE_SIZE >= total}
              onClick={() => void load(offset + CATALOG_PAGE_SIZE, q)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogCostRow({ connectionId, row }: { connectionId: string; row: CatalogRow }) {
  const [itemCost, setItemCost] = useState(row.cogs ? String(row.cogs.costItemValue) : "");
  const [shipCost, setShipCost] = useState(row.cogs ? String(row.cogs.costShippingValue) : "");
  const [saved, setSaved] = useState<CatalogRow["cogs"]>(row.cogs);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const dirty =
    itemCost !== (saved ? String(saved.costItemValue) : "") ||
    shipCost !== (saved ? String(saved.costShippingValue) : "");

  async function save() {
    if (!dirty) return;
    const item = Number(itemCost);
    const ship = Number(shipCost);
    if ((itemCost !== "" && (!Number.isFinite(item) || item < 0)) ||
        (shipCost !== "" && (!Number.isFinite(ship) || ship < 0))) {
      setState("error");
      setErrMsg("Costs must be non-negative numbers.");
      return;
    }
    setState("saving");
    setErrMsg(null);
    const currency = saved?.currency ?? "USD";
    const res = await upsertCogsRow(connectionId, {
      childAsin: row.asin,
      sku: row.sku,
      // Match the currently-effective row when one exists (updates it);
      // otherwise the cost applies from the beginning.
      ...(saved ? { fromDate: saved.fromDate } : {}),
      costItemValue: itemCost === "" ? 0 : item,
      costShippingValue: shipCost === "" ? 0 : ship,
      currency,
    });
    if ("error" in res) {
      setState("error");
      setErrMsg(res.error);
      return;
    }
    setSaved({
      costItemValue: itemCost === "" ? 0 : item,
      costShippingValue: shipCost === "" ? 0 : ship,
      currency,
      fromDate: saved?.fromDate ?? COGS_FROM_SENTINEL,
      supplierName: saved?.supplierName ?? null,
    });
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  }

  // Rough unit margin using list price — real profit (fees, ads) lives
  // in the profit reports; this is instant feedback while typing.
  const unitCost =
    (itemCost === "" ? 0 : Number(itemCost) || 0) + (shipCost === "" ? 0 : Number(shipCost) || 0);
  const margin =
    row.price && row.price > 0 && (itemCost !== "" || shipCost !== "")
      ? (row.price - unitCost) / row.price
      : null;

  return (
    <tr className="border-t border-[var(--border)] align-middle">
      <td className="max-w-[22rem] px-3 py-1.5">
        <div className="flex items-center gap-2">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" loading="lazy" />
          ) : (
            <div className="h-8 w-8 shrink-0 rounded bg-[var(--muted)]" />
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium" title={row.name ?? undefined}>
              {row.name ?? "(unnamed listing)"}
            </p>
            <p className="truncate font-mono text-[10px] text-[var(--muted-foreground)]">
              {row.asin} · {row.sku}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-1.5 text-right tabular-nums text-xs">
        {row.price !== null ? row.price.toFixed(2) : "—"}
      </td>
      <td className="px-3 py-1.5 text-right tabular-nums text-xs">
        {row.quantity !== null ? row.quantity.toLocaleString() : "—"}
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={itemCost}
          onChange={(e) => setItemCost(e.target.value)}
          onBlur={() => void save()}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="h-7 w-20 rounded border border-[var(--border)] bg-white px-2 text-right text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </td>
      <td className="px-3 py-1.5 text-right">
        <input
          inputMode="decimal"
          placeholder="0.00"
          value={shipCost}
          onChange={(e) => setShipCost(e.target.value)}
          onBlur={() => void save()}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="h-7 w-20 rounded border border-[var(--border)] bg-white px-2 text-right text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </td>
      <td className="px-3 py-1.5 text-xs">
        {state === "saving" ? (
          <span className="text-[var(--muted-foreground)]">Saving…</span>
        ) : state === "saved" ? (
          <span className="text-[var(--success)]">Saved ✓</span>
        ) : state === "error" ? (
          <span className="text-[var(--danger)]" title={errMsg ?? undefined}>Failed</span>
        ) : margin !== null ? (
          <span className={margin < 0 ? "text-[var(--danger)]" : "text-[var(--muted-foreground)]"}>
            {(margin * 100).toFixed(0)}% <span className="text-[10px]">(before fees)</span>
          </span>
        ) : (
          <span className="text-[var(--muted-foreground)]">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── upload ───────────────────────────────────────────────────────────

function UploadForm({
  connectionId,
  onUploaded,
}: {
  connectionId: string;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<"native" | "sellerboard">("native");
  const [currency, setCurrency] = useState("USD");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CogsUploadResult | null>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }
    setPending(true);
    setError(null);
    setResult(null);
    const text = await file.text();
    const res = await uploadCogsCsv(connectionId, text, {
      format,
      currency: format === "sellerboard" ? currency : undefined,
    });
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setResult(res);
    if (fileRef.current) fileRef.current.value = "";
    onUploaded();
  }

  function downloadSample() {
    const blob = new Blob([COGS_SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cogs-sample.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-md bg-[var(--muted)] p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`cogs-file-${connectionId}`} className="text-xs">
            CSV file
          </Label>
          <input
            id={`cogs-file-${connectionId}`}
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="text-sm file:mr-2 file:rounded-md file:border file:border-[var(--border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-[var(--muted)]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`cogs-format-${connectionId}`} className="text-xs">
            Format
          </Label>
          <select
            id={`cogs-format-${connectionId}`}
            value={format}
            onChange={(e) => setFormat(e.target.value as "native" | "sellerboard")}
            className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-sm"
          >
            <option value="native">COGS CSV (standard)</option>
            <option value="sellerboard">SellerBoard export</option>
          </select>
        </div>
        {format === "sellerboard" && (
          <div className="flex flex-col gap-1">
            <Label htmlFor={`cogs-currency-${connectionId}`} className="text-xs">
              Currency
            </Label>
            <Input
              id={`cogs-currency-${connectionId}`}
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              className="h-8 w-20"
            />
          </div>
        )}
        <Button size="sm" onClick={() => void handleUpload()} disabled={pending}>
          {pending ? "Uploading…" : "Upload"}
        </Button>
        <button
          type="button"
          onClick={downloadSample}
          className="text-xs text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
        >
          Download sample CSV
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
      {result && (
        <div className="mt-2 text-xs">
          <p className={result.errors.length > 0 ? "text-[var(--danger)]" : "text-[var(--success)]"}>
            {result.inserted} added · {result.updated} updated · {result.unchanged} unchanged
            {result.errors.length > 0 && ` · ${result.errors.length} row(s) skipped`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-1 max-h-24 overflow-y-auto text-[var(--danger)]">
              {result.errors.slice(0, 20).map((e) => (
                <li key={`${e.line}-${e.message}`}>
                  Line {e.line}: {e.message}
                </li>
              ))}
              {result.errors.length > 20 && <li>…and {result.errors.length - 20} more</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── table ────────────────────────────────────────────────────────────

function CogsTable({
  rows,
  total,
  offset,
  onPage,
}: {
  rows: CogsRow[];
  total: number;
  offset: number;
  onPage: (offset: number) => void;
}) {
  return (
    <div className="mt-3">
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              <th className="px-3 py-2 font-medium">ASIN</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">From</th>
              <th className="px-3 py-2 font-medium text-right">Item cost</th>
              <th className="px-3 py-2 font-medium text-right">Shipping</th>
              <th className="px-3 py-2 font-medium">Currency</th>
              <th className="px-3 py-2 font-medium">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.childAsin}|${r.sku}|${r.currency}|${r.fromDate}`}
                className="border-t border-[var(--border)]"
              >
                <td className="px-3 py-1.5 font-mono text-xs">{r.childAsin}</td>
                <td className="px-3 py-1.5 font-mono text-xs">
                  {r.sku || <span className="text-[var(--muted-foreground)]">all SKUs</span>}
                </td>
                <td className="px-3 py-1.5 text-xs">
                  {r.fromDate === COGS_FROM_SENTINEL ? (
                    <span className="text-[var(--muted-foreground)]">beginning</span>
                  ) : (
                    r.fromDate
                  )}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.costItemValue.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.costShippingValue.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-xs">{r.currency}</td>
                <td className="px-3 py-1.5 text-xs">{r.supplierName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > PAGE_SIZE && (
        <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={offset === 0}
              onClick={() => onPage(Math.max(0, offset - PAGE_SIZE))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => onPage(offset + PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── single-row editor ────────────────────────────────────────────────

function EditorRow({
  connectionId,
  onSaved,
}: {
  connectionId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [asin, setAsin] = useState("");
  const [sku, setSku] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [shipCost, setShipCost] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [supplier, setSupplier] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    const res = await upsertCogsRow(connectionId, {
      childAsin: asin.trim().toUpperCase(),
      sku: sku.trim(),
      ...(fromDate ? { fromDate } : {}),
      costItemValue: Number(itemCost) || 0,
      costShippingValue: Number(shipCost) || 0,
      currency: currency.trim().toUpperCase(),
      // Empty supplier input = leave stored value alone; the CSV path
      // is the way to bulk-clear suppliers.
      ...(supplier.trim() ? { supplierName: supplier.trim() } : {}),
    });
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setAsin("");
    setSku("");
    setFromDate("");
    setItemCost("");
    setShipCost("");
    setSupplier("");
    setOpen(false);
    onSaved();
  }

  if (!open) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
        >
          Add or edit a single SKU cost
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-[var(--border)] p-3">
      <p className="mb-2 text-xs font-medium">
        Add / edit one cost row{" "}
        <span className="font-normal text-[var(--muted-foreground)]">
          (matching ASIN + SKU + currency + From date updates the existing row)
        </span>
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input placeholder="ASIN (required)" value={asin} onChange={(e) => setAsin(e.target.value)} className="h-8" />
        <Input placeholder="SKU (empty = all)" value={sku} onChange={(e) => setSku(e.target.value)} className="h-8" />
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8" />
        <Input placeholder="Currency" value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value)} className="h-8" />
        <Input placeholder="Item cost" inputMode="decimal" value={itemCost} onChange={(e) => setItemCost(e.target.value)} className="h-8" />
        <Input placeholder="Shipping cost" inputMode="decimal" value={shipCost} onChange={(e) => setShipCost(e.target.value)} className="h-8" />
        <Input placeholder="Supplier (optional)" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-8 col-span-2" />
      </div>
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => void save()} disabled={pending || !asin.trim() || !currency.trim()}>
          {pending ? "Saving…" : "Save row"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── footer: export + clear ───────────────────────────────────────────

function PanelFooter({
  connectionId,
  total,
  onCleared,
}: {
  connectionId: string;
  total: number;
  onCleared: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  async function handleExport() {
    setError(null);
    const res = await downloadCogsExport(connectionId);
    if (res.error) setError(res.error);
  }

  async function handleClear() {
    if (!window.confirm("Delete ALL uploaded COGS for this account? Profit metrics will lose cost data until you re-upload.")) {
      return;
    }
    setClearing(true);
    setError(null);
    const res = await clearCogs(connectionId);
    setClearing(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    onCleared();
  }

  if (total === 0) return null;

  return (
    <div className="mt-3 flex items-center gap-3 border-t border-[var(--border)] pt-3">
      <button
        type="button"
        onClick={() => void handleExport()}
        className="text-xs text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
      >
        Export current COGS (CSV)
      </button>
      <button
        type="button"
        onClick={() => void handleClear()}
        disabled={clearing}
        className="text-xs text-[var(--danger)] underline hover:opacity-80 disabled:opacity-50"
      >
        {clearing ? "Clearing…" : "Clear all COGS"}
      </button>
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
}
