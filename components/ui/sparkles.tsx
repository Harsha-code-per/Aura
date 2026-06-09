"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SparklesProps {
  className?: string;
  particleCount?: number;
  particleColor?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
}

export function Sparkles({
  className,
  particleCount = 50,
  particleColor = "#10b981",
  minSize = 1,
  maxSize = 3,
  speed = 0.5,
}: SparklesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      fadeSpeed: number;
      twinklePhase: number;
      twinkleSpeed: number;
    }> = [];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (maxSize - minSize) + minSize,
        speedY: -(Math.random() * speed + 0.1),
        opacity: Math.random(),
        fadeSpeed: Math.random() * 0.01 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.05 + 0.01,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = particleColor;

      particles.forEach((p) => {
        // Update physics
        p.y += p.speedY;
        p.twinklePhase += p.twinkleSpeed;
        
        // Compute twinkling opacity
        const dynamicOpacity = Math.max(0.1, (Math.sin(p.twinklePhase) + 1) / 2 * p.opacity);

        // Render
        ctx.globalAlpha = dynamicOpacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Boundary check
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, particleColor, minSize, maxSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 block h-full w-full", className)}
    />
  );
}
