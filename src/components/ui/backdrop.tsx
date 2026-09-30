"use client";

import * as React from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Soft morning light behind app screens: a faint warm glow and a faint
 * green one. (Kept under its original name so existing pages pick it up.)
 */
export function AuroraBackdrop({ className, intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div
        className="absolute -left-40 -top-40 size-[36rem] rounded-full blur-3xl"
        style={{ background: "rgb(241 205 178 / 0.28)", opacity: intensity }}
      />
      <div
        className="absolute -right-40 -top-32 size-[34rem] rounded-full blur-3xl"
        style={{ background: "rgb(197 218 204 / 0.4)", opacity: intensity }}
      />
    </div>
  );
}

/**
 * Full-bleed photograph used as a section background. It drifts almost
 * imperceptibly, like light moving across a window, and is washed with a
 * soft paper tone so text on top stays easy to read.
 */
export function PhotoBackdrop({
  src,
  video,
  alt = "",
  priority,
  className,
  position = "center",
  shade = 0.3,
  tone = "light",
  motion: animate = true,
}: {
  src: string;
  video?: string;
  alt?: string;
  priority?: boolean;
  className?: string;
  position?: string;
  /** How much of the paper wash to lay over the photo (0–1). */
  shade?: number;
  /** "light" washes toward paper; "none" leaves the photo untouched. */
  tone?: "light" | "none";
  motion?: boolean;
}) {
  const reduce = useReducedMotion();
  const [videoReady, setVideoReady] = React.useState(false);
  const moving = animate && !reduce;

  return (
    <div aria-hidden={!alt} className={cn("absolute inset-0 -z-10 overflow-hidden bg-sand", className)}>
      <div className={cn("absolute inset-0", moving && "animate-kenburns will-change-transform")}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className={cn("object-cover transition-opacity duration-[1500ms]", videoReady && "opacity-0")}
          style={{ objectPosition: position }}
        />
        {video && !reduce && (
          <video
            src={video}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoReady(true)}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-[1500ms]",
              videoReady ? "opacity-100" : "opacity-0",
            )}
            style={{ objectPosition: position }}
          />
        )}
      </div>
      {tone === "light" && (
        <div className="absolute inset-0" style={{ background: `rgb(247 245 240 / ${shade})` }} />
      )}
    </div>
  );
}

/** Faint dotted texture, like good paper. */
export function GridBackdrop({ className }: { className?: string }) {
  return <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 grid-backdrop", className)} />;
}

/** Retired in the calm design — renders nothing, kept so imports don't break. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ParticleField(_: { count?: number; className?: string }) {
  return null;
}

/** Retired in the calm design — renders nothing, kept so imports don't break. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BorderBeam(_: { duration?: number; className?: string }) {
  return null;
}
