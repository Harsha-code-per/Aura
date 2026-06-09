"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TracingBeamProps {
  children: React.ReactNode;
  className?: string;
}

export function TracingBeam({ children, className }: TracingBeamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const [scrollYProgress, setScrollYProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setSvgHeight(container.offsetHeight);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress inside this container
      const totalDist = rect.height - windowHeight;
      if (totalDist <= 0) return;
      
      const scrollPos = -rect.top;
      const progress = Math.min(Math.max(scrollPos / totalDist, 0), 1);
      setScrollYProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateHeight);
    
    // Initial check
    handleScroll();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const lineY = svgHeight * scrollYProgress;

  return (
    <div ref={containerRef} className={cn("relative mx-auto w-full max-w-5xl", className)}>
      {/* Scroll Tracing Beam - hidden on small mobile, visible on md+ */}
      <div className="absolute -left-4 top-3 hidden h-full w-4 md:block lg:-left-12">
        <svg
          aria-hidden="true"
          width="16"
          height={svgHeight}
          viewBox={`0 0 16 ${svgHeight}`}
          className="ml-2 block"
        >
          {/* Static Background Path */}
          <path
            d={`M8 0 V${svgHeight}`}
            fill="none"
            stroke="var(--border)"
            strokeWidth="2"
          />
          {/* Glowing Animated Scroll Progress Path */}
          <path
            ref={pathRef}
            d={`M8 0 V${lineY}`}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_var(--primary)] transition-all duration-75"
          />
          {/* Glowing cursor head */}
          <circle
            cx="8"
            cy={lineY}
            r="5"
            fill="var(--background)"
            stroke="var(--primary)"
            strokeWidth="3.5"
            className="drop-shadow-[0_0_12px_var(--primary)] transition-all duration-75"
          />
        </svg>
      </div>

      <div className="md:pl-10 lg:pl-16">{children}</div>
    </div>
  );
}
