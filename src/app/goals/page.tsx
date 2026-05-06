"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createGoal, getUserGoals, deleteGoal, getUserWorkoutsForPeriod } from "@/lib/firestore";
import { Goal, WorkoutLog } from "@/types";
import { getDateRange, formatDuration } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import { Target, Plus, Trash2, X, Footprints, Zap, Clock } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";

export default function GoalsPage() {
  return (
    <AuthGuard>
      <Goals />
    </AuthGuard>
  );
}

type GoalWithProgress = Goal & { current: number; pct: number };

function Goals() {
  const { firebaseUser, userProfile } = useAuth();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    if (!firebaseUser?.uid || !userProfile?.familyId) return;
    setLoading(true);
    const raw = await getUserGoals(firebaseUser.uid, userProfile.familyId);

    const withProgress = await Promise.all(
      raw.map(async (g) => {
        const workouts = await getUserWorkoutsForPeriod(firebaseUser.uid, g.startDate, g.endDate);
        let current = 0;
        switch (g.type) {
          case "steps": current = workouts.reduce((s, w) => s + w.totalSteps, 0); break;
          case "workouts": current = workouts.length; break;
          case "seconds": current = workouts.reduce((s, w) => s + w.durationSeconds, 0); break;
        }
        return { ...g, current, pct: Math.min(100, Math.round((current / g.target) * 100)) };
      })
    );
    setGoals(withProgress);
    setLoading(false);
  }, [firebaseUser?.uid, userProfile?.familyId]);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <h1 className="text-lg font-bold text-text-primary">Goals</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-bg px-3 py-2 rounded-xl text-sm font-bold hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted">Loading goals...</div>
        ) : goals.length === 0 ? (
          <EmptyGoals onAdd={() => setShowForm(true)} />
        ) : (
          goals.map((g) => (
            <GoalCard key={g.id} goal={g} onDelete={handleDelete} />
          ))
        )}
      </main>

      {showForm && (
        <GoalForm
          userId={firebaseUser?.uid ?? ""}
          familyId={userProfile?.familyId ?? ""}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); loadGoals(); }}
        />
      )}

      <Navigation />
    </div>
  );
}

function GoalCard({ goal, onDelete }: { goal: GoalWithProgress; onDelete: (id: string) => void }) {
  const done = goal.pct >= 100;
  const typeIcon = goal.type === "steps"
    ? <Footprints className="w-4 h-4" />
    : goal.type === "workouts"
    ? <Zap className="w-4 h-4" />
    : <Clock className="w-4 h-4" />;

  const formatValue = (v: number) => {
    if (goal.type === "steps") return v.toLocaleString() + " steps";
    if (goal.type === "workouts") return v + " workouts";
    return formatDuration(v);
  };

  return (
    <div
      className={clsx(
        "bg-surface border rounded-2xl p-4",
        done ? "border-primary/40" : "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", done ? "bg-primary/20 text-primary" : "bg-surface-2 text-muted")}>
            {typeIcon}
          </div>
          <div>
            <p className="font-bold text-text-primary text-sm">{goal.title}</p>
            <p className="text-xs text-muted capitalize">{goal.period} goal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {done && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">Done! 🎉</span>}
          <button
            onClick={() => onDelete(goal.id)}
            className="text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-text-secondary">{formatValue(goal.current)}</span>
          <span className="text-muted">/ {formatValue(goal.target)}</span>
        </div>
        <div className="h-2.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-700 progress-fill",
              done ? "bg-primary" : "bg-accent"
            )}
            style={{ width: `${goal.pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className={clsx("font-semibold", done ? "text-primary" : "text-accent")}>{goal.pct}%</span>
          <span className="text-muted">
            {goal.startDate} → {goal.endDate}
          </span>
        </div>
      </div>
    </div>
  );
}

function GoalForm({
  userId,
  familyId,
  onClose,
  onCreated,
}: {
  userId: string;
  familyId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"steps" | "workouts">("steps");
  const [target, setTarget] = useState("");
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [submitting, setSubmitting] = useState(false);

  const { start, end } = getDateRange(period);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !familyId) return;
    setSubmitting(true);
    try {
      await createGoal({
        userId,
        familyId,
        title: title.trim(),
        type,
        target: parseInt(target),
        period,
        startDate: start,
        endDate: end,
      });
      onCreated();
    } catch {
      alert("Failed to create goal. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center px-4 pb-4" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-3xl p-5 w-full max-w-sm animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-primary">New Goal</h2>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Crush 10,000 steps this week!"
              className="w-full px-4 py-3 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Type</label>
              <div className="flex gap-1">
                {(["steps", "workouts"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={clsx(
                      "flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all",
                      type === t ? "bg-primary text-bg" : "bg-surface-2 text-text-secondary"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as "week" | "month" | "year")}
                className="w-full px-3 py-2 rounded-xl text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Target ({type === "steps" ? "steps" : "workouts"})
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={type === "steps" ? "10000" : "5"}
              className="w-full px-4 py-3 rounded-xl text-sm"
              min="1"
              required
            />
          </div>

          <p className="text-xs text-muted">
            Tracking {period === "week" ? "this week" : period === "month" ? "this month" : "this year"} ({start} → {end})
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Set Goal 🎯"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyGoals({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-surface border border-dashed border-border rounded-2xl p-8 text-center">
      <div className="text-4xl mb-3">🎯</div>
      <p className="text-text-secondary font-semibold mb-1">No goals set</p>
      <p className="text-muted text-sm mb-4">Set a step or workout goal to track your progress!</p>
      <button
        onClick={onAdd}
        className="bg-primary text-bg px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark"
      >
        Add First Goal
      </button>
    </div>
  );
}
