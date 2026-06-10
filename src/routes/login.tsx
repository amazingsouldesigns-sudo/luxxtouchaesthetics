import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session && isAdmin) {
      navigate({ to: "/dashboard" });
    }
  }, [loading, session, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMsg("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg("If an account exists for that email, a reset link is on its way.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const signInGoogle = async () => {
    setErr(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setErr(error.message);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="glass ring-luxe rounded-3xl p-8">
        <h1 className="font-display text-3xl text-luxe">
          {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Welcome back to Luxx Touch."
            : mode === "signup"
              ? "Create your account to book and manage appointments."
              : "Enter your email and we'll send you a reset link."}
        </p>

        {session && !isAdmin && (
          <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Signed in as {session.user.email}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs tracking-luxe text-muted-foreground">FULL NAME</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="text-xs tracking-luxe text-muted-foreground">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="text-xs tracking-luxe text-muted-foreground">PASSWORD</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              />
            </div>
          )}

          {mode === "signin" && (
            <button
              type="button"
              onClick={() => { setMode("forgot"); setErr(null); setMsg(null); }}
              className="text-xs text-muted-foreground hover:text-[color:var(--ruby)]"
            >
              Forgot password?
            </button>
          )}

          {err && <div className="text-xs text-[color:var(--ruby)]">{err}</div>}
          {msg && <div className="text-xs text-emerald-700">{msg}</div>}

          <button
            type="submit"
            disabled={busy}
            className="btn-luxe h-11 w-full text-[10px] disabled:opacity-50"
          >
            {busy
              ? "PLEASE WAIT…"
              : mode === "signin"
                ? "SIGN IN"
                : mode === "signup"
                  ? "CREATE ACCOUNT"
                  : "SEND RESET LINK"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] tracking-luxe text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={signInGoogle}
          className="h-11 w-full rounded-md border border-input bg-background text-xs tracking-wide hover:bg-accent"
        >
          Continue with Google
        </button>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErr(null);
            setMsg(null);
          }}
          className="mt-5 w-full text-xs text-muted-foreground hover:text-[color:var(--ruby)]"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>

        <Link to="/" className="mt-4 block text-center text-[10px] tracking-luxe text-muted-foreground">
          ← BACK TO HOME
        </Link>
      </div>
    </div>
  );
}
