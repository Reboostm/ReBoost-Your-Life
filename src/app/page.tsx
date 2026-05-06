"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AVATAR_COLORS } from "@/types";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const { firebaseUser, userProfile, loading, signup, login } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && firebaseUser) {
      if (!userProfile?.familyId) {
        router.replace("/family");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [loading, firebaseUser, userProfile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!displayName.trim()) throw new Error("Name is required");
        await signup(email, password, displayName.trim(), avatarColor);
        router.push("/family");
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(
        msg.includes("email-already-in-use")
          ? "Email already in use"
          : msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")
          ? "Invalid email or password"
          : msg.includes("weak-password")
          ? "Password must be at least 6 characters"
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-green">
            <Zap className="w-6 h-6 text-bg" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black text-text-primary">
            Re<span className="text-primary">Boost</span>
          </h1>
        </div>
        <p className="text-text-secondary text-sm">Family fitness. Friendly competition.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6">
        {/* Tab toggle */}
        <div className="flex bg-surface-2 rounded-xl p-1 mb-6">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-primary text-bg"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Dad, Mom, Tyler"
                className="w-full px-4 py-3 rounded-xl text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                Pick Your Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      avatarColor === color ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed glow-green"
          >
            {submitting ? "..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-muted text-center max-w-xs">
        By signing up, you agree to be part of the most competitive family on the block.
      </p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <Zap className="w-7 h-7 text-bg" fill="currentColor" />
        </div>
        <p className="text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
