"use client";

import { useState } from "react";
import { WorkoutLog, REACTION_EMOJIS, ReactionEmoji } from "@/types";
import { addReaction, removeReaction, deleteWorkout } from "@/lib/firestore";
import { getRelativeTime, formatDuration } from "@/lib/utils";
import { Footprints, Clock, Repeat, Star, Trash2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  workout: WorkoutLog;
  currentUserId: string;
  canReact: boolean;
  userNameMap?: Record<string, string>;
}

export default function WorkoutCard({ workout, currentUserId, canReact, userNameMap = {} }: Props) {
  const [showReactions, setShowReactions] = useState(false);
  const [optimisticReactions, setOptimisticReactions] = useState(workout.reactions);
  const [deleting, setDeleting] = useState(false);

  const myReaction = optimisticReactions[currentUserId];
  const reactionCounts = Object.values(optimisticReactions).reduce(
    (acc, emoji) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleReact = async (emoji: ReactionEmoji) => {
    setShowReactions(false);
    const next = { ...optimisticReactions };
    if (next[currentUserId] === emoji) {
      delete next[currentUserId];
      setOptimisticReactions(next);
      await removeReaction(workout.id, currentUserId);
    } else {
      next[currentUserId] = emoji;
      setOptimisticReactions(next);
      await addReaction(workout.id, currentUserId, emoji);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${workout.presetName}"?`)) return;
    setDeleting(true);
    try {
      await deleteWorkout(workout.id);
    } catch (err) {
      console.error("Failed to delete workout:", err);
      alert("Failed to delete workout");
    } finally {
      setDeleting(false);
    }
  };

  const isOwn = workout.userId === currentUserId;
  const stepsDisplay = workout.totalSteps.toLocaleString();
  const setsDisplay = workout.sets > 1 ? `×${workout.sets}` : null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 animate-fade-in group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-bg shrink-0"
            style={{ backgroundColor: workout.userColor }}
          >
            {workout.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary text-sm">{workout.userName}</span>
              {isOwn && (
                <span className="text-[10px] bg-surface-2 text-muted px-1.5 py-0.5 rounded-full">you</span>
              )}
              {workout.isPersonalRecord && (
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Star className="w-2.5 h-2.5" fill="currentColor" />
                  PR
                </span>
              )}
            </div>
            <p className="text-xs text-muted">{getRelativeTime(workout.timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{workout.presetName.split(" ")[0]}</span>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
              title="Delete workout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Exercise name */}
      <p className="text-text-secondary text-sm font-medium mb-3">{workout.presetName}</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatChip
          icon={<Footprints className="w-3.5 h-3.5" />}
          value={stepsDisplay}
          label="steps"
          color="text-primary"
        />
        <StatChip
          icon={<Clock className="w-3.5 h-3.5" />}
          value={formatDuration(workout.durationSeconds)}
          label="time"
          color="text-secondary"
        />
        {setsDisplay && (
          <StatChip
            icon={<Repeat className="w-3.5 h-3.5" />}
            value={setsDisplay}
            label="sets"
            color="text-accent"
          />
        )}
      </div>

      {workout.countBothDirections && (
        <p className="text-[11px] text-muted mb-2">
          ↕ {workout.stepsPerSet} up + {workout.stepsPerSet} down × {workout.sets}
        </p>
      )}

      {workout.notes && (
        <p className="text-xs text-muted italic mb-3">&ldquo;{workout.notes}&rdquo;</p>
      )}

      {/* Reactions row */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        {/* Existing reactions */}
        <div className="flex gap-1 flex-wrap flex-1">
          {Object.entries(reactionCounts).map(([emoji, count]) => {
            const reactedUsers = Object.entries(optimisticReactions)
              .filter(([, e]) => e === emoji)
              .map(([uid]) => userNameMap[uid] || uid)
              .join(", ");
            return (
              <button
                key={emoji}
                onClick={() => canReact && !isOwn && handleReact(emoji as ReactionEmoji)}
                className={clsx(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all",
                  myReaction === emoji
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-surface-2 border-border text-text-secondary hover:border-border"
                )}
                title={reactedUsers}
              >
                {emoji} <span>{count}</span>
              </button>
            );
          })}
        </div>

        {/* React button (not on own workouts) */}
        {canReact && !isOwn && (
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-muted hover:text-text-primary text-sm px-2 py-1 rounded-lg hover:bg-surface-2 transition-all"
            >
              {myReaction || "React"}
            </button>
            {showReactions && (
              <div className="absolute bottom-full right-0 mb-2 bg-surface-3 border border-border rounded-2xl p-2 flex gap-2 shadow-lg z-10">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={clsx(
                      "text-xl hover:scale-125 transition-transform p-1 rounded-lg",
                      myReaction === emoji && "bg-primary/20"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-surface-2 rounded-xl px-3 py-2 text-center">
      <div className={clsx("flex items-center justify-center gap-1 mb-0.5", color)}>
        {icon}
        <span className="font-bold text-sm text-text-primary">{value}</span>
      </div>
      <span className="text-[10px] text-muted uppercase tracking-wide">{label}</span>
    </div>
  );
}
