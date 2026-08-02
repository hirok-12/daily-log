"use client";

import { useTransition } from "react";
import { deleteGoal, setGoalResult } from "@/app/actions";
import type { Goal, GoalResult } from "@/db/schema";

export const RESULT_LABEL: Record<GoalResult, string> = {
  pending: "—",
  done: "⚪︎",
  partial: "△",
  missed: "×",
};

const MARKS: { value: GoalResult; label: string; className: string }[] = [
  { value: "done", label: "⚪︎", className: "text-matcha border-matcha" },
  { value: "partial", label: "△", className: "text-kin border-kin" },
  { value: "missed", label: "×", className: "text-shu border-shu" },
];

export default function GoalMarks({ goal }: { goal: Goal }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className={`flex items-center gap-2 ${pending ? "opacity-50" : ""}`}>
      {MARKS.map((mark) => {
        const active = goal.result === mark.value;
        return (
          <button
            key={mark.value}
            type="button"
            title={mark.label}
            onClick={() =>
              startTransition(() =>
                setGoalResult(goal.id, active ? "pending" : mark.value)
              )
            }
            className={`w-8 h-8 rounded-full border text-sm leading-none transition-all cursor-pointer ${
              active
                ? `${mark.className} bg-paper scale-110`
                : "text-ink-faint border-line hover:border-ink-soft"
            }`}
          >
            {mark.label}
          </button>
        );
      })}
      <button
        type="button"
        title="削除"
        onClick={() => {
          if (confirm("この目標を削除しますか？")) {
            startTransition(() => deleteGoal(goal.id));
          }
        }}
        className="ml-1 text-ink-faint hover:text-shu text-xs transition-colors cursor-pointer"
      >
        削除
      </button>
    </div>
  );
}
