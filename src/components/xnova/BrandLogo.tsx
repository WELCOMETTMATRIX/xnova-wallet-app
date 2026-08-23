import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Trusted brand logo for a dApp / venue.
 * Tries multiple public logo services in order and falls back to a monogram tile,
 * so a broken CDN never leaves an empty square in the grid.
 */
export function BrandLogo({
  name,
  url,
  icon,
  className,
}: {
  name: string;
  url?: string;
  icon?: string | null;
  className?: string;
}) {
  const sources = useMemo(() => {
    const list: string[] = [];
    if (icon) list.push(icon);
    let host = "";
    try {
      host = url ? new URL(url).hostname.replace(/^www\./, "") : "";
    } catch {
      host = "";
    }
    if (host) {
      list.push(`https://icons.duckduckgo.com/ip3/${host}.ico`);
      list.push(`https://www.google.com/s2/favicons?sz=128&domain=${host}`);
    }
    return list;
  }, [icon, url]);

  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) {
    return (
      <span
        aria-hidden
        className={cn(
          "num flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-2 text-[11px] font-bold text-primary",
          className,
        )}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} logo`}
      loading="lazy"
      decoding="async"
      onError={() => setIndex((i) => i + 1)}
      className={cn(
        "size-7 shrink-0 rounded-sm border border-border bg-background object-contain p-0.5",
        className,
      )}
    />
  );
}
