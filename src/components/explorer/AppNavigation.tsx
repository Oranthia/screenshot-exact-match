import { Link } from "@tanstack/react-router";
import { House, BookOpen, Award, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const destinations = [
  { to: "/", label: "Home", icon: House },
  { to: "/diario", label: "Diario", icon: BookOpen },
  { to: "/badge", label: "Badge", icon: Award },
  { to: "/profilo", label: "Profilo", icon: UserRound },
] as const;

export function AppNavigation({ desktop = false }: { desktop?: boolean }) {
  return (
    <nav aria-label="Navigazione principale" className={cn(desktop ? "hidden items-center gap-1 md:flex" : "bottom-navigation fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden")}>
      <div className={cn(desktop ? "flex gap-1" : "mx-auto grid max-w-lg grid-cols-4 px-2")}>
        {destinations.map(({ to, label, icon: Icon }) => (
          <Button key={to} asChild variant="ghost" className={cn("rounded-lg", desktop ? "h-10 px-3" : "h-16 flex-col gap-1 px-1 text-xs [&_svg]:size-5")}>
            <Link to={to} activeOptions={{ exact: true }} activeProps={{ className: "text-primary bg-accent font-semibold", "aria-current": "page" }} inactiveProps={{ className: "text-muted-foreground" }}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}