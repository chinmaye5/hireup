"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Same horizontal rhythm as the hero (max-w-7xl, px-6 / sm:px-10 / lg:px-12). */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-12", className)}>{children}</div>;
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/50", className)}>
      {children}
    </p>
  );
}

export function SectionHeader({
  index,
  label,
  title,
  description,
}: {
  index: string;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-14 grid gap-6 md:mb-20 md:grid-cols-12">
      <div className="md:col-span-3">
        <MonoLabel>
          {index} / {label}
        </MonoLabel>
      </div>
      <div className="md:col-span-9">
        <h2 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/65 sm:text-lg">{description}</p>
        )}
      </div>
    </div>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Animated voice level bars. Colour comes from the parent's text colour. */
export function VoiceBars({
  active = true,
  count = 9,
  className,
}: {
  active?: boolean;
  count?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const live = active && !reduce;
  return (
    <div className={cn("flex h-10 items-center gap-1", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <motion.span
          key={i}
          className="block h-full w-1 origin-center bg-current"
          initial={{ scaleY: 0.15 }}
          animate={live ? { scaleY: [0.2, 1, 0.35, 0.8, 0.2] } : { scaleY: 0.15 }}
          transition={
            live
              ? { duration: 1.1 + (i % 4) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}
