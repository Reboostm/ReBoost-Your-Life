"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserWorkoutsForPeriod } from "@/lib/firestore";
import { WorkoutLog, Period } from "@/types";
import { getDateRange, formatDuration, getPeriodLabel } from "@/lib/utils";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Footprints, Clock, Zap, Target } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const PERIODS: Period[] = ["week", "month", "year"];

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <Analytics />
    </AuthGuard>
  );
}

function Analytics() {
  const { firebaseUser } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!firebaseUser?.uid) return;
    setLoading(true);
    const { start, end } = getDateRange(period);
    const data = await getUserWorkoutsForPeriod(firebaseUser.uid, start, end);
    setWorkouts(data);
    setLoading(false);
  }, [firebaseUser?.uid, period]);

  useEffect(() => { load(); }, [load]);

  const totalSteps = workouts.reduce((s, w) => s + w.totalSteps, 0);
  const totalWorkouts = workouts.length;
  const bestTime = workouts.length
    ? Math.min(...workouts.map((w) => w.durationSeconds))
    : 0;
  const avgStepsPerWorkout = totalWorkouts ? Math.round(totalSteps / totalWorkouts) : 0;

  // Build chart data
  const { start, end } = getDateRange(period);
  const days = period === "year"
    ? buildMonthlyData(workouts, start, end)
    : buildDailyData(workouts, start, end, period);

  const bestTimes = Object.values(
    workouts.reduce((acc, w) => {
      if (!acc[w.presetId] || acc[w.presetId].durationSeconds > w.durationSeconds) {
        acc[w.presetId] = w;
      }
      return acc;
    }, {} as Record<string, WorkoutLog>)
  );

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-text-primary">My Analytics</h1>
          </div>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  period === p ? "bg-primary text-bg" : "bg-surface-2 text-text-secondary"
                )}
              >
                {p === "week" ? "7D" : p === "month" ? "30D" : "1Y"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Period label */}
        <p className="text-muted text-sm">{getPeriodLabel(period)}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Footprints className="w-4 h-4 text-primary" />} label="Total Steps" value={totalSteps.toLocaleString()} />
          <StatCard icon={<Zap className="w-4 h-4 text-secondary" />} label="Workouts" value={totalWorkouts.toString()} />
          <StatCard icon={<Clock className="w-4 h-4 text-accent" />} label="Best Time" value={bestTime ? formatDuration(bestTime) : "—"} />
          <StatCard icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Avg Steps/Workout" value={avgStepsPerWorkout ? avgStepsPerWorkout.toLocaleString() : "—"} />
        </div>

        {/* Steps chart */}
        {days.length > 0 && !loading && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Steps Over Time</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={days} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#10101e", border: "1px solid #252540", borderRadius: 8, color: "#f0f0ff", fontSize: 12 }}
                  cursor={{ fill: "rgba(0,230,118,0.05)" }}
                />
                <Bar dataKey="steps" fill="#00e676" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Time trend chart */}
        {workouts.length > 1 && !loading && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Time Per Workout (seconds)</p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={workouts.slice().reverse().map((w, i) => ({ i: i + 1, time: w.durationSeconds, name: w.presetName }))}
                margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252540" />
                <XAxis dataKey="i" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#10101e", border: "1px solid #252540", borderRadius: 8, color: "#f0f0ff", fontSize: 12 }}
                  formatter={(v: number) => [formatDuration(v), "Time"]}
                />
                <Line type="monotone" dataKey="time" stroke="#ff6b35" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Best times per exercise */}
        {bestTimes.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Personal Records</p>
            <div className="space-y-2">
              {bestTimes.map((w) => (
                <div key={w.presetId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-text-secondary">{w.presetName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary text-sm">{formatDuration(w.durationSeconds)}</span>
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">PR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-muted">Loading stats...</div>
        )}

        {/* Goals shortcut */}
        <Link href="/goals">
          <div className="flex items-center justify-between bg-surface border border-border rounded-2xl p-4 hover:border-accent/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Goals & Progress</p>
                <p className="text-xs text-muted">Set targets, track progress</p>
              </div>
            </div>
            <span className="text-muted text-sm">→</span>
          </div>
        </Link>

        {!loading && workouts.length === 0 && (
          <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-text-secondary font-semibold mb-1">No data yet</p>
            <p className="text-muted text-sm">Log some workouts to see your analytics!</p>
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-2xl font-black text-text-primary">{value}</p>
    </div>
  );
}

function buildDailyData(workouts: WorkoutLog[], start: string, end: string, period: Period) {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayWorkouts = workouts.filter((w) => w.date === dateStr);
    return {
      label: period === "week" ? format(day, "EEE") : format(day, "d"),
      steps: dayWorkouts.reduce((s, w) => s + w.totalSteps, 0),
      workouts: dayWorkouts.length,
    };
  });
}

function buildMonthlyData(workouts: WorkoutLog[], start: string, end: string) {
  const months: Record<string, { label: string; steps: number; workouts: number }> = {};
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  days.forEach((day) => {
    const key = format(day, "yyyy-MM");
    if (!months[key]) months[key] = { label: format(day, "MMM"), steps: 0, workouts: 0 };
  });

  workouts.forEach((w) => {
    const key = w.date.substring(0, 7);
    if (months[key]) {
      months[key].steps += w.totalSteps;
      months[key].workouts += 1;
    }
  });

  return Object.values(months);
}
