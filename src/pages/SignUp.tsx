import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Turnstile } from "@/components/Turnstile";
import { signUp } from "@ballisticbrands/frontend-shared";
import { useBrand } from "@ballisticbrands/frontend-shared";

export function SignUp() {
  const navigate = useNavigate();
  const brand = useBrand();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Turnstile token from the Cloudflare widget. Cleared when the
  // token expires so the user can't submit a stale one. When the
  // widget is disabled (VITE_TURNSTILE_SITE_KEY unset), <Turnstile>
  // synthesizes "skipped" here — the backend recognizes the sentinel.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onTurnstileToken = useCallback((tok: string) => setTurnstileToken(tok), []);
  const onTurnstileExpired = useCallback(() => setTurnstileToken(null), []);

  useEffect(() => {
    document.title = `Sign up — ${brand.displayName}`;
  }, [brand.displayName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the challenge above before continuing.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await signUp(email, password, name, turnstileToken);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    navigate("/dashboard", { replace: true });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Start your trial</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Seven days free. No credit card required.
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-[var(--muted-foreground)]">At least 8 characters.</p>
        </div>
        <Turnstile onToken={onTurnstileToken} onExpired={onTurnstileExpired} />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <Button
          type="submit"
          disabled={pending || !turnstileToken}
          className="w-full"
        >
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link to="/sign-in" className="font-medium text-[var(--foreground)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
