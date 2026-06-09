"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glowColor?: string;
}

export function GlassCard({
  children,
  className,
  hover = true,
  glowColor = "var(--primary)",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass relative rounded-2xl p-6 transition-all duration-300 ease-out",
        hover && "hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10",
        className
      )}
      style={
        hover && glowColor
          ? ({
              "--hover-glow": glowColor,
            } as React.CSSProperties)
          : undefined
      }
      {...props}
    >
      {/* Glow border overlay (very subtle) */}
      <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 hover:opacity-100" />
      {children}
    </div>
  );
}
