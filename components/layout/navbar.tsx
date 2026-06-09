"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/layout/auth-provider";
import { signOutUser } from "@/lib/firebase/auth";
import { Leaf, Sun, Moon, Menu, X, LogOut, User, BarChart2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync mounted status to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
      setMobileMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    ...(user
      ? [
          { name: "Dashboard", href: "/dashboard", icon: BarChart2 },
          { name: "Community", href: "/community", icon: Users },
        ]
      : []),
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 flex flex-col",
        isScrolled
          ? "glass border-b border-border/40 py-1.5 md:py-2 shadow-md"
          : "bg-transparent py-3 md:py-4"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 md:px-8 py-1">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-md shadow-primary/10 transition-all duration-300 group-hover:scale-105 group-hover:rotate-6">
            <Image
              src="/aura-logo.png"
              alt="Aura Logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-foreground transition-colors">
            Aura
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-4.5 py-1.5 text-sm font-medium tracking-wide transition-all duration-200 hover:text-primary",
                  isActive
                    ? "text-primary bg-primary/8 dark:bg-primary/12"
                    : "text-muted-foreground hover:bg-muted/40"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Utility Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {/* Light/Dark Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/45 hover:bg-muted/80 text-muted-foreground transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 animate-pulse text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-500" />
              )}
            </button>
          )}

          {/* Authentication State */}
          {user ? (
            <div className="flex items-center gap-3">
              <div
                title={user.displayName || "User"}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-inner"
              >
                {user.displayName ? user.displayName[0].toUpperCase() : <User className="h-4.5 w-4.5" />}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full py-1.5 px-3.5 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button className="rounded-full px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-emerald font-semibold shadow-md shadow-primary/25 transition-all duration-300">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navbar Controls */}
        <div className="flex items-center gap-3 md:hidden">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/40 text-muted-foreground transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/40 text-foreground transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="glass-strong fixed inset-x-0 top-[65px] bottom-0 z-40 flex flex-col justify-between p-8 animate-fade-in md:hidden">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </span>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 text-2xl font-bold tracking-tight py-1 transition-colors",
                      isActive ? "text-primary" : "text-foreground hover:text-primary"
                    )}
                  >
                    {link.icon && <link.icon className="h-6 w-6 stroke-[2]" />}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/40 pt-6">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-inner">
                    {user.displayName ? user.displayName[0].toUpperCase() : <User className="h-5 w-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground leading-snug">
                      {user.displayName || "Aura User"}
                    </span>
                    <span className="text-xs text-muted-foreground leading-none">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full rounded-xl py-3 font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-xl py-3 font-semibold glow-emerald bg-primary text-primary-foreground">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
