import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  UserProfile,
  Family,
  ExercisePreset,
  WorkoutLog,
  Goal,
  LeaderboardEntry,
  Period,
} from "@/types";
import { generateInviteCode, getDateRange } from "./utils";

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  avatarColor: string
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    displayName,
    avatarColor,
    familyId: null,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, createdAt: data.createdAt?.toDate() } as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, "displayName" | "avatarColor">>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), updates);
}

export async function addUserToFamily(uid: string, familyId: string): Promise<void> {
  // Check if family doc exists; if not, recreate it
  const familyDoc = await getDoc(doc(db, "families", familyId));
  if (!familyDoc.exists()) {
    await setDoc(doc(db, "families", familyId), {
      name: "Family",
      members: [uid],
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(doc(db, "families", familyId), { members: arrayUnion(uid) });
  }
  await updateDoc(doc(db, "users", uid), { familyId });
}

// ─── Family ───────────────────────────────────────────────────────────────────

export async function createFamily(name: string, creatorUid: string): Promise<Family> {
  const ref = await addDoc(collection(db, "families"), {
    name,
    members: [creatorUid],
    createdBy: creatorUid,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "users", creatorUid), { familyId: ref.id });
  return {
    id: ref.id,
    name,
    inviteCode: "",
    members: [creatorUid],
    createdBy: creatorUid,
    createdAt: new Date(),
  };
}

export async function joinFamily(inviteCode: string, uid: string): Promise<Family | null> {
  const q = query(collection(db, "families"), where("inviteCode", "==", inviteCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const familyDoc = snap.docs[0];
  const family = { id: familyDoc.id, ...familyDoc.data() } as Family;

  if (!family.members.includes(uid)) {
    await updateDoc(doc(db, "families", family.id), {
      members: [...family.members, uid],
    });
  }
  await updateDoc(doc(db, "users", uid), { familyId: family.id });
  return family;
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Family;
}

export async function getFamilyMembers(familyId: string): Promise<UserProfile[]> {
  const family = await getFamily(familyId);
  if (!family) return [];
  const profiles = await Promise.all(family.members.map(getUserProfile));
  return profiles.filter(Boolean) as UserProfile[];
}

// ─── Exercise Presets ─────────────────────────────────────────────────────────

export async function createPreset(
  familyId: string,
  createdBy: string,
  data: Omit<ExercisePreset, "id" | "familyId" | "createdBy" | "createdAt">
): Promise<ExercisePreset> {
  const ref = await addDoc(collection(db, "presets"), {
    ...data,
    familyId,
    createdBy,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, familyId, createdBy, createdAt: new Date(), ...data };
}

export async function getPresets(familyId: string): Promise<ExercisePreset[]> {
  const q = query(
    collection(db, "presets"),
    where("familyId", "==", familyId),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExercisePreset));
}

export async function updatePreset(
  id: string,
  updates: Partial<Omit<ExercisePreset, "id" | "familyId" | "createdBy" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "presets", id), updates);
}

export async function deletePreset(id: string): Promise<void> {
  await deleteDoc(doc(db, "presets", id));
}

// ─── Workout Logs ─────────────────────────────────────────────────────────────

export async function logWorkout(
  workout: Omit<WorkoutLog, "id" | "timestamp" | "reactions" | "isPersonalRecord">
): Promise<string> {
  // Check if this is a personal record (best time for this preset)
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", workout.userId),
    where("presetId", "==", workout.presetId),
    orderBy("durationSeconds", "asc"),
    limit(1)
  );
  const existing = await getDocs(q);
  const isPersonalRecord =
    existing.empty || existing.docs[0].data().durationSeconds > workout.durationSeconds;

  const ref = await addDoc(collection(db, "workouts"), {
    ...workout,
    reactions: {},
    isPersonalRecord,
    timestamp: serverTimestamp(),
  });
  return ref.id;
}

export async function addReaction(
  workoutId: string,
  userId: string,
  emoji: string
): Promise<void> {
  await updateDoc(doc(db, "workouts", workoutId), {
    [`reactions.${userId}`]: emoji,
  });
}

export async function removeReaction(workoutId: string, userId: string): Promise<void> {
  const snap = await getDoc(doc(db, "workouts", workoutId));
  if (!snap.exists()) return;
  const reactions = { ...snap.data().reactions };
  delete reactions[userId];
  await updateDoc(doc(db, "workouts", workoutId), { reactions });
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  await deleteDoc(doc(db, "workouts", workoutId));
}

function docToWorkout(d: { id: string; data: () => Record<string, unknown> }): WorkoutLog {
  const data = d.data();
  return {
    ...data,
    id: d.id,
    timestamp: (data.timestamp as Timestamp)?.toDate() ?? new Date(),
  } as WorkoutLog;
}

export function subscribeToFamilyWorkouts(
  familyId: string,
  cb: (workouts: WorkoutLog[]) => void,
  limitCount = 50
): () => void {
  const q = query(
    collection(db, "workouts"),
    where("familyId", "==", familyId),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map(docToWorkout)));
}

export async function getWorkoutsForPeriod(
  familyId: string,
  startDate: string,
  endDate: string
): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, "workouts"),
    where("familyId", "==", familyId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToWorkout);
}

export async function getUserWorkoutsForPeriod(
  userId: string,
  startDate: string,
  endDate: string
): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToWorkout);
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(
  familyId: string,
  period: Period
): Promise<LeaderboardEntry[]> {
  const { start, end } = getDateRange(period);
  const workouts = await getWorkoutsForPeriod(familyId, start, end);
  const members = await getFamilyMembers(familyId);

  const map = new Map<string, LeaderboardEntry>();

  members.forEach((m) => {
    map.set(m.uid, {
      userId: m.uid,
      userName: m.displayName,
      userColor: m.avatarColor,
      totalSteps: 0,
      totalWorkouts: 0,
      bestTimeSeconds: Infinity,
      bestTimePreset: "",
      streak: 0,
    });
  });

  workouts.forEach((w) => {
    const entry = map.get(w.userId);
    if (!entry) return;
    entry.totalSteps += w.totalSteps;
    entry.totalWorkouts += 1;
    if (w.durationSeconds < entry.bestTimeSeconds) {
      entry.bestTimeSeconds = w.durationSeconds;
      entry.bestTimePreset = w.presetName;
    }
  });

  // Calculate streaks for each user
  for (const member of members) {
    const entry = map.get(member.uid);
    if (!entry) continue;
    entry.streak = await calculateStreak(member.uid);
  }

  return Array.from(map.values()).filter((e) => e.totalWorkouts > 0 || period === "all");
}

async function calculateStreak(userId: string): Promise<number> {
  const q = query(
    collection(db, "workouts"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(60)
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const dates = Array.from(new Set(snap.docs.map((d) => d.data().date as string))).sort().reverse();
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];
    if (dates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function createGoal(goal: Omit<Goal, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "goals"), {
    ...goal,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserGoals(userId: string, familyId: string): Promise<Goal[]> {
  const q = query(
    collection(db, "goals"),
    where("userId", "==", userId),
    where("familyId", "==", familyId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
}

export async function deleteGoal(id: string): Promise<void> {
  await deleteDoc(doc(db, "goals", id));
}
