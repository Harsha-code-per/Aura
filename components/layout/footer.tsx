import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Leaf } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-card/15 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Logo & Tagline */}
          <div className="flex flex-col gap-4.5 sm:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
                <Image
                  src="/aura-logo.png"
                  alt="Aura Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                Aura
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Empowering Indian households to understand, measure, and minimize their carbon footprint. Small steps lead to giant strides.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Platform
            </span>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/" className="text-muted-foreground transition-colors hover:text-primary">
                Overview
              </Link>
              <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-primary">
                Tracker
              </Link>
              <Link href="/community" className="text-muted-foreground transition-colors hover:text-primary">
                Community
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Resources
            </span>
            <div className="flex flex-col gap-2.5 text-sm">
              <a
                href="https://ghgprogramindia.org/"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                India GHG Program
              </a>
              <a
                href="https://www.ipcc.ch/"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                IPCC Guidelines
              </a>
              <a
                href="https://www.moefcc.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                MoEFCC India
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-border/40 pt-8 sm:flex-row text-xs text-muted-foreground">
          <span>&copy; {currentYear} Aura Carbon. All rights reserved.</span>
          <div className="flex items-center gap-1">
            Made with <span className="text-primary animate-pulse">💚</span> in India 🇮🇳
          </div>
        </div>
      </div>
    </footer>
  );
}
