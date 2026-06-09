import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { TOOL_DOMAINS } from "@/lib/tools";
import { listApiKeys, type ApiKey } from "@/lib/keys";
import { config } from "@/lib/config";
import { KeysManager } from "./KeysManager";

export function KeysTab() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);

  useEffect(() => {
    void (async () => {
      const list = await listApiKeys();
      setKeys(list);
    })();
  }, []);

  return (
    <div
      id="dashboard-keys-panel"
      role="tabpanel"
      aria-labelledby="dashboard-keys-tab"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>API keys</CardTitle>
          <CardDescription className="mt-1">
            Create one key per agent or workflow. Scope each key to only the tool domains it needs —
            your reviewer agent doesn&apos;t need write access to ads.
          </CardDescription>
        </CardHeader>
        <CardBody>
          {keys === null ? (
            <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
          ) : (
            <KeysManager initialKeys={keys} domains={TOOL_DOMAINS} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
          <CardDescription className="mt-1">
            Each key&apos;s scope is the union of domains you check.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <ul className="space-y-3 text-sm">
            {TOOL_DOMAINS.map((d) => (
              <li key={d.id} className="flex items-start gap-3">
                <Badge tone="accent" className="mt-0.5">
                  {d.toolCount}
                </Badge>
                <div>
                  <span className="font-medium">{d.name}</span>{" "}
                  <span className="text-[var(--muted-foreground)]">— {d.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wire your agent</CardTitle>
          <CardDescription className="mt-1">
            After creating a key, paste the connector URL into your MCP client and restart it.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <div className="space-y-2 text-sm">
            <p>
              MCP endpoint: <code className="font-mono">{config.mcpUrl}</code>
            </p>
            <p className="text-[var(--muted-foreground)]">
              Works with Claude Desktop, Cursor, Claude Code, ChatGPT, and any HTTP-MCP-compatible
              client. The signed connector URL we hand back at key-mint time is the easiest way to
              configure most clients.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
