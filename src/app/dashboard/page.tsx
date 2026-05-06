"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToFamilyWorkouts, getUserWorkoutsForPeriod } from "@/lib/firestore";
import { WorkoutLog } from "@/types";
import { todayString, formatDuration } from "@/lib/utils";
import WorkoutCard from "@/components/WorkoutCard";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import { Zap, Footprints, Clock, Flame } from "lucide-react";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}

function Dashboard() {
  const { firebaseUser, userProfile } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [todayStats, setTodayStats] = useState({ steps: 0, workouts: 0, bestTime: 0 });

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    if (userProfile?.familyId) {
      // Load family workouts
      const unsub = subscribeToFamilyWorkouts(userProfile.familyId, setWorkouts);
      return unsub;
    } else {
      // Load user's solo workouts for the year
      const today = todayString();
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const yearStart = startOfYear.toISOString().split('T')[0];
      getUserWorkoutsForPeriod(firebaseUser.uid, yearStart, today).then(setWorkouts);
    }
  }, [userProfile?.familyId, firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const today = todayString();
    getUserWorkoutsForPeriod(firebaseUser.uid, today, today).then((logs) => {
      const steps = logs.reduce((sum, w) => sum + w.totalSteps, 0);
      const best = logs.reduce((min, w) => (w.durationSeconds < min ? w.durationSeconds : min), Infinity);
      setTodayStats({ steps, workouts: logs.length, bestTime: best === Infinity ? 0 : best });
    });
  }, [firebaseUser?.uid, workouts]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-bg" fill="currentColor" />
            </div>
            <span className="font-black text-text-primary">
              Re<span className="text-primary">Boost</span>
            </span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-bg"
            style={{ backgroundColor: userProfile?.avatarColor }}
          >
            {userProfile?.displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Greeting */}
        <div>
          <p className="text-muted text-sm">{greeting()},</p>
          <h2 className="text-2xl font-black text-text-primary">{userProfile?.displayName} 👋</h2>
        </div>

        {/* Today's stats */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-secondary" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Today&apos;s Stats</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TodayStat
              icon={<Footprints className="w-4 h-4 text-primary" />}
              value={todayStats.steps.toLocaleString()}
              label="Steps"
            />
            <TodayStat
              icon={<Zap className="w-4 h-4 text-secondary" />}
              value={todayStats.workouts.toString()}
              label="Workouts"
            />
            <TodayStat
              icon={<Clock className="w-4 h-4 text-accent" />}
              value={todayStats.bestTime ? formatDuration(todayStats.bestTime) : "—"}
              label="Best Time"
            />
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            {userProfile?.familyId ? "Family Activity" : "Your Workouts"}
          </h3>
          {workouts.length === 0 ? (
            <EmptyFeed isInFamily={!!userProfile?.familyId} />
          ) : (
            <div className="space-y-3">
              {workouts.map((w) => (
                <WorkoutCard
                  key={w.id}
                  workout={w}
                  currentUserId={firebaseUser?.uid ?? ""}
                  canReact={!!userProfile?.familyId}
                />
              ))}
            </div>
          )}
          {!userProfile?.familyId && (
            <div className="bg-surface-2 border border-border rounded-2xl p-4 mt-4 text-center text-sm">
              <p className="text-text-secondary">You're not in a family yet.</p>
              <p className="text-muted text-xs mt-1">Contact your admin to be added to a group.</p>
            </div>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
}

function TodayStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-surface-2 rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="font-bold text-text-primary text-lg leading-none">{value}</p>
      <p className="text-[10px] text-muted mt-0.5">{label}</p>
    </div>
  );
}

function EmptyFeed({ isInFamily }: { isInFamily: boolean }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
      <div className="text-4xl mb-3">🏃</div>
      <p className="text-text-secondary font-semibold mb-1">No workouts yet</p>
      <p className="text-muted text-sm">
        {isInFamily
          ? "Hit the + button to log your first workout and get this party started!"
          : "Log your first workout and show your family what you're made of!"}
      </p>
    </div>
  );
}
