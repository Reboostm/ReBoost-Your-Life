"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Zap } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/");
    }
  }, [loading, firebaseUser, router]);

  if (loading || !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <Zap className="w-6 h-6 text-bg" fill="currentColor" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
