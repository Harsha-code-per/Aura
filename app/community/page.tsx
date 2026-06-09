"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import {
  addCommunityPost,
  getCommunityFeed,
  CommunityPost,
} from "@/lib/firebase/firestore";
import { parseCommunitySaving } from "@/lib/actions/gemini-parser";
import { GlassCard } from "@/components/ui/glass-card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MessageSquare,
  Send,
  Award,
  Calendar,
  RefreshCw,
  TrendingDown,
  Info,
  CheckCircle2,
  Trash2,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { enIN } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTION_CHIPS = [
  {
    label: "🚇 Metro over Cab",
    text: "Took Chennai Metro instead of an Ola cab for 12km to my office.",
    badge: "Public Transit"
  },
  {
    label: "🍛 Dal Rice over Biryani",
    text: "Had a meal of Dal Rice instead of Chicken Biryani for lunch.",
    badge: "Eco Diet"
  },
  {
    label: "🔌 AC Off",
    text: "Ran my ceiling fan and kept the 1.5 ton split AC off for 3 hours.",
    badge: "Energy Saver"
  },
  {
    label: "🚲 Cycling over Bike",
    text: "Cycled to the local market for 4km instead of using my motorcycle.",
    badge: "Zero Emission"
  },
  {
    label: "🚆 Local Train over Driving",
    text: "Commuted 25km via local suburban train instead of driving my petrol car.",
    badge: "Transit"
  }
];

export default function CommunityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Feed states
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Form states
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Estimate state
  const [estimatedSavings, setEstimatedSavings] = useState<{
    actionTaken: string;
    co2Saved: number;
    explanation: string;
    isOfflineFallback?: boolean;
  } | null>(null);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  // Subscribe to real-time feed
  useEffect(() => {
    if (!user) return;

    setLoadingFeed(true);
    const unsubscribe = getCommunityFeed((updatedPosts) => {
      setPosts(updatedPosts);
      setLoadingFeed(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Track changes to content
  const handleContentChange = (val: string) => {
    setContent(val);
    setHasChanges(true);
  };

  const handleApplyChip = (text: string) => {
    setContent(text);
    setHasChanges(true);
    setEstimatedSavings(null);
  };

  // Perform AI Carbon Saving calculation
  const handleCalculateSavings = async () => {
    if (!content.trim()) {
      toast.error("Please describe your green action first.");
      return null;
    }

    setCalculating(true);
    try {
      const result = await parseCommunitySaving(content.trim());
      if (result.success) {
        setEstimatedSavings({
          actionTaken: result.actionTaken,
          co2Saved: result.co2Saved,
          explanation: result.explanation,
          isOfflineFallback: result.isOfflineFallback,
        });
        setHasChanges(false);
        toast.success("Carbon savings successfully calculated!");
        return result;
      } else {
        toast.error(result.error || "Could not calculate savings. Please try again.");
        return null;
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to estimate savings.");
      return null;
    } finally {
      setCalculating(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter some text for your post.");
      return;
    }

    setPosting(true);
    try {
      let currentSavings = estimatedSavings;

      // Auto-calculate if user changed text or hasn't calculated yet
      if (!currentSavings || hasChanges) {
        const result = await handleCalculateSavings();
        if (result && result.success) {
          currentSavings = {
            actionTaken: result.actionTaken,
            co2Saved: result.co2Saved,
            explanation: result.explanation,
            isOfflineFallback: result.isOfflineFallback,
          };
        }
      }

      await addCommunityPost({
        userId: user!.uid,
        displayName: user!.displayName || "Aura Member",
        photoURL: user!.photoURL || undefined,
        content: content.trim(),
        co2Saved: currentSavings && currentSavings.co2Saved > 0 ? currentSavings.co2Saved : undefined,
      });

      toast.success("Milestone shared with the community!");
      setContent("");
      setEstimatedSavings(null);
      setHasChanges(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to post message.");
    } finally {
      setPosting(false);
    }
  };

  const handleClear = () => {
    setContent("");
    setEstimatedSavings(null);
    setHasChanges(false);
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground font-medium">Verifying Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 md:px-8 flex-1 flex flex-col gap-10">
      {/* Header */}
      <div className="border-b border-border/40 pb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-gradient">
            Community Ecosystem Feed
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share your daily environmental victories and inspire fellow green champions in India.
          </p>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2 self-center sm:self-auto shadow-sm">
          <Award className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-xs font-bold text-primary tracking-wide uppercase">AI Audited Feed</span>
        </div>
      </div>

      {/* Post Creator Card */}
      <GlassCard className="p-6 border-primary/10 shadow-lg relative overflow-hidden" hover={false}>
        {/* Subtle background glow */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2.5 mb-5">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-extrabold text-foreground">Share your carbon reduction milestone</h2>
        </div>

        <form onSubmit={handleCreatePost} className="flex flex-col gap-5">
          <div>
            <Textarea
              placeholder="Describe your green action, e.g., 'Took the Chennai Metro today to work instead of my regular cab ride for 12km'..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[110px] rounded-2xl border-border/60 bg-background/50 p-4 focus-visible:ring-primary focus-visible:border-primary text-sm resize-none transition-all duration-300"
              disabled={posting || calculating}
              required
            />
            
            {/* Length helper / warning indicator */}
            <div className="flex justify-between items-center mt-1.5 px-1">
              <span className="text-[10px] text-muted-foreground">
                Tip: Include distances (km) or food items (biryani, dal rice) for best AI audit.
              </span>
              {content.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-destructive hover:underline flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-1">
              Quick Suggestion Chips:
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyChip(chip.text)}
                  className="text-xs px-3.5 py-1.5 rounded-full border border-border/60 bg-background/30 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-300 flex items-center gap-1.5 text-muted-foreground cursor-pointer"
                  disabled={posting || calculating}
                >
                  <Plus className="h-3 w-3" />
                  <span className="font-medium">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Carbon Estimator Panel */}
          <AnimatePresence mode="wait">
            {calculating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass border-primary/20 bg-primary/5 p-5 rounded-2xl flex items-center justify-center gap-3 py-8"
              >
                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                <span className="text-sm font-semibold text-primary animate-pulse">
                  Aura Carbon AI auditing emissions...
                </span>
              </motion.div>
            )}

            {!calculating && estimatedSavings && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-5 rounded-2xl border ${
                  hasChanges
                    ? "bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-300"
                    : "glass border-primary/20 bg-primary/5 glow-emerald"
                } transition-colors duration-300`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/20 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    {hasChanges ? (
                      <Info className="h-5 w-5 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {hasChanges ? "Input Modified" : "AI Verification Audit"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-primary font-heading tracking-tight">
                      {estimatedSavings.co2Saved.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      kg CO2 Saved
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-foreground">
                    Action: &ldquo;{estimatedSavings.actionTaken}&rdquo;
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {estimatedSavings.explanation}
                  </p>
                  
                  {estimatedSavings.isOfflineFallback && (
                    <span className="text-[10px] text-muted-foreground/60 italic mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Note: Estimated locally using standard India GHG factors.
                    </span>
                  )}

                  {hasChanges && (
                    <div className="text-[11px] font-semibold text-amber-500 mt-2">
                      ⚠️ You edited the text. Click &ldquo;Calculate Net Savings&rdquo; again to update the carbon verification.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-border/20 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCalculateSavings}
              disabled={posting || calculating || !content.trim()}
              className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5 py-5 transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Calculate Net Savings
            </Button>

            <Button
              type="submit"
              disabled={posting || calculating || !content.trim()}
              className="rounded-xl py-5 px-6 font-bold shadow-md bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              {posting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Share with World</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* Community Feed Logs */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Recent Milestones
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {posts.length} actions listed
          </span>
        </div>

        {loadingFeed ? (
          <div className="flex flex-col gap-3 py-14 items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span>Loading community feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass p-14 text-center text-sm text-muted-foreground rounded-2xl border-dashed border-border/60">
            No milestones shared yet. Be the first to tell the world about your green actions!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => {
              const postInitials = post.displayName ? post.displayName[0].toUpperCase() : "A";
              let timeStr = "";
              try {
                if (post.createdAt) {
                  timeStr = formatDistanceToNow(new Date(post.createdAt.seconds * 1000), {
                    addSuffix: true,
                    locale: enIN,
                  });
                }
              } catch (e) {
                console.error("Error formatting date:", e);
              }

              const isHighImpact = post.co2Saved !== undefined && post.co2Saved >= 1.0;

              return (
                <GlassCard
                  key={post.id}
                  className="p-5 border-border/40 hover:border-primary/20 transition-all flex flex-col gap-4 relative overflow-hidden"
                  hover={true}
                >
                  {/* Subtle impact gradient line for high saving posts */}
                  {isHighImpact && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-emerald-400" />
                  )}

                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-border/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20 shadow-inner">
                        {postInitials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          {post.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-medium">
                          <Calendar className="h-3 w-3" />
                          {timeStr}
                        </span>
                      </div>
                    </div>

                    {/* CO2 Saved Badge */}
                    {post.co2Saved !== undefined && post.co2Saved > 0 ? (
                      <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                        <Award className="h-3.5 w-3.5" />
                        <span>Saved {post.co2Saved.toFixed(2)} kg CO2</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase px-2 py-0.5 bg-muted/40 rounded-md">
                        Green Victory
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col gap-3 pl-1">
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Additional styling for posts with high CO2 savings */}
                    {post.co2Saved !== undefined && post.co2Saved > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mt-1">
                        <TrendingDown className="h-3.5 w-3.5" />
                        <span>Positive Climate Contribution</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
