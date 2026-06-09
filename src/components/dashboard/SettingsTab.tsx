import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PLANS } from "@/lib/tools";
import type { SessionUser } from "@/lib/session";
import { BillingActions, PlanCard } from "./BillingButtons";

export function SettingsTab({ user }: { user: SessionUser }) {
  const currentPlan = user.plan ?? "trial";
  const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  return (
    <div
      id="dashboard-settings-panel"
      role="tabpanel"
      aria-labelledby="dashboard-settings-tab"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription className="mt-1">Your sign-in details.</CardDescription>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-3">
            <dt className="text-[var(--muted-foreground)]">Name</dt>
            <dd className="sm:col-span-2">{user.name || "—"}</dd>
            <dt className="text-[var(--muted-foreground)]">Email</dt>
            <dd className="sm:col-span-2">{user.email}</dd>
            <dt className="text-[var(--muted-foreground)]">User ID</dt>
            <dd className="sm:col-span-2 font-mono text-xs">{user.id}</dd>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Plan & billing</CardTitle>
            <CardDescription className="mt-1">
              {currentPlan === "trial"
                ? trialEnds
                  ? `Trial ends ${trialEnds.toLocaleDateString()}.`
                  : "You're on a free trial."
                : "Manage your subscription."}
            </CardDescription>
          </div>
          <Badge tone={currentPlan === "trial" ? "warn" : "success"}>
            {currentPlan === "trial" ? "Trial" : "Full Suite"}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PLANS.map((p) => (
              <PlanCard key={p.id} plan={p} current={currentPlan === p.id} />
            ))}
          </div>
          {currentPlan !== "trial" && <BillingActions />}
        </CardBody>
      </Card>
    </div>
  );
}
