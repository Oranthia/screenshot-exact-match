import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = { name: string; url?: string | null | undefined; visited: boolean; size?: "sm" | "lg" };

/** Stemma comunale: scala di grigi se non visitato, a colori (con sblocco) se visitato. */
export function Crest({ name, url, visited, size = "sm" }: Props) {
  const previous = useRef(visited);
  const [unlocking, setUnlocking] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!previous.current && visited) setUnlocking(true);
    if (!visited) setUnlocking(false);
    previous.current = visited;
  }, [visited]);
  const dim = size === "lg" ? "h-40 w-32" : "h-14 w-11";
  return (
    <div className={cn("relative shrink-0", dim)}>
      <div
        onAnimationEnd={() => setUnlocking(false)}
        className={cn("relative h-full w-full transition-[filter,opacity] duration-300 motion-reduce:transition-none", visited ? (unlocking ? "animate-unlock" : "") : "crest-locked")}
      >
        {url?.trim() && failedUrl !== url ? (
          <img src={url} alt={`Stemma di ${name}`} className="h-full w-full object-contain" loading={size === "lg" ? "eager" : "lazy"} decoding="async" onError={() => setFailedUrl(url)} />
        ) : (
          <ShieldPlaceholder name={name} />
        )}
      </div>
    </div>
  );
}

function ShieldPlaceholder({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <svg viewBox="0 0 80 100" role="img" aria-label={`Stemma di ${name} (segnaposto)`} className="h-full w-full drop-shadow-sm">
      <path d="M40 3 L75 13 V48 C75 72 58 88 40 97 C22 88 5 72 5 48 V13 Z" className="fill-forest" />
      <path d="M40 9 L69 17.5 V48 C69 68 55 82 40 90 C25 82 11 68 11 48 V17.5 Z" fill="none" className="stroke-gold" strokeWidth="2" />
      <text x="40" y="60" textAnchor="middle" className="crest-initial fill-gold">
        {initial}
      </text>
    </svg>
  );
}
