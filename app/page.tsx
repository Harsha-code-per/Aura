"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { Sparkles } from "@/components/ui/sparkles";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Brain, Leaf, MapPin, Users, ChevronRight } from "lucide-react";

// Register GSAP ScrollTrigger plugin on client-side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleWordsRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Intro Animations
      const tl = gsap.timeline();

      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        );
      }

      if (titleWordsRef.current) {
        const words = titleWordsRef.current.querySelectorAll(".word");
        tl.fromTo(
          words,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" },
          "-=0.4"
        );
      }

      if (subRef.current) {
        tl.fromTo(
          subRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.5"
        );
      }

      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" },
          "-=0.4"
        );
      }

      // Feature cards stagger entrance on scroll
      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".features-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Steps entrance on scroll
      gsap.fromTo(
        ".step-card",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".steps-section",
            start: "top 75%",
          },
        }
      );

      // Stats counters stagger
      gsap.fromTo(
        ".stat-item",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".stats-section",
            start: "top 80%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative flex min-h-[calc(100vh-73px)] w-full flex-col items-center justify-center py-20 px-6 text-center">
        {/* Background Particles & Sparkles */}
        <FloatingParticles quantity={40} color="var(--primary)" />
        <Sparkles particleCount={30} className="opacity-40" />

        <div className="relative z-10 flex max-w-4xl flex-col items-center gap-6">
          {/* Badge */}
          <div
            ref={badgeRef}
            className="glass inline-flex items-center gap-1.5 rounded-full px-4.5 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase"
          >
            <Leaf className="h-3.5 w-3.5 fill-primary/10" />
            🌱 For India, By India
          </div>

          {/* Heading */}
          <h1
            ref={titleWordsRef}
            className="text-fluid-xl tracking-tight text-foreground"
          >
            <span className="word inline-block mr-3 md:mr-5">Your</span>
            <span className="word inline-block mr-3 md:mr-5">Carbon</span>
            <br className="hidden sm:inline" />
            <span className="word inline-block text-gradient mr-3 md:mr-5 font-extrabold">Story</span>
            <span className="word inline-block mr-3 md:mr-5">Starts</span>
            <span className="word inline-block">Here</span>
          </h1>

          {/* Subheading */}
          <p
            ref={subRef}
            className="max-w-2xl text-fluid-md leading-relaxed text-muted-foreground"
          >
            Track, reduce, and share your carbon footprint. Fully localized calculations built for the Indian ecosystem — from local auto-rickshaws to your favorite chicken biryani.
          </p>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="mt-4 flex flex-col gap-4 sm:flex-row">
            <Link href="/auth">
              <Button className="h-13 rounded-full px-8 text-base font-bold tracking-wide glow-emerald bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300 hover:scale-[1.02]">
                Start Your Journey
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="outline"
                className="h-13 rounded-full border-border/60 bg-card/25 px-8 text-base font-semibold text-foreground transition-all duration-300 hover:bg-muted/80"
              >
                Learn More
              </Button>
            </a>
          </div>

          <span className="mt-2 text-xs tracking-wider text-muted-foreground/85 uppercase">
            Free Forever • No Credit Card Required
          </span>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section className="features-section relative w-full py-24 px-6 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-fluid-lg text-foreground mb-4">
              Designed For the Indian Lifestyle
            </h2>
            <p className="mx-auto max-w-xl text-sm md:text-base text-muted-foreground">
              Every country is different. Aura uses localized data to reflect your actual lifestyle accurately.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* AI Powered */}
            <GlassCard className="feature-card flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Natural Language AI
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Just type: <span className="italic text-foreground">&ldquo;Took an auto for 5km and had paneer tikka for dinner&rdquo;</span>. Our AI handles the math instantly.
              </p>
            </GlassCard>

            {/* India Localization */}
            <GlassCard className="feature-card flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                100% Indian Context
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Supported transport: auto-rickshaws, metros, Chennai local trains. Supported diets: standard Indian staple grains, paneer, biryanis.
              </p>
            </GlassCard>

            {/* Community Feed */}
            <GlassCard className="feature-card flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Real-Time Community Feed
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Share milestones, log wins, and inspire fellow citizens. Together, we build a collective national reduction report.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="steps-section relative w-full py-24 px-6 md:py-32 bg-card/5 border-y border-border/20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="text-fluid-lg text-foreground mb-4">
              How Aura Works
            </h2>
            <p className="mx-auto max-w-xl text-sm md:text-base text-muted-foreground">
              Simplifying the footprint logging process down to a single text box.
            </p>
          </div>

          <TracingBeam>
            <div className="flex flex-col gap-14">
              {/* Step 1 */}
              <div className="step-card flex flex-col gap-4 md:flex-row md:gap-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground shadow-md shadow-primary/20">
                  01
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-foreground">Tell us about your day</h3>
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Log your daily routines in plain English or mixed Hinglish. Include transport, meals, cooling appliances (ACs), and electricity usage.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step-card flex flex-col gap-4 md:flex-row md:gap-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground shadow-md shadow-primary/20">
                  02
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-foreground">AI computes using Indian standards</h3>
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Our backend applies India GHG Program emission factors to translate the text inputs into precise metric CO2 values.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step-card flex flex-col gap-4 md:flex-row md:gap-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-bold text-primary-foreground shadow-md shadow-primary/20">
                  03
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-foreground">Receive reduction strategies</h3>
                  <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Get customized tips, review stats on weekly charts, and post milestones directly onto the open community timeline.
                  </p>
                </div>
              </div>
            </div>
          </TracingBeam>
        </div>
      </section>

      {/* 4. STATS SECTION */}
      <section className="stats-section relative w-full py-24 px-6 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 text-center">
            {/* Stat 1 */}
            <div className="stat-item flex flex-col items-center gap-2">
              <AnimatedCounter
                value={1.9}
                decimals={1}
                suffix=" tonnes"
                className="text-fluid-lg text-primary"
              />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Average Indian Annual Footprint
              </span>
              <span className="max-w-xs text-xs text-muted-foreground/80 leading-normal">
                Sourced from recent national carbon registries.
              </span>
            </div>

            {/* Stat 2 */}
            <div className="stat-item flex flex-col items-center gap-2">
              <AnimatedCounter
                value={5.2}
                decimals={1}
                suffix=" kg"
                className="text-fluid-lg text-primary"
              />
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Daily Carbon Output per Person
              </span>
              <span className="max-w-xs text-xs text-muted-foreground/80 leading-normal">
                The baseline target to track and balance.
              </span>
            </div>

            {/* Stat 3 */}
            <div className="stat-item flex flex-col items-center gap-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-baseline justify-center gap-0.5">
                <AnimatedCounter
                  value={4.7}
                  decimals={1}
                  className="text-fluid-lg text-primary"
                />
                <span className="font-heading text-2xl font-bold text-primary">x Less</span>
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Lower than Global Average
              </span>
              <span className="max-w-xs text-xs text-muted-foreground/80 leading-normal">
                Help keep it low as our national infrastructure expands!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="relative w-full py-24 px-6 md:py-32 text-center bg-primary/8 dark:bg-primary/5">
        <Sparkles particleCount={15} className="opacity-30" />
        <div className="relative z-10 mx-auto max-w-4xl flex flex-col items-center gap-6">
          <h2 className="text-fluid-lg font-bold tracking-tight text-foreground">
            Ready to Track Your Impact?
          </h2>
          <p className="max-w-lg text-sm md:text-base text-muted-foreground">
            Log in with your existing account or sign up instantly. Start balancing your daily habits today.
          </p>
          <Link href="/auth">
            <Button className="h-13 rounded-full px-8 text-base font-bold tracking-wide glow-emerald bg-primary text-primary-foreground">
              Get Started Now
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
