"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createFamily, createUserProfile } from "@/lib/firestore";
import { ADMIN_EMAIL } from "@/lib/firebase";
import { AVATAR_COLORS } from "@/types";
import { Zap } from "lucide-react";
import clsx from "clsx";

export default function FamilyPage() {
  const { firebaseUser, userProfile, loading, refreshProfile, logout } = useAuth();
  const router = useRouter();

  // Step 1: fix missing profile (signup Firestore write failed)
  // Step 2: create family (admin only)
  const [step, setStep] = useState<"profile" | "family">("profile");

  const [displayName, setDisplayName] = useState("Admin");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [familyName, setFamilyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/");
    if (!loading && userProfile?.familyId) router.replace("/dashboard");
  }, [loading, firebaseUser, userProfile, router]);

  useEffect(() => {
    // If profile exists, skip profile step
    if (userProfile) setStep("family");
  }, [userProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError("");
    setSubmitting(true);
    try {
      await createUserProfile(firebaseUser.uid, firebaseUser.email ?? "", displayName.trim(), avatarColor);
      await refreshProfile();
      setStep("family");
    } catch {
      setError("Failed to save profile. Make sure Firestore rules are published.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError("");
    setSubmitting(true);
    try {
      await createFamily(familyName.trim(), firebaseUser.uid);
      await refreshProfile();
      router.push("/dashboard");
    } catch {
      setError("Failed to create family. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = firebaseUser?.email === ADMIN_EMAIL;

  if (loading || !firebaseUser) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-primary" fill="currentColor" />
          <h1 className="text-xl font-black text-text-primary">
            Welcome{userProfile?.displayName ? `, ${userProfile.displayName}` : ""}!
          </h1>
        </div>
        <p className="text-text-secondary text-sm">
          {step === "profile" ? "First, set up your profile" : "Create your family group"}
        </p>
      </div>

      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6">
        {step === "profile" ? (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Admin, Dad, Mom"
                className="w-full px-4 py-3 rounded-xl text-sm"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Your Color</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={clsx(
                      "w-9 h-9 rounded-full border-2 transition-all active:scale-90",
                      avatarColor === color ? "border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            {error && <ErrorBox msg={error} />}
            <button
              type="submit"
              disabled={submitting || !displayName.trim()}
              className="w-full py-3.5 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50 active:scale-95 transition-transform"
            >
              {submitting ? "Saving..." : "Save Profile →"}
            </button>
          </form>
        ) : isAdmin ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Family Name</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Johnson Crew"
                className="w-full px-4 py-3 rounded-xl text-sm"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-muted">After creating, add members from the Admin Panel in Settings.</p>
            {error && <ErrorBox msg={error} />}
            <button
              type="submit"
              disabled={submitting || !familyName.trim()}
              className="w-full py-3.5 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50 glow-green active:scale-95 transition-transform"
            >
              {submitting ? "Creating..." : "Create Family"}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mx-auto">
              <Zap className="w-7 h-7 text-primary" fill="currentColor" />
            </div>
            <p className="text-text-primary font-semibold">You&apos;re almost in!</p>
            <p className="text-text-secondary text-sm">Ask your admin to add you to the family group. Once they do, refresh this page.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => refreshProfile().then(() => {})}
                className="flex-1 px-5 py-2.5 bg-surface-2 text-text-primary text-sm font-semibold rounded-xl hover:bg-surface-3 active:scale-95 transition-transform"
              >
                Refresh
              </button>
              <button
                onClick={async () => {
                  await logout();
                  router.replace("/");
                }}
                className="flex-1 px-5 py-2.5 bg-red-900/30 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-900/50 active:scale-95 transition-transform"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
      {msg}
    </div>
  );
}
