import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppNavigation } from "./AppNavigation";

export function AppHeader() {
  const { session } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="font-display text-xl font-semibold">Italia Explorer</span>
        </Link>
        {session && (
          <AppNavigation desktop />
        )}
      </div>
    </header>
  );
}
