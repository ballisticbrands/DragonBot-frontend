import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Input, Label } from "@/components/ui/Input";
import { createApiKey, revokeApiKey, type ApiKey, type MintedKey } from "@/lib/keys";
import type { ToolDomain } from "@/lib/tools";

export function KeysManager({
  initialKeys,
  domains,
}: {
  initialKeys: ApiKey[];
  domains: ToolDomain[];
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [creating, setCreating] = useState(false);
  const [justMinted, setJustMinted] = useState<MintedKey | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>Create key</Button>
      </div>

      {justMinted && (
        <MintedKeyBanner mintedKey={justMinted} onDismiss={() => setJustMinted(null)} />
      )}

      {creating && (
        <CreateKeyForm
          domains={domains}
          onCancel={() => setCreating(false)}
          onCreated={(key) => {
            setJustMinted(key);
            setKeys((prev) => [key, ...prev]);
            setCreating(false);
          }}
        />
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          You don&apos;t have any keys yet. Create one to start connecting agents.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Scope</th>
                <th className="px-3 py-2 font-medium">Last used</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <KeyRow
                  key={k.id}
                  apiKey={k}
                  domains={domains}
                  onRevoked={() =>
                    setKeys((prev) => prev.filter((p) => p.id !== k.id))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CreateKeyForm({
  domains,
  onCancel,
  onCreated,
}: {
  domains: ToolDomain[];
  onCancel: () => void;
  onCreated: (key: MintedKey) => void;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ToolDomain["id"][]>(domains.map((d) => d.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggle(id: ToolDomain["id"]) {
    setScopes((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="key-name">Name</Label>
          <Input
            id="key-name"
            placeholder="e.g. claude-desktop, ads-writer, ops-readonly"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            Pick a name that describes the agent or workflow.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Tool scope</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {domains.map((d) => (
              <label
                key={d.id}
                className="flex items-start gap-2 rounded-md border border-[var(--border)] bg-white p-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={scopes.includes(d.id)}
                  onChange={() => toggle(d.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {d.toolCount} tools
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{d.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            disabled={pending || scopes.length === 0}
            onClick={async () => {
              setError(null);
              setPending(true);
              const res = await createApiKey({ name, scopes });
              setPending(false);
              if ("error" in res) setError(res.error);
              else onCreated(res.key);
            }}
          >
            {pending ? "Creating…" : "Create key"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MintedKeyBanner({ mintedKey, onDismiss }: { mintedKey: MintedKey; onDismiss: () => void }) {
  // Use the JWT-signed URL the backend mints — NOT a URL constructed
  // from the bare ApiToken.id (the backend's /mcp/connect/:token route
  // verifies a JWT, not a raw row id, so the id form would 401).
  const connectorUrl = mintedKey.mcp.signed_url;
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-amber-900">Copy your key now</h4>
          <p className="mt-1 text-sm text-amber-800">
            This is the only time the full key will be shown. Store it somewhere safe.
          </p>
          <div className="mt-3 space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-amber-900">API key</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-white px-3 py-2 font-mono text-sm">
                  {mintedKey.secret}
                </code>
                <CopyButton value={mintedKey.secret} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-amber-900">MCP connector URL</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-white px-3 py-2 font-mono text-sm">
                  {connectorUrl}
                </code>
                <CopyButton value={connectorUrl} label="Copy URL" />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-900 hover:text-amber-950 text-sm font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function KeyRow({
  apiKey,
  domains,
  onRevoked,
}: {
  apiKey: ApiKey;
  domains: ToolDomain[];
  onRevoked: () => void;
}) {
  const [pending, setPending] = useState(false);
  const scopeLabel =
    apiKey.scopes.length === domains.length
      ? "All domains"
      : apiKey.scopes
          .map((s) => domains.find((d) => d.id === s)?.name ?? s)
          .join(", ");
  const revoked = !!apiKey.revoked_at;
  return (
    <tr className="border-t border-[var(--border)]">
      <td className="px-3 py-2 font-medium">{apiKey.name}</td>
      <td className="px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
        {apiKey.prefix}…
      </td>
      <td className="px-3 py-2 text-xs text-[var(--muted-foreground)]">{scopeLabel}</td>
      <td className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
        {apiKey.last_used_at ? new Date(apiKey.last_used_at).toLocaleString() : "—"}
      </td>
      <td className="px-3 py-2 text-right">
        {revoked ? (
          <Badge tone="danger">Revoked</Badge>
        ) : (
          <button
            type="button"
            disabled={pending}
            className="text-xs font-medium text-[var(--danger)] hover:underline disabled:opacity-50"
            onClick={async () => {
              if (!confirm(`Revoke "${apiKey.name}"? Agents using this key will stop working.`)) {
                return;
              }
              setPending(true);
              const res = await revokeApiKey(apiKey.id);
              setPending(false);
              if (!res.error) onRevoked();
            }}
          >
            {pending ? "Revoking…" : "Revoke"}
          </button>
        )}
      </td>
    </tr>
  );
}
