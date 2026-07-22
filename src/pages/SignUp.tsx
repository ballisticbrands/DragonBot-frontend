import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Label,
  Turnstile,
  useBrand,
  useSignUpForm,
} from "@ballisticbrands/frontend-shared";

export function SignUp() {
  const navigate = useNavigate();
  const brand = useBrand();
  const form = useSignUpForm({
    onSuccess: () => navigate("/dashboard", { replace: true }),
  });

  useEffect(() => {
    document.title = `Sign up — ${brand.displayName}`;
  }, [brand.displayName]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Start your trial</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Seven days free. No credit card required.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
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
            value={form.email}
            onChange={(e) => form.setEmail(e.target.value)}
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
            value={form.password}
            onChange={(e) => form.setPassword(e.target.value)}
          />
          <p className="text-xs text-[var(--muted-foreground)]">At least 8 characters.</p>
        </div>
        <Turnstile onToken={form.onTurnstileToken} onExpired={form.onTurnstileExpired} />
        {form.error && <p className="text-sm text-[var(--danger)]">{form.error}</p>}
        <Button
          type="submit"
          disabled={form.pending || !form.turnstileToken}
          className="w-full"
        >
          {form.pending ? "Creating account…" : "Create account"}
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
