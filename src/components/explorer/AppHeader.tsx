import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { session } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-display text-xl font-semibold tracking-tight">Italia Explorer</span>
        </Link>
        {session && (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", search: { redirect: undefined } });
            }}
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Esci</span>
          </Button>
        )}
      </div>
    </header>
  );
}
