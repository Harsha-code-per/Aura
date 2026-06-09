"use client";

import React, { useMemo } from "react";
import { Leaf } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

// Target daily average target threshold for carbon footprint in India (in kg CO2)
const DAILY_TARGET_THRESHOLD = 5.2;

interface ChartDataPoint {
  date: string;
  total: number;
}

interface AnalyticsChartsProps {
  weeklyData: ChartDataPoint[];
  todayTotal: number;
  mounted: boolean;
}

export function AnalyticsCharts({ weeklyData, todayTotal, mounted }: AnalyticsChartsProps) {
  // 1. Calculate the rolling 7-day cumulative total using useMemo to prevent thread-blocking computations
  const totalWeeklyEmissions = useMemo(() => {
    return weeklyData.reduce((acc, curr) => acc + curr.total, 0);
  }, [weeklyData]);

  // 2. Compute the 7-day rolling average
  const averageWeeklyEmissions = useMemo(() => {
    if (weeklyData.length === 0) return 0;
    return totalWeeklyEmissions / weeklyData.length;
  }, [weeklyData, totalWeeklyEmissions]);

  // 3. Compute target threshold deviations (how much higher or lower is today's total compared to average)
  const todayDeviationPercent = useMemo(() => {
    if (todayTotal === 0) return 0;
    const deviation = ((todayTotal - DAILY_TARGET_THRESHOLD) / DAILY_TARGET_THRESHOLD) * 100;
    return Number(deviation.toFixed(1));
  }, [todayTotal]);

  const deviationStatus = useMemo(() => {
    if (todayTotal === 0) return "Optimal";
    if (todayTotal <= DAILY_TARGET_THRESHOLD) return "Within Daily Safety Target";
    return "Exceeding Daily Safety Target";
  }, [todayTotal]);

  return (
    <div className="flex flex-col gap-8">
      {/* Today's Score Dial with deviation status */}
      <GlassCard className="p-6 text-center border-primary/10" hover={false}>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Today's Carbon Output
        </span>
        <div className="my-6 flex items-baseline justify-center gap-1.5">
          <AnimatedCounter
            value={todayTotal}
            decimals={2}
            className="text-fluid-lg text-primary"
          />
          <span className="text-lg font-bold text-primary">kg CO2e</span>
        </div>
        
        {/* Deviation indicator */}
        <div className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-full inline-block bg-background/40 border border-border/40 text-foreground">
          <span className={todayTotal > DAILY_TARGET_THRESHOLD ? "text-destructive" : "text-primary"}>
            {deviationStatus} ({todayDeviationPercent > 0 ? `+${todayDeviationPercent}` : todayDeviationPercent}%)
          </span>
        </div>

        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-normal mt-4">
          The national daily target threshold is {DAILY_TARGET_THRESHOLD} kg CO2 per person. Balanced meals and public transit help stay within safe boundaries.
        </p>
      </GlassCard>

      {/* Recharts Area Chart */}
      <GlassCard className="p-6 border-primary/10" hover={false}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Leaf className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Weekly Carbon Score
            </h3>
          </div>
          <div className="text-xs font-bold text-primary">
            Avg: {averageWeeklyEmissions.toFixed(2)} kg/day
          </div>
        </div>

        <div className="h-56 w-full">
          {mounted && weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#chartGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No tracking logs found. Try adding inputs on the left.
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
