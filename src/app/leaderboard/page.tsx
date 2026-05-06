"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getLeaderboard } from "@/lib/firestore";
import { LeaderboardEntry, Period } from "@/types";
import { formatDuration, getPeriodLabel } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import { Trophy, Footprints, Clock, Flame, Zap } from "lucide-react";
import clsx from "clsx";

type SortKey = "steps" | "workouts" | "time" | "streak";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All Time" },
];

export default function LeaderboardPage() {
  return (
    <AuthGuard>
      <Leaderboard />
    </AuthGuard>
  );
}

function Leaderboard() {
  const { firebaseUser, userProfile } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [sortKey, setSortKey] = useState<SortKey>("steps");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userProfile?.familyId) return;
    setLoading(true);
    const data = await getLeaderboard(userProfile.familyId, period);
    setEntries(data);
    setLoading(false);
  }, [userProfile?.familyId, period]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...entries].sort((a, b) => {
    switch (sortKey) {
      case "steps": return b.totalSteps - a.totalSteps;
      case "workouts": return b.totalWorkouts - a.totalWorkouts;
      case "time":
        if (a.bestTimeSeconds === Infinity) return 1;
        if (b.bestTimeSeconds === Infinity) return -1;
        return a.bestTimeSeconds - b.bestTimeSeconds;
      case "streak": return b.streak - a.streak;
    }
  });

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Trophy className="w-5 h-5 text-secondary" />
          <h1 className="text-lg font-bold text-text-primary">Leaderboard</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Period selector */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={clsx(
                "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                period === value ? "bg-secondary text-white" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort by */}
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Rank By</p>
          <div className="grid grid-cols-4 gap-1">
            {[
              { key: "steps" as SortKey, icon: <Footprints className="w-3.5 h-3.5" />, label: "Steps" },
              { key: "workouts" as SortKey, icon: <Zap className="w-3.5 h-3.5" />, label: "Count" },
              { key: "time" as SortKey, icon: <Clock className="w-3.5 h-3.5" />, label: "Time" },
              { key: "streak" as SortKey, icon: <Flame className="w-3.5 h-3.5" />, label: "Streak" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={clsx(
                  "flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all border",
                  sortKey === key
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-surface border-border text-text-secondary"
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Period label */}
        <p className="text-muted text-xs">{getPeriodLabel(period)} · Ranked by {sortKey}</p>

        {/* Rankings */}
        {loading ? (
          <div className="text-center py-12 text-muted">Loading rankings...</div>
        ) : sorted.length === 0 ? (
          <EmptyLeaderboard />
        ) : (
          <div className="space-y-2">
            {sorted.map((entry, i) => (
              <RankCard
                key={entry.userId}
                entry={entry}
                rank={i + 1}
                sortKey={sortKey}
                isCurrentUser={entry.userId === firebaseUser?.uid}
              />
            ))}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}

function RankCard({
  entry,
  rank,
  sortKey,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  sortKey: SortKey;
  isCurrentUser: boolean;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  const primaryValue = () => {
    switch (sortKey) {
      case "steps": return entry.totalSteps.toLocaleString() + " steps";
      case "workouts": return entry.totalWorkouts + " workouts";
      case "time":
        return entry.bestTimeSeconds === Infinity ? "No workouts" : formatDuration(entry.bestTimeSeconds) + " best";
      case "streak": return entry.streak + " day streak";
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
        isCurrentUser
          ? "bg-primary/10 border-primary/30"
          : "bg-surface border-border",
        rank === 1 && "border-yellow-500/30 bg-yellow-500/5"
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className="text-lg font-black text-muted">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-bg shrink-0"
        style={{ backgroundColor: entry.userColor }}
      >
        {entry.userName.charAt(0).toUpperCase()}
      </div>

      {/* Name & stats */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-primary">{entry.userName}</span>
          {isCurrentUser && (
            <span className="text-[10px] bg-surface-2 text-muted px-1.5 py-0.5 rounded-full">you</span>
          )}
        </div>
        <p className="text-xs text-muted mt-0.5">{primaryValue()}</p>
      </div>

      {/* Secondary stats */}
      <div className="text-right">
        {entry.streak > 0 && (
          <div className="flex items-center gap-1 justify-end">
            <Flame className="w-3 h-3 text-secondary" />
            <span className="text-xs font-semibold text-secondary">{entry.streak}</span>
          </div>
        )}
        <p className="text-[10px] text-muted">{entry.totalWorkouts} workouts</p>
      </div>
    </div>
  );
}

function EmptyLeaderboard() {
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
      <div className="text-4xl mb-3">🏆</div>
      <p className="text-text-secondary font-semibold mb-1">No rankings yet</p>
      <p className="text-muted text-sm">Start logging workouts to compete with your family!</p>
    </div>
  );
}
