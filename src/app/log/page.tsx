"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getPresets, logWorkout } from "@/lib/firestore";
import { ExercisePreset } from "@/types";
import { parseDuration, formatDuration, todayString } from "@/lib/utils";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import { CheckCircle, ChevronLeft, Info } from "lucide-react";
import clsx from "clsx";

export default function LogPage() {
  return (
    <AuthGuard>
      <LogWorkout />
    </AuthGuard>
  );
}

function LogWorkout() {
  const { firebaseUser, userProfile } = useAuth();
  const router = useRouter();

  const [presets, setPresets] = useState<ExercisePreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<ExercisePreset | null>(null);
  const [sets, setSets] = useState(1);
  const [durationInput, setDurationInput] = useState("");
  const [notes, setNotes] = useState("");
  const [durationError, setDurationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userProfile?.familyId) return;
    getPresets(userProfile.familyId).then(setPresets);
  }, [userProfile?.familyId]);

  const parsedDuration = parseDuration(durationInput);
  const totalSteps = selectedPreset
    ? selectedPreset.stepsPerSet * sets * (selectedPreset.countBothDirections ? 2 : 1)
    : 0;

  const handleDurationBlur = () => {
    if (!durationInput) return setDurationError("");
    if (parsedDuration === null) {
      setDurationError('Use format like "4:03" or "4m3s"');
    } else {
      setDurationError("");
      setDurationInput(formatDuration(parsedDuration));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPreset || !firebaseUser || !userProfile?.familyId) return;

    const dur = parseDuration(durationInput);
    if (dur === null) {
      setDurationError('Use format like "4:03" or "4m3s"');
      return;
    }

    setSubmitting(true);
    try {
      await logWorkout({
        userId: firebaseUser.uid,
        userName: userProfile.displayName,
        userColor: userProfile.avatarColor,
        familyId: userProfile.familyId,
        presetId: selectedPreset.id,
        presetName: `${selectedPreset.icon} ${selectedPreset.name}`,
        sets,
        stepsPerSet: selectedPreset.stepsPerSet,
        totalSteps,
        countBothDirections: selectedPreset.countBothDirections,
        durationSeconds: dur,
        durationDisplay: formatDuration(dur),
        date: todayString(),
        notes: notes.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      alert("Failed to log workout. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 glow-green">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-2">Logged! 🔥</h2>
          {selectedPreset && (
            <p className="text-text-secondary">
              {totalSteps.toLocaleString()} steps · {parsedDuration ? formatDuration(parsedDuration) : durationInput}
            </p>
          )}
          <p className="text-muted text-sm mt-2">Heading back to the feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="text-muted hover:text-text-primary">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Log Workout</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Exercise selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
              Exercise
            </label>
            {presets.length === 0 ? (
              <div className="bg-surface border border-dashed border-border rounded-2xl p-6 text-center">
                <p className="text-text-secondary text-sm mb-2">No exercises set up yet</p>
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  Go to Settings to add one →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPreset(p)}
                    className={clsx(
                      "p-4 rounded-2xl border text-left transition-all",
                      selectedPreset?.id === p.id
                        ? "border-primary bg-primary/10 glow-green"
                        : "border-border bg-surface hover:border-surface-3"
                    )}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <p className="font-semibold text-text-primary text-sm">{p.name}</p>
                    <p className="text-muted text-xs mt-0.5">
                      {p.stepsPerSet} steps{p.countBothDirections ? " ↕" : " ↑"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPreset && (
            <>
              {/* Sets */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Sets (how many times did you do it?)
                </label>
                <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4">
                  <button
                    type="button"
                    onClick={() => setSets(Math.max(1, sets - 1))}
                    className="w-10 h-10 rounded-xl bg-surface-2 text-text-primary font-bold text-xl flex items-center justify-center hover:bg-surface-3 transition-colors"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-black text-text-primary">{sets}</span>
                    <p className="text-muted text-xs mt-1">
                      = {(selectedPreset.stepsPerSet * sets * (selectedPreset.countBothDirections ? 2 : 1)).toLocaleString()} total steps
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSets(sets + 1)}
                    className="w-10 h-10 rounded-xl bg-surface-2 text-text-primary font-bold text-xl flex items-center justify-center hover:bg-surface-3 transition-colors"
                  >
                    +
                  </button>
                </div>
                {selectedPreset.countBothDirections && (
                  <div className="flex items-start gap-2 mt-2 px-1">
                    <Info className="w-3.5 h-3.5 text-muted mt-0.5 shrink-0" />
                    <p className="text-xs text-muted">
                      Counting up + down: {selectedPreset.stepsPerSet} × 2 × {sets} = {totalSteps.toLocaleString()} steps
                    </p>
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Total Time
                </label>
                <input
                  type="text"
                  value={durationInput}
                  onChange={(e) => { setDurationInput(e.target.value); setDurationError(""); }}
                  onBlur={handleDurationBlur}
                  placeholder="4:03  or  4m3s  or  243s"
                  className="w-full px-4 py-3.5 rounded-xl text-lg font-mono text-center"
                  required
                />
                {durationError && <p className="text-red-400 text-xs mt-1.5 px-1">{durationError}</p>}
                {parsedDuration && !durationError && (
                  <p className="text-primary text-xs mt-1.5 px-1 font-medium">
                    ✓ {formatDuration(parsedDuration)} ({parsedDuration}s)
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Feeling strong today!"
                  className="w-full px-4 py-3 rounded-xl text-sm"
                  maxLength={120}
                />
              </div>

              {/* Summary */}
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{selectedPreset.name}</span>
                  <span className="font-bold text-text-primary">{totalSteps.toLocaleString()} steps</span>
                </div>
                {parsedDuration && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-text-secondary">Time</span>
                    <span className="font-bold text-text-primary">{formatDuration(parsedDuration)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-text-secondary">Date</span>
                  <span className="font-bold text-text-primary">Today</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !durationInput || !parsedDuration}
                className="w-full py-4 bg-primary text-bg font-black text-base rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed glow-green"
              >
                {submitting ? "Logging..." : "Log It! 🔥"}
              </button>
            </>
          )}
        </form>
      </main>

      <Navigation />
    </div>
  );
}
