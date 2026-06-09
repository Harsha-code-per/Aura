"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import {
  addCarbonEntry,
  getUserEntries,
  getDailyTotal,
  getWeeklyData,
  CarbonEntry,
} from "@/lib/firebase/firestore";
import { parseActivityInput } from "@/lib/actions/gemini-parser";
import { GlassCard } from "@/components/ui/glass-card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AnalyticsCharts } from "@/components/ui/analytics-charts";
import {
  Leaf,
  Send,
  Zap,
  Lightbulb,
  Check,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const EXAMPLE_CHIPS = [
  { label: "🛺 Auto to market 5km", text: "I took an auto-rickshaw to the local market for 5km" },
  { label: "🍛 Paneer & Roti meal", text: "Had paneer dish and rotis for dinner" },
  { label: "🚇 Delhi Metro 15km", text: "Took the local Delhi metro to office for 15km" },
  { label: "❄️ AC for 3 hours", text: "Ran my 1.5 ton split AC for 3 hours at home" },
  { label: "🍛 Chicken Biryani lunch", text: "Had chicken biryani for lunch" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Page data states
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; total: number }>>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  // Text Engine states
  const [rawText, setRawText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  
  // Gemini Parse Results
  const [parsedData, setParsedData] = useState<{
    activities: Array<{ name: string; category: string; detail?: string; co2: number }>;
    totalCO2: number;
    tips: string[];
    summary: string;
    isOfflineFallback?: boolean;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auth Redirection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Load stats from Firestore wrapped in useCallback to prevent reference churn
  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;
    setLoadingStats(true);
    try {
      const fetchedEntries = await getUserEntries(user.uid, 5);
      const fetchedToday = await getDailyTotal(user.uid, new Date());
      const fetchedWeek = await getWeeklyData(user.uid);
      setEntries(fetchedEntries);
      setTodayTotal(fetchedToday);
      setWeeklyData(fetchedWeek);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Could not fetch latest stats.");
    } finally {
      setLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        fetchDashboardStats();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, fetchDashboardStats]);

  // Handle SSR check for chart rendering deferred to prevent AST sync warnings
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleChipClick = (text: string) => {
    setRawText((prev) => (prev ? prev + ", " + text : text));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      toast.error("Please enter some activities.");
      return;
    }

    setAnalyzing(true);
    setParsedData(null);
    try {
      const response = await parseActivityInput(rawText);
      if (response.success) {
        setParsedData({
          activities: response.activities.map((a: { name: string; category: string; detail?: string; co2: number }) => ({
            name: a.name,
            category: a.category,
            detail: a.detail,
            co2: a.co2,
          })),
          totalCO2: response.totalCO2,
          tips: response.tips,
          summary: response.summary,
          isOfflineFallback: response.isOfflineFallback,
        });
        toast.success("Input successfully parsed!");
      } else {
        toast.error(response.error || "Gemini AI failed to parse input.");
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error("Could not connect to AI parser.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!user || !parsedData) return;
    setSaving(true);
    try {
      await addCarbonEntry({
        userId: user.uid,
        rawInput: rawText,
        activities: parsedData.activities.map(a => ({
          name: a.name,
          category: a.category,
          co2: a.co2
        })),
        totalCO2: parsedData.totalCO2,
        tips: parsedData.tips,
      });

      toast.success("Footprint logged successfully!");
      // Reset input engine
      setRawText("");
      setParsedData(null);
      // Reload stats
      await fetchDashboardStats();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save carbon log.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Verifying Session...</span>
        </div>
      </div>
    );
  }

  // Generate initials or fallback name
  const greetingName = user.displayName || "Aura User";
  const dateString = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-8 flex-1 flex flex-col gap-10">
      {/* Greetings Block */}
      <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            Namaste, {greetingName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{dateString}</p>
        </div>
        <Button
          onClick={fetchDashboardStats}
          disabled={loadingStats}
          variant="outline"
          className="self-start rounded-full border-border/60 bg-card/40 hover:bg-muted/70 text-xs px-4"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loadingStats ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Side: Input Engine / Parser */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <GlassCard className="p-6 border-primary/10" hover={false}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-xl font-bold">Natural Language Carbon Logger</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Describe your day&apos;s primary actions in simple conversational text. We support English (e.g., &ldquo;MTC bus for 8km and paneer roll&rdquo;).
            </p>

            <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
              <label htmlFor="dashboard-activity-input" className="sr-only">
                Describe your daily actions
              </label>
              <Textarea
                id="dashboard-activity-input"
                placeholder="Type your activities here... (e.g., I rode my bike for 10km, had dal chawal for lunch, and turned on the AC for 3 hours)"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="min-h-30 rounded-xl border-border/60 bg-background/50 p-4 focus:ring-primary focus:border-primary text-sm md:text-base resize-none"
                disabled={analyzing}
              />

              {/* Sample Chips */}
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChipClick(chip.text)}
                    className="rounded-full bg-secondary/80 hover:bg-primary/15 hover:text-primary border border-border/20 px-3 py-1.5 text-xs text-muted-foreground transition-all"
                  >
                    <Plus className="inline mr-1 h-3 w-3" />
                    {chip.label}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={analyzing}
                className="w-full rounded-xl py-6 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-300"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    AI Calculations Running...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze My Impact
                  </>
                )}
              </Button>
            </form>
          </GlassCard>

          {/* AI Result Card */}
          {parsedData && (
            <GlassCard className="p-6 border-primary/20 glow-emerald animate-fade-in" hover={false}>
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-primary" />
                    <h3 className="font-heading text-lg font-bold">Analysis Results</h3>
                  </div>
                  {parsedData.isOfflineFallback && (
                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Heuristic Fallback (API Quota Exceeded)
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full">
                  <AnimatedCounter
                    value={parsedData.totalCO2}
                    decimals={2}
                    className="font-bold text-sm tracking-tight text-primary"
                  />
                  <span className="text-xs font-semibold">kg CO2e</span>
                </div>
              </div>

              {/* Summary Text */}
              <p className="text-sm italic text-muted-foreground bg-secondary/40 border border-border/20 p-4 rounded-xl mb-6">
                &ldquo;{parsedData.summary}&rdquo;
              </p>

              {/* Broken down items */}
              <div className="flex flex-col gap-3 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
                  Individual Components
                </span>
                <div className="flex flex-col gap-2.5">
                  {parsedData.activities.map((act, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-background/50 border border-border/40 p-3.5 rounded-xl text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground capitalize">{act.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          Category: {act.category} {act.detail ? `• ${act.detail}` : ""}
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">{act.co2.toFixed(2)} kg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personalized Tips */}
              <div className="flex flex-col gap-3 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 pl-1">
                  🇮🇳 Actionable Mitigation Tips
                </span>
                <div className="flex flex-col gap-2">
                  {parsedData.tips.map((tip, index) => (
                    <div key={index} className="flex gap-2.5 items-start text-sm bg-primary/5 p-3 rounded-xl">
                      <Lightbulb className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveEntry}
                  disabled={saving}
                  className="flex-1 rounded-xl py-6 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20"
                >
                  {saving ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4 stroke-3" />
                  )}
                  Save to Tracker
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setParsedData(null)}
                  className="rounded-xl py-6 border-border/60 bg-background/30"
                >
                  Cancel
                </Button>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right Side: Visual Metrics Tracker */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <AnalyticsCharts
            weeklyData={weeklyData}
            todayTotal={todayTotal}
            mounted={mounted}
          />

          {/* Recent Logs List */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Recent Carbon Logs
            </span>
            <div className="flex flex-col gap-3">
              {entries.length === 0 ? (
                <div className="glass p-6 text-center text-xs text-muted-foreground rounded-xl">
                  Your carbon ledger is clean.
                </div>
              ) : (
                entries.map((ent) => {
                  const timestampStr = ent.createdAt
                    ? new Date(ent.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    : "";
                  return (
                    <div
                      key={ent.id}
                      className="glass flex items-center justify-between p-4 rounded-xl text-sm"
                    >
                      <div className="flex flex-col gap-1 overflow-hidden max-w-[70%]">
                        <span className="font-semibold text-foreground truncate block">
                          &ldquo;{ent.rawInput}&rdquo;
                        </span>
                        <span className="text-xs text-muted-foreground">{timestampStr}</span>
                      </div>
                      <span className="font-bold text-primary shrink-0">
                        {ent.totalCO2.toFixed(2)} kg
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
