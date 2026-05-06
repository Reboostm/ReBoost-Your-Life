"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  getFamily,
  updateUserProfile,
} from "@/lib/firestore";
import { ExercisePreset, Family, AVATAR_COLORS, PRESET_ICONS } from "@/types";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import { Settings, Plus, Trash2, Edit2, X, Check, LogOut, ChevronRight, ToggleLeft, ToggleRight, Shield, Dumbbell, Calendar, Brain, Rocket } from "lucide-react";
import { ADMIN_EMAIL } from "@/lib/firebase";
import clsx from "clsx";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsView />
    </AuthGuard>
  );
}

function SettingsView() {
  const { firebaseUser, userProfile, logout, refreshProfile } = useAuth();
  const router = useRouter();

  const [presets, setPresets] = useState<ExercisePreset[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ExercisePreset | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile?.displayName ?? "");

  const loadData = useCallback(async () => {
    if (!userProfile?.familyId) return;
    const [p, f] = await Promise.all([
      getPresets(userProfile.familyId),
      getFamily(userProfile.familyId),
    ]);
    setPresets(p);
    setFamily(f);
  }, [userProfile?.familyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveName = async () => {
    if (!firebaseUser?.uid || !nameInput.trim()) return;
    await updateUserProfile(firebaseUser.uid, { displayName: nameInput.trim() });
    await refreshProfile();
    setEditingName(false);
  };

  const handleColorChange = async (color: string) => {
    if (!firebaseUser?.uid) return;
    await updateUserProfile(firebaseUser.uid, { avatarColor: color });
    await refreshProfile();
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm("Delete this exercise? Past workouts won't be affected.")) return;
    await deletePreset(id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Settings className="w-5 h-5 text-muted" />
          <h1 className="text-lg font-bold text-text-primary">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* Profile */}
        <Section title="Profile">
          <div className="p-4 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-bg"
                style={{ backgroundColor: userProfile?.avatarColor }}
              >
                {userProfile?.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="text-primary">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditingName(false)} className="text-muted">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-text-primary">{userProfile?.displayName}</p>
                    <button onClick={() => { setEditingName(true); setNameInput(userProfile?.displayName ?? ""); }} className="text-muted hover:text-text-primary">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted mt-0.5">{userProfile?.email}</p>
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Your Color</p>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={clsx(
                      "w-9 h-9 rounded-full border-2 transition-all",
                      userProfile?.avatarColor === color ? "border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Family */}
        {family && (
          <Section title="Family">
            <div className="p-4">
              <p className="text-text-primary font-semibold mb-1">{family.name}</p>
              <p className="text-xs text-muted">{family.members.length} member{family.members.length !== 1 ? "s" : ""}</p>
            </div>
          </Section>
        )}

        {/* Exercise Presets */}
        <Section
          title="Exercise Presets"
          action={
            <button
              onClick={() => { setEditingPreset(null); setShowPresetForm(true); }}
              className="flex items-center gap-1 text-primary text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          }
        >
          <div className="divide-y divide-border">
            {presets.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted text-sm">No exercises yet. Add one to start logging!</p>
              </div>
            ) : (
              presets.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <span className="text-xl w-8">{p.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary text-sm">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.stepsPerSet} steps{p.countBothDirections ? " (both ways)" : " (up only)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingPreset(p); setShowPresetForm(true); }}
                      className="text-muted hover:text-text-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePreset(p.id)}
                      className="text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Admin panel link */}
        {firebaseUser?.email === ADMIN_EMAIL && (
          <button
            onClick={() => router.push("/admin")}
            className="w-full flex items-center justify-between bg-surface border border-secondary/30 rounded-2xl p-4 text-secondary hover:border-secondary/60 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold">Admin Panel</p>
                <p className="text-xs text-muted">Manage family members</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>
        )}

        {/* Phase 2 Roadmap */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Rocket className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Coming in Phase 2 🚀</span>
          </div>
          <div className="divide-y divide-border">
            <RoadmapItem
              icon={<Dumbbell className="w-4 h-4 text-primary" />}
              title="Guided Workouts"
              desc="Daily workout plans — the app tells you exactly what to do"
            />
            <RoadmapItem
              icon={<Calendar className="w-4 h-4 text-secondary" />}
              title="Weekly Schedule Builder"
              desc="Set a training schedule: legs Mon, upper Wed, etc."
            />
            <RoadmapItem
              icon={<Brain className="w-4 h-4 text-accent" />}
              title="AI Workout Coach"
              desc="Personalized plans based on your goals & history"
            />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between bg-surface border border-border rounded-2xl p-4 text-red-400 hover:border-red-500/30 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Log Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted" />
        </button>

        <div className="pb-2 text-center">
          <p className="text-xs text-muted">ReBoost Your Life · Built for champions 🏆</p>
        </div>
      </main>

      {showPresetForm && (
        <PresetForm
          familyId={userProfile?.familyId ?? ""}
          createdBy={firebaseUser?.uid ?? ""}
          editing={editingPreset}
          onClose={() => setShowPresetForm(false)}
          onSaved={() => { setShowPresetForm(false); loadData(); }}
        />
      )}

      <Navigation />
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function PresetForm({
  familyId,
  createdBy,
  editing,
  onClose,
  onSaved,
}: {
  familyId: string;
  createdBy: string;
  editing: ExercisePreset | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [steps, setSteps] = useState(editing?.stepsPerSet?.toString() ?? "");
  const [countBoth, setCountBoth] = useState(editing?.countBothDirections ?? true);
  const [icon, setIcon] = useState(editing?.icon ?? PRESET_ICONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await updatePreset(editing.id, {
          name: name.trim(),
          stepsPerSet: parseInt(steps),
          countBothDirections: countBoth,
          icon,
        });
      } else {
        await createPreset(familyId, createdBy, {
          name: name.trim(),
          stepsPerSet: parseInt(steps),
          countBothDirections: countBoth,
          icon,
        });
      }
      onSaved();
    } catch {
      alert("Failed to save. Try again.");
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
          <h2 className="font-bold text-text-primary">{editing ? "Edit Exercise" : "New Exercise"}</h2>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={clsx(
                    "text-xl w-10 h-10 rounded-xl border-2 transition-all",
                    icon === i ? "border-primary bg-primary/10" : "border-border bg-surface-2"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stairs at the Park"
              className="w-full px-4 py-3 rounded-xl text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Steps Per Set</label>
            <input
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="258"
              className="w-full px-4 py-3 rounded-xl text-sm"
              min="1"
              required
            />
          </div>

          {/* Count both directions toggle */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Count Both Directions?</label>
            <button
              type="button"
              onClick={() => setCountBoth(!countBoth)}
              className={clsx(
                "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                countBoth ? "border-primary/40 bg-primary/10" : "border-border bg-surface-2"
              )}
            >
              <div>
                <p className="text-sm font-semibold text-text-primary text-left">
                  {countBoth ? "Yes — count up + down" : "No — up only"}
                </p>
                <p className="text-xs text-muted text-left mt-0.5">
                  {countBoth
                    ? `${steps || "?"} × 2 = ${steps ? parseInt(steps) * 2 : "?"} total per set`
                    : `${steps || "?"} steps per set`}
                </p>
              </div>
              {countBoth ? (
                <ToggleRight className="w-6 h-6 text-primary" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-muted" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !steps}
            className="w-full py-3.5 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? "Saving..." : editing ? "Save Changes" : "Add Exercise"}
          </button>
        </form>
      </div>
    </div>
  );
}

function RoadmapItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
