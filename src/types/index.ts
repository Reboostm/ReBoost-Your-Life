export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  familyId: string | null;
  avatarColor: string;
  createdAt: Date;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
}

export interface ExercisePreset {
  id: string;
  name: string;
  stepsPerSet: number;
  countBothDirections: boolean;
  icon: string;
  familyId: string;
  createdBy: string;
  createdAt: Date;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  familyId: string;
  presetId: string;
  presetName: string;
  sets: number;
  stepsPerSet: number;
  totalSteps: number;
  countBothDirections: boolean;
  durationSeconds: number;
  durationDisplay: string;
  date: string;
  timestamp: Date;
  notes: string;
  reactions: Record<string, string>;
  isPersonalRecord: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  familyId: string;
  title: string;
  type: "steps" | "workouts" | "seconds";
  target: number;
  period: "week" | "month" | "year";
  startDate: string;
  endDate: string;
  createdAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userColor: string;
  totalSteps: number;
  totalWorkouts: number;
  bestTimeSeconds: number;
  bestTimePreset: string;
  streak: number;
}

export type Period = "today" | "week" | "month" | "year" | "all";
export type ReactionEmoji = "👍" | "🔥" | "💪" | "⭐";

export const REACTION_EMOJIS: ReactionEmoji[] = ["👍", "🔥", "💪", "⭐"];

export const AVATAR_COLORS = [
  "#00e676",
  "#ff6b35",
  "#7c3aed",
  "#06b6d4",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#3b82f6",
];

export const PRESET_ICONS = ["🏃", "🧗", "🚴", "🏊", "⛰️", "🦵", "💪", "🔥"];
