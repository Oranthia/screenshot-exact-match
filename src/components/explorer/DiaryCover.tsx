import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Crest } from "./Crest";
import { cn } from "@/lib/utils";

export function DiaryCover({ name, coatUrl, photo, pending = false, compact = false, onRetry }: {
  name: string; coatUrl?: string | null | undefined; photo?: { id: string; url: string; caption: string | null } | undefined; pending?: boolean; compact?: boolean; onRetry?: () => void;
}) {
  const [loaded, setLoaded] = useState("");
  const [failed, setFailed] = useState("");
  const retried = useRef(new Set<string>());
  const key = photo ? `${photo.id}:${photo.url}` : "";
  const show = !!photo?.url && failed !== key;
  return <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden bg-parchment", compact ? "h-16 w-20 rounded-md" : "aspect-[16/9] w-full border-b")}>
    {(!show || loaded !== key) && <Crest name={name} url={coatUrl} visited size={compact ? "sm" : "lg"} />}
    {show && <img src={photo.url} alt={photo.caption ?? `Ricordo di ${name}`} loading="lazy" className={cn("absolute inset-0 h-full w-full object-cover transition-opacity motion-reduce:transition-none", loaded === key ? "opacity-100" : "opacity-0")} onLoad={() => setLoaded(key)} onError={() => { setFailed(key); if (!retried.current.has(photo.id)) { retried.current.add(photo.id); onRetry?.(); } }} />}
    {(pending || (show && loaded !== key)) && <span role="status" aria-label="Caricamento copertina" className="absolute bottom-2 right-2 rounded-full bg-card/90 p-1.5 text-primary"><Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" /></span>}
  </div>;
}