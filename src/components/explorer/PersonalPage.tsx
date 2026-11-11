import { Suspense, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "./AppHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function PersonalPage({ children }: { children: (userId: string) => ReactNode }) {
  const { session } = useAuth();
  return <><AppHeader /><main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
    <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
      {session ? children(session.user.id) : <Skeleton className="h-64 rounded-2xl" />}
    </Suspense>
  </main></>;
}

export function PersonalPageError() {
  const router = useRouter();
  const qc = useQueryClient();
  return <><AppHeader /><main className="mx-auto max-w-5xl px-4 py-10 text-center">
    <p role="alert" className="text-destructive">Impossibile caricare i dati.</p>
    <Button variant="outline" className="mt-4" onClick={async () => { await qc.resetQueries(); await router.invalidate(); }}>Riprova</Button>
  </main></>;
}