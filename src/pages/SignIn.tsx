import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Label,
  useBrand,
  useSignInForm,
} from "@ballisticbrands/frontend-shared";

export function SignIn() {
  const navigate = useNavigate();
  const brand = useBrand();
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
        Welcome back. Sign in to manage your keys and connections.
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.onSubmit}>
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
      </form>
      <p className="mt-6 text-sm text-[var(--muted-foreground)]">
        New here?{" "}
        <Link to="/sign-up" className="font-medium text-[var(--foreground)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
