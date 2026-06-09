"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
} from "@/lib/firebase/auth";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (activeTab === "signup" && !displayName) {
      toast.error("Please enter your name.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "signin") {
        await signInWithEmail(email, password);
        toast.success("Welcome back!");
      } else {
        await signUpWithEmail(email, password, displayName);
        toast.success("Account created successfully!");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      toast.success("Authenticated successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Social login failed.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex items-center justify-center px-6 py-16">
      <FloatingParticles quantity={35} color="var(--primary)" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <GlassCard className="p-8 shadow-2xl border-primary/10" hover={false}>
          {/* Header */}
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden">
              <Image
                src="/aura-logo.png"
                alt="Aura Logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="font-heading text-2xl font-bold mt-2">Welcome to Aura</h1>
            <p className="text-sm text-muted-foreground">
              Create an account or login to start tracking.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-lg bg-secondary/80 p-1 mb-6 border border-border/20">
            <button
              onClick={() => {
                setActiveTab("signin");
                setEmail("");
                setPassword("");
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                activeTab === "signin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setEmail("");
                setPassword("");
                setDisplayName("");
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                activeTab === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            {activeTab === "signup" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
                  Full Name
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Rahul Kumar"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl border-border/60 bg-background/50 py-5 pl-4 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
                Email Address
              </label>
              <Input
                id="auth-email"
                type="email"
                placeholder="rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-border/60 bg-background/50 py-5 pl-4 focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
                Password
              </label>
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-border/60 bg-background/50 py-5 pl-4 focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl py-6 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-300"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : activeTab === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="grow border-t border-border/40"></div>
            <span className="shrink mx-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              or continue with
            </span>
            <div className="grow border-t border-border/40"></div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3.5">
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("google")}
              className="rounded-xl border-border/60 bg-background/40 hover:bg-muted/80 py-5 font-semibold transition-all duration-200"
            >
              <FaGoogle className="mr-2 text-red-500 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={loading}
              onClick={() => handleOAuth("github")}
              className="rounded-xl border-border/60 bg-background/40 hover:bg-muted/80 py-5 font-semibold transition-all duration-200"
            >
              <FaGithub className="mr-2 text-foreground h-4 w-4" />
              GitHub
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
