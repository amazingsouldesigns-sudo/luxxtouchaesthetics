import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when user lands from a reset link.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    setMsg("Password updated. Redirecting…");
    setTimeout(() => navigate({ to: "/login" }), 1500);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="glass ring-luxe rounded-3xl p-8">
        <h1 className="font-display text-3xl text-luxe">Set New Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready
            ? "Choose a new password for your account."
            : "Open this page from the reset link in your email."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs tracking-luxe text-muted-foreground">NEW PASSWORD</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!ready}
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs tracking-luxe text-muted-foreground">CONFIRM PASSWORD</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={!ready}
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>

          {err && <div className="text-xs text-[color:var(--ruby)]">{err}</div>}
          {msg && <div className="text-xs text-emerald-700">{msg}</div>}

          <button
            type="submit"
            disabled={busy || !ready}
            className="btn-luxe h-11 w-full text-[10px] disabled:opacity-50"
          >
            {busy ? "PLEASE WAIT…" : "UPDATE PASSWORD"}
          </button>
        </form>

        <Link to="/login" className="mt-4 block text-center text-[10px] tracking-luxe text-muted-foreground">
          ← BACK TO SIGN IN
        </Link>
      </div>
    </div>
  );
}
