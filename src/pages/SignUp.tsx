import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { signUp } from "@/lib/auth";
import { config } from "@/lib/config";

export function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = `Sign up — ${config.brand.name}`;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signUp(email, password, name);
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
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
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
