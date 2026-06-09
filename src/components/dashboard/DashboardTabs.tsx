import { Link } from "react-router-dom";

export type TabId = "data" | "keys" | "settings" | "support";

const TABS: { id: TabId; label: string }[] = [
  { id: "data", label: "Data" },
  { id: "keys", label: "Keys" },
  { id: "settings", label: "Settings" },
  { id: "support", label: "Support" },
];

export function DashboardTabs({ active }: { active: TabId }) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard sections"
      className="border-b border-[var(--border)] flex gap-6"
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <Link
            key={t.id}
            id={`dashboard-${t.id}-tab`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`dashboard-${t.id}-panel`}
            to={`/dashboard?tab=${t.id}`}
            className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium ${
              isActive
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
