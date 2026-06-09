import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { config } from "@/lib/config";

const FAQ = [
  {
    q: "How do I connect my Amazon account?",
    a: `Open the Data tab and click Connect Amazon account. You'll be redirected to Amazon to authorize ${"DragonBot"}, then bounced back here once it's done.`,
  },
  {
    q: "What happens when my trial ends?",
    a: "Your API keys keep working until the end of the trial period. After that, agents on a revoked key will get a 402 response — pick a plan in Settings to continue.",
  },
  {
    q: "Why can't I see my key after creating it?",
    a: "For security we only show the full key once at creation time. If you've lost it, revoke the old key and mint a new one.",
  },
  {
    q: "Can I scope a key to a single tool, not just a domain?",
    a: "Per-domain scoping is what's available in the UI today. Per-tool scoping is on the roadmap — contact support if you need it now.",
  },
  {
    q: "What's the rate limit?",
    a: "120 requests per minute per API key. Hit it and you'll get a 429 with a retry-after.",
  },
];

export function SupportTab() {
  return (
    <div
      id="dashboard-support-panel"
      role="tabpanel"
      aria-labelledby="dashboard-support-tab"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Common questions</CardTitle>
          <CardDescription className="mt-1">
            Most setup issues are covered here. The full reference is in{" "}
            <a href={config.docsUrl} target="_blank" rel="noreferrer" className="underline">
              the docs
            </a>
            .
          </CardDescription>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-[var(--border)]">
            {FAQ.map((item) => (
              <li key={item.q} className="py-3">
                <p className="font-medium">{item.q}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.a}</p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription className="mt-1">
            Anything not covered above? Email us — we read every message.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <a
            href={`mailto:${config.brand.supportEmail}`}
            className="inline-flex h-10 items-center rounded-md bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] hover:opacity-90"
          >
            {config.brand.supportEmail}
          </a>
        </CardBody>
      </Card>
    </div>
  );
}
