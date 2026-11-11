import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/explorer/AppHeader";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Accedi — Italia Explorer" },
      { name: "description", content: "Accedi o registrati per salvare i comuni italiani che hai visitato." },
      { property: "og:title", content: "Accedi — Italia Explorer" },
      { property: "og:description", content: "Il tuo passaporto digitale dei comuni italiani." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: safePath(redirect) });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/" });
        else setSent(true);
      }
    } catch (err) {
      const msg = (err as Error).message;
      toast.error(
        msg.includes("Invalid login") ? "Email o password non corretti." :
        msg.includes("already registered") ? "Questa email è già registrata. Accedi." :
        msg.includes("Email not confirmed") ? "Conferma prima la tua email tramite il link ricevuto." : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="paper rounded-3xl border p-7 shadow-lift">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-foreground">Passaporto di viaggio</p>
          <h1 className="mt-1 text-4xl font-semibold">{mode === "in" ? "Bentornato" : "Crea il tuo passaporto"}</h1>
          {sent ? (
            <p className="mt-6 rounded-xl bg-accent p-4 text-sm text-accent-foreground">
              Ti abbiamo inviato un'email a <strong>{email}</strong>. Apri il link per confermare l'account, poi accedi.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" minLength={6} required autoComplete={mode === "in" ? "current-password" : "new-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "in" ? "Accedi" : "Registrati"}
              </Button>
            </form>
          )}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "in" ? "Non hai un account?" : "Hai già un account?"}{" "}
            <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline"
              onClick={() => { setMode(mode === "in" ? "up" : "in"); setSent(false); }}>
              {mode === "in" ? "Registrati" : "Accedi"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
