import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Confirming account — Luxx Touch Aesthetics" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const go = (to: "/" | "/reset-password" | "/login") => {
      if (active) navigate({ to });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session) return;
      if (event === "PASSWORD_RECOVERY") go("/reset-password");
      else if (event === "SIGNED_IN") go("/");
    });

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active) return;
      if (error) {
        setErr(error.message);
        return;
      }
      if (session) go("/");
      else {
        timer = setTimeout(() => {
          setErr("Could not confirm your account. Try signing in, or request a new confirmation email.");
        }, 8000);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl text-luxe">
        {err ? "Something went wrong" : "Confirming your account…"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {err ?? "Just a moment — you'll be redirected to your profile."}
      </p>
      {err && (
        <a href="/login" className="btn-luxe mt-6 inline-flex">
          GO TO SIGN IN
        </a>
      )}
    </div>
  );
}
