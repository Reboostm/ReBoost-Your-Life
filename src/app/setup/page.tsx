"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AVATAR_COLORS } from "@/types";
import { ADMIN_EMAIL } from "@/lib/firebase";
import { Shield, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

export default function SetupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("Admin");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(email, password, displayName.trim(), avatarColor);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        setError("Admin account already exists. Just log in normally.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-bg">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-7 h-7 text-secondary" />
        </div>
        <h1 className="text-xl font-black text-text-primary">First-Time Admin Setup</h1>
        <p className="text-text-secondary text-sm mt-1">Create the admin account. Do this once.</p>
      </div>

      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Your Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Password</label>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">Your Color</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setAvatarColor(color)}
                  className={clsx("w-8 h-8 rounded-full border-2 transition-all", avatarColor === color ? "border-white scale-110" : "border-transparent")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-4 bg-secondary text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50">
            {submitting ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
      </div>

      <button onClick={() => router.replace("/")} className="mt-4 text-xs text-muted hover:text-text-secondary">
        ← Back to login
      </button>
    </div>
  );
}
