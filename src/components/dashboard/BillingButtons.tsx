import { useState } from "react";
import { Button } from "@ballisticbrands/frontend-shared";
import { openBillingPortal, startCheckout } from "@/lib/billing";
import { PLANS, type PlanId } from "@/lib/tools";

export function PlanCard({
  plan,
  current,
}: {
  plan: (typeof PLANS)[number];
  current: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div
      className={`rounded-md border p-4 ${
        current ? "border-[var(--foreground)]" : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h4 className="font-semibold">{plan.name}</h4>
        <div className="text-sm">
          <span className="text-lg font-semibold">${plan.price}</span>
          <span className="text-[var(--muted-foreground)]">/mo</span>
        </div>
      </div>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{plan.description}</p>
      <ul className="mt-3 space-y-1 text-sm text-[var(--muted-foreground)]">
        {plan.domains.map((d) => (
          <li key={d}>• {d.replace("_", " ")}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col items-stretch gap-1">
        <Button
          variant={current ? "secondary" : "primary"}
          disabled={pending || current}
          onClick={async () => {
            setError(null);
            setPending(true);
            const res = await startCheckout(plan.id as PlanId);
            setPending(false);
            if (res?.error) setError(res.error);
          }}
        >
          {current ? "Current plan" : pending ? "Redirecting…" : "Choose plan"}
        </Button>
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      </div>
    </div>
  );
}

export function BillingActions() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          setError(null);
          setPending(true);
          const res = await openBillingPortal();
          setPending(false);
          if (res?.error) setError(res.error);
        }}
      >
        {pending ? "Opening…" : "Manage billing"}
      </Button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
