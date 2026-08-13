// The routes that used to be tabs inside Dashboard.tsx.
//
// Each is a thin wrapper: the shared PageContainer/PageHeader give every
// page the same heading rhythm, and the existing tab components supply
// the body unchanged. Keeping them as separate exports in one file
// (rather than four near-empty files) makes the tab→route mapping easy
// to read.

import { useEffect } from "react";
import {
  ConnectAiPage,
  PageContainer,
  PageHeader,
  useBrand,
} from "@ballisticbrands/frontend-shared";
import { RequireConnection } from "@/components/RequireConnection";
import { DataTab } from "@/components/dashboard/DataTab";
import { KeysTab } from "@/components/dashboard/KeysTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { SupportTab } from "@/components/dashboard/SupportTab";
import { readAiChoice } from "@/lib/aiClients";
import { useSession } from "@ballisticbrands/frontend-shared";

function useTitle(title: string) {
  const brand = useBrand();
  useEffect(() => {
    document.title = `${title} — ${brand.displayName}`;
  }, [title, brand.displayName]);
}

/** Step 3 of the sign-up promise, finally given a home. `readAiChoice()`
 *  is the client the visitor picked on the landing page, so most people
 *  land with the right instructions already selected. */
export function ConnectAi() {
  useTitle("Connect your AI");
  return (
    <RequireConnection>
      <ConnectAiPage
        aiChoice={readAiChoice()}
        keysHref="/keys"
        docsHref="/docs/getting-started"
      />
    </RequireConnection>
  );
}

export function DataSources() {
  useTitle("Data sources");
  return (
    <PageContainer>
      <PageHeader
        title="Data sources"
        description="The Amazon accounts DragonBot reads from, and the product costs that turn sales into profit."
      />
      <DataTab />
    </PageContainer>
  );
}

export function Keys() {
  useTitle("API keys");
  return (
    <PageContainer>
      <PageHeader
        title="API keys"
        description="One key per agent or workflow. Scope each to only the tools it needs."
      />
      <KeysTab />
    </PageContainer>
  );
}

export function Settings() {
  useTitle("Settings");
  const session = useSession();
  if (session.status !== "authenticated") return null;
  return (
    <PageContainer>
      <PageHeader title="Settings" />
      <SettingsTab user={session.user} />
    </PageContainer>
  );
}

export function Support() {
  useTitle("Support");
  return (
    <PageContainer>
      <PageHeader title="Support" />
      <SupportTab />
    </PageContainer>
  );
}
