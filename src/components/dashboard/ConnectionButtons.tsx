import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { config } from "@/lib/config";
import { useBrand } from "@ballisticbrands/frontend-shared";
import {
  disconnectConnection,
  reauthAmazonConnection,
  startAmazonAdsConnection,
  startAmazonConnection,
} from "@/lib/connections";

// Backend (where the OAuth popup loads) origin. Must match e.origin
// on incoming postMessage. Built from config.apiUrl.
const API_ORIGIN = new URL(config.apiUrl).origin;

type OAuthResultMessage = {
  type: string;
  provider: "amazon-selling-partner" | "amazon-ads";
  status: "connected" | "error";
  connection_id?: string;
  detail?: string;
};

type StartAction = () => Promise<{ authorization_url?: string; error?: string }>;

function ConnectButton({
  label,
  pendingLabel,
  variant,
  action,
  popupName,
  matchProvider,
  onConnected,
}: {
  label: string;
  pendingLabel: string;
  variant: "primary" | "secondary";
  action: StartAction;
  popupName: string;
  matchProvider: OAuthResultMessage["provider"];
  onConnected: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const brand = useBrand();
  const oauthType = brand.oauthMessageType;

  // Listen for the backend callback's postMessage. The callback HTML
  // lives at config.apiUrl's origin; anything else gets ignored.
  // The message type is brand-scoped (brand.oauthMessageType).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== API_ORIGIN) return;
      const data = e.data as OAuthResultMessage | undefined;
      if (!data || data.type !== oauthType) return;
      if (data.provider !== matchProvider) return;
      setPending(false);
      if (data.status === "connected") {
        setError(null);
        onConnected();
      } else {
        setError(data.detail || "Connection failed.");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [matchProvider, onConnected, oauthType]);

  async function onClick() {
    setPending(true);
    setError(null);
    const res = await action();
    if (res.error) {
      setError(res.error);
      setPending(false);
      return;
    }
    if (!res.authorization_url) {
      setError("We couldn't start the connection. Please try again.");
      setPending(false);
      return;
    }
    const popup = window.open(
      res.authorization_url,
      popupName,
      "popup=1,width=520,height=720,resizable=1,scrollbars=1",
    );
    if (!popup) {
      setError("Please allow popups for this site and try again.");
      setPending(false);
      return;
    }
    popupRef.current = popup;
    // If the user closes the popup without completing OAuth, no
    // postMessage will fire. Poll until close, then reset pending.
    const interval = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(interval);
        setPending(false);
      }
    }, 1000);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant={variant} disabled={pending} onClick={onClick}>
        {pending ? pendingLabel : label}
      </Button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

export function ConnectAmazonButton({
  label = "Connect Amazon Seller Central account",
  variant = "primary",
  onConnected,
}: {
  label?: string;
  variant?: "primary" | "secondary";
  onConnected: () => void;
}) {
  const brand = useBrand();
  return (
    <ConnectButton
      label={label}
      pendingLabel="Waiting for Amazon…"
      variant={variant}
      action={startAmazonConnection}
      popupName={`${brand.id}-spapi-oauth`}
      matchProvider="amazon-selling-partner"
      onConnected={onConnected}
    />
  );
}

export function ConnectAmazonAdsButton({
  label = "Connect Amazon Ads account",
  variant = "primary",
  onConnected,
}: {
  label?: string;
  variant?: "primary" | "secondary";
  onConnected: () => void;
}) {
  const brand = useBrand();
  return (
    <ConnectButton
      label={label}
      pendingLabel="Waiting for Amazon Ads…"
      variant={variant}
      action={startAmazonAdsConnection}
      popupName={`${brand.id}-ads-oauth`}
      matchProvider="amazon-ads"
      onConnected={onConnected}
    />
  );
}

/**
 * Re-authenticate an SP-API connection in place — same Amazon consent
 * flow as ConnectAmazonButton, but the backend updates the existing
 * Connection row's refresh token instead of creating a new one.
 * Preserves the connection's BQ dataset and 30+ days of synced
 * history. Use when the seller needs to expand SP-API scopes (Finance
 * role for settlements, marketplace expansion, etc.) without losing
 * everything.
 */
export function ReauthenticateAmazonButton({
  id,
  label = "Re-authenticate",
  variant = "secondary",
  onReauthenticated,
}: {
  id: string;
  label?: string;
  variant?: "primary" | "secondary";
  onReauthenticated: () => void;
}) {
  const brand = useBrand();
  return (
    <ConnectButton
      label={label}
      pendingLabel="Waiting for Amazon…"
      variant={variant}
      action={() => reauthAmazonConnection(id)}
      popupName={`${brand.id}-spapi-reauth`}
      matchProvider="amazon-selling-partner"
      onConnected={onReauthenticated}
    />
  );
}

export function DisconnectButton({ id, onDisconnected }: { id: string; onDisconnected: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="ghost"
        disabled={pending}
        onClick={async () => {
          if (!confirm("Disconnect this account? Your existing API keys will start failing.")) return;
          setPending(true);
          const res = await disconnectConnection(id);
          setPending(false);
          if (res.error) setError(res.error);
          else onDisconnected();
        }}
      >
        {pending ? "Disconnecting…" : "Disconnect"}
      </Button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
