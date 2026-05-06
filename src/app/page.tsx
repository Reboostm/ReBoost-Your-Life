"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Zap } from "lucide-react";

export default function AuthPage() {
  const { firebaseUser, userProfile, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError("Wrong email or password. Ask your admin to check your account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-bg">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center glow-green">
            <Zap className="w-7 h-7 text-bg" fill="currentColor" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-black text-text-primary leading-none">
              Re<span className="text-primary">Boost</span>
            </h1>
            <p className="text-[11px] text-muted font-semibold tracking-widest uppercase">Your Life</p>
          </div>
        </div>
        <p className="text-text-secondary text-sm mt-2">Family fitness. Friendly competition. 🏆</p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-text-primary mb-5">Welcome back 👋</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3.5 rounded-xl text-base"
              required
              autoComplete="email"
              inputMode="email"
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
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 pr-12 rounded-xl text-base"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-primary text-bg font-black text-base rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed glow-green active:scale-95 transition-transform"
          >
            {submitting ? "Logging in..." : "Let's Go! ⚡"}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          No account yet? Your admin will set you up. 💪
        </p>

        {/* Hidden admin first-time setup link */}
        <p className="text-center mt-2">
          <button
            onClick={() => router.push("/setup")}
            className="text-[10px] text-border hover:text-muted transition-colors"
          >
            ·
          </button>
        </p>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse glow-green">
          <Zap className="w-7 h-7 text-bg" fill="currentColor" />
        </div>
        <p className="text-muted text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
