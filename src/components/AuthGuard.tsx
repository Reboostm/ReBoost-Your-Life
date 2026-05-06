"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Zap } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.replace("/");
      } else if (!userProfile?.familyId) {
        router.replace("/family");
      }
    }
  }, [loading, firebaseUser, userProfile, router]);

  if (loading || !firebaseUser || !userProfile?.familyId) {
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
