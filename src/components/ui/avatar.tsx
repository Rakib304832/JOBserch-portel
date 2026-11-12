/* eslint-disable @next/next/no-img-element */
// ↑ avatars can be arbitrary external URLs; see explanation below.
/**
 * avatar.tsx — the round profile picture.
 *
 * If the user has an avatarUrl we show that image; otherwise we show the
 * first letters of their name on a colored circle (an "initials avatar").
 * That way the UI never shows a broken/empty image.
 *
 * NOTE: we use a plain <img> (not next/image) on purpose — avatars are often
 * external URLs a user typed in, and next/image would require whitelisting
 * every possible domain in next.config.ts. For tiny images, the plain tag is
 * the pragmatic choice.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string; // image URL, may be empty
  name: string; // used for the initials fallback
  className?: string; // size + extra styles, e.g. "h-10 w-10"
}

/** Turn "Sam Seeker" → "SS". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ src, name, className }: AvatarProps) {
  // Starts false; flips to true if the image URL fails to load (404, offline…)
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full",
        !showImage && "bg-gradient-to-br from-indigo-500 to-violet-500 text-white",
        className
      )}
      aria-hidden="true" // decorative — the name is always rendered as text nearby
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)} // broken URL → fall back to initials
        />
      ) : (
        <span className="text-xs font-semibold">{initials(name)}</span>
      )}
    </span>
  );
}
