import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthDivider,
  Button,
  GoogleSignInButton,
  Input,
  Label,
  Turnstile,
  useBrand,
  useMagicLinkForm,
  useSignInForm,
} from "@ballisticbrands/frontend-shared";
import { config } from "@/lib/config";

export function SignIn() {
  const navigate = useNavigate();
  const brand = useBrand();
  const [googleError, setGoogleError] = useState<string | null>(null);
  // Magic-link mode: most DragonBot signups are email-only (the signup
  // form generated a password they never saw), so an emailed one-time
  // link — not a password — is how they get into a second device.
  const [magicMode, setMagicMode] = useState(false);
  const magic = useMagicLinkForm();
  const form = useSignInForm({
    onSuccess: () => navigate("/dashboard", { replace: true }),
  });

  useEffect(() => {
    document.title = `Sign in — ${brand.displayName}`;
  }, [brand.displayName]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        {magicMode
          ? "We'll email you a one-time link that signs you in — no password needed."
          : "Welcome back. Sign in to manage your keys and connections."}
      </p>
      {config.googleClientId && (
        <div className="mt-6">
          <GoogleSignInButton
            onSuccess={() => navigate("/dashboard", { replace: true })}
            onError={setGoogleError}
          />
          {googleError && <p className="mt-2 text-sm text-[var(--danger)]">{googleError}</p>}
          <AuthDivider label={magicMode ? "or use an email link" : "or sign in with email"} />
        </div>
      )}
      {magicMode ? (
        <form
          className={`${config.googleClientId ? "" : "mt-6 "}space-y-4`}
          onSubmit={magic.onSubmit}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={magic.email}
              onChange={(e) => magic.setEmail(e.target.value)}
            />
          </div>
          <Turnstile onToken={magic.onTurnstileToken} onExpired={magic.onTurnstileExpired} />
          {magic.error && <p className="text-sm text-[var(--danger)]">{magic.error}</p>}
          {magic.sent && (
            <p className="text-sm text-[var(--success)]">
              If an account exists for that email, your sign-in link is on
              its way. It expires in 15 minutes — check your inbox.
            </p>
          )}
          <Button
            type="submit"
            disabled={magic.pending || magic.cooldownSeconds > 0}
            className="w-full"
          >
            {magic.cooldownSeconds > 0
              ? `Try again in ${magic.cooldownSeconds}s`
              : magic.pending
                ? "Sending…"
                : "Email me a sign-in link"}
          </Button>
          <p className="text-sm text-[var(--muted-foreground)]">
            <button
              type="button"
              onClick={() => setMagicMode(false)}
              className="font-medium text-[var(--foreground)] hover:underline"
            >
              Use your password instead
            </button>
          </p>
        </form>
      ) : (
        <form
          className={`${config.googleClientId ? "" : "mt-6 "}space-y-4`}
          onSubmit={form.onSubmit}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => form.setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-[var(--muted-foreground)] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => form.setPassword(e.target.value)}
            />
          </div>
          {form.error && <p className="text-sm text-[var(--danger)]">{form.error}</p>}
          <Button type="submit" disabled={form.pending} className="w-full">
            {form.pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-[var(--muted-foreground)]">
            Signed up without a password?{" "}
            <button
              type="button"
              onClick={() => setMagicMode(true)}
              className="font-medium text-[var(--foreground)] hover:underline"
            >
              Email me a sign-in link
            </button>
          </p>
        </form>
      )}
      <p className="mt-6 text-sm text-[var(--muted-foreground)]">
        New here?{" "}
        <Link to="/sign-up" className="font-medium text-[var(--foreground)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
