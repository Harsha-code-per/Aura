"use client";

import React, { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

// Ensure GSAP works on client side
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  startOnView?: boolean;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 1,
  duration = 2,
  className,
  startOnView = true,
}: AnimatedCounterProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const countRef = useRef({ val: 0 });

  useEffect(() => {
    if (!startOnView) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // Trigger once
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [startOnView]);

  useGSAP(
    () => {
      if (!inView || !containerRef.current) return;

      gsap.to(countRef.current, {
        val: value,
        duration: duration,
        ease: "power2.out",
        onUpdate: () => {
          if (containerRef.current) {
            containerRef.current.innerText = `${prefix}${countRef.current.val.toFixed(decimals)}${suffix}`;
          }
        },
      });
    },
    { dependencies: [value, inView, duration, decimals, prefix, suffix] }
  );

  return (
    <span
      ref={containerRef}
      className={cn("tabular-nums select-none font-bold font-heading", className)}
    >
      {prefix}0.0{suffix}
    </span>
  );
}
