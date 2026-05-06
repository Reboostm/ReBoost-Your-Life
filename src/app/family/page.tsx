"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createFamily, joinFamily } from "@/lib/firestore";
import { Users, Plus, Hash, Zap } from "lucide-react";

export default function FamilyPage() {
  const { firebaseUser, userProfile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/");
    if (!loading && userProfile?.familyId) router.replace("/dashboard");
  }, [loading, firebaseUser, userProfile, router]);

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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError("");
    setSubmitting(true);
    try {
      const family = await joinFamily(inviteCode.trim(), firebaseUser.uid);
      if (!family) {
        setError("Invalid invite code. Check with your family member.");
      } else {
        await refreshProfile();
        router.push("/dashboard");
      }
    } catch {
      setError("Failed to join family. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !firebaseUser) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-primary" fill="currentColor" />
          <h1 className="text-xl font-black text-text-primary">
            Welcome, <span className="text-primary">{userProfile?.displayName}</span>!
          </h1>
        </div>
        <p className="text-text-secondary text-sm">Set up your family crew to get started</p>
      </div>

      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6">
        {/* Tabs */}
        <div className="flex bg-surface-2 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab("create"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === "create" ? "bg-primary text-bg" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
          <button
            onClick={() => { setTab("join"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              tab === "join" ? "bg-primary text-bg" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Users className="w-4 h-4" />
            Join
          </button>
        </div>

        {tab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. The Johnson Crew"
                className="w-full px-4 py-3 rounded-xl text-sm"
                required
              />
            </div>
            <p className="text-xs text-muted">
              You&apos;ll get a 6-letter invite code to share with your family.
            </p>
            {error && <ErrorBox msg={error} />}
            <button
              type="submit"
              disabled={submitting || !familyName.trim()}
              className="w-full py-3.5 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50 glow-green"
            >
              {submitting ? "Creating..." : "Create Family"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Invite Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm font-mono tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              Get this code from a family member who already created a group.
            </p>
            {error && <ErrorBox msg={error} />}
            <button
              type="submit"
              disabled={submitting || inviteCode.length !== 6}
              className="w-full py-3.5 bg-secondary text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50 glow-orange"
            >
              {submitting ? "Joining..." : "Join Family"}
            </button>
          </form>
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
