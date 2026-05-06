"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getSecondaryAuth, ADMIN_EMAIL } from "@/lib/firebase";
import { createUserProfile, addUserToFamily, getFamilyMembers, getUserProfile } from "@/lib/firestore";
import { UserProfile, AVATAR_COLORS } from "@/types";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import { Shield, Plus, X, Users, Trash2, ChevronLeft } from "lucide-react";
import clsx from "clsx";

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPanel />
    </AuthGuard>
  );
}

function AdminPanel() {
  const { firebaseUser, userProfile } = useAuth();
  const router = useRouter();

  const isAdmin = firebaseUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (firebaseUser && !isAdmin) router.replace("/dashboard");
  }, [firebaseUser, isAdmin, router]);

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  const loadMembers = useCallback(async () => {
    if (!userProfile?.familyId) return;
    setLoading(true);
    const data = await getFamilyMembers(userProfile.familyId);
    setMembers(data);
    setLoading(false);
  }, [userProfile?.familyId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-muted hover:text-text-primary">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              <h1 className="text-lg font-bold text-text-primary">Admin Panel</h1>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-primary text-bg px-3 py-2 rounded-xl text-sm font-bold hover:bg-primary-dark active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {successMsg && (
          <div className="bg-primary/20 border border-primary/40 text-primary rounded-2xl px-4 py-3 text-sm font-semibold animate-fade-in">
            ✓ {successMsg}
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Users className="w-4 h-4 text-muted" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Family Members ({members.length})
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-muted text-sm">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-muted text-sm">No members yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <MemberRow key={m.uid} member={m} isAdmin={m.email === ADMIN_EMAIL} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-2 border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Default Login Info</p>
          <p className="text-sm text-text-primary">All new users are created with password <code className="bg-surface-3 px-1.5 py-0.5 rounded text-primary font-mono">123456</code></p>
          <p className="text-xs text-muted mt-1">Tell them to log in and they can use the app right away. They can change their name and avatar color in Settings.</p>
        </div>
      </main>

      {showForm && (
        <AddUserForm
          familyId={userProfile?.familyId ?? ""}
          onClose={() => setShowForm(false)}
          onAdded={(name) => {
            setShowForm(false);
            setSuccessMsg(`${name} has been added! They can log in now.`);
            loadMembers();
            setTimeout(() => setSuccessMsg(""), 4000);
          }}
        />
      )}

      <Navigation />
    </div>
  );
}

function MemberRow({ member, isAdmin }: { member: UserProfile; isAdmin: boolean }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-bg shrink-0"
        style={{ backgroundColor: member.avatarColor }}
      >
        {member.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-text-primary text-sm">{member.displayName}</p>
          {isAdmin && (
            <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
          )}
        </div>
        <p className="text-xs text-muted">{member.email}</p>
      </div>
    </div>
  );
}

function AddUserForm({
  familyId,
  onClose,
  onAdded,
}: {
  familyId: string;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[1]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId) return;
    setError("");
    setSubmitting(true);

    try {
      const secondaryAuth = getSecondaryAuth();
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), "123456");

      await createUserProfile(user.uid, email.trim(), name.trim(), avatarColor);
      await addUserToFamily(user.uid, familyId);

      // Sign out of secondary app immediately so admin stays logged in
      await signOut(secondaryAuth);

      onAdded(name.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        setError("That email already has an account.");
      } else {
        setError("Failed to create user. Try again.");
      }
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
          <h2 className="font-bold text-text-primary">Add Family Member</h2>
          <button onClick={onClose} className="text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dad, Tyler, Mom"
              className="w-full px-4 py-3 rounded-xl text-sm"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="their@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm"
              required
              inputMode="email"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Color</label>
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

          <div className="bg-surface-2 rounded-xl px-4 py-3 text-xs text-muted">
            Default password: <span className="text-primary font-mono font-bold">123456</span> — they can use this to log in right away.
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim()}
            className="w-full py-3.5 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50 active:scale-95 transition-transform"
          >
            {submitting ? "Creating account..." : "Add to Family"}
          </button>
        </form>
      </div>
    </div>
  );
}
