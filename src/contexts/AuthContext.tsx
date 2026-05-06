"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, ADMIN_EMAIL } from "@/lib/firebase";
import { createUserProfile, getUserProfile, createFamily } from "@/lib/firestore";
import { UserProfile, AVATAR_COLORS } from "@/types";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string, avatarColor: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);

        if (user.email === ADMIN_EMAIL && profile && !profile.familyId) {
          await createFamily("Family", user.uid);
          const updatedProfile = await getUserProfile(user.uid);
          setUserProfile(updatedProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    avatarColor: string
  ) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(user.uid, email, displayName, avatarColor);

    if (email === ADMIN_EMAIL) {
      await createFamily("Family", user.uid);
    }

    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, signup, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
