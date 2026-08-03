"use client";

import { useState, useTransition } from "react";
import { deleteGoal, setGoalNote, setGoalResult } from "@/app/actions";
import type { Goal, GoalResult } from "@/db/schema";

export const RESULT_LABEL: Record<GoalResult, string> = {
  pending: "—",
  done: "⚪︎",
  partial: "△",
  missed: "×",
};

const RESULT_COLOR: Record<GoalResult, string> = {
  pending: "text-ink-faint",
  done: "text-matcha",
  partial: "text-kin",
  missed: "text-shu",
};

const MARKS: { value: GoalResult; label: string; className: string }[] = [
  { value: "done", label: "⚪︎", className: "text-matcha border-matcha" },
  { value: "partial", label: "△", className: "text-kin border-kin" },
  { value: "missed", label: "×", className: "text-shu border-shu" },
];

export default function GoalItem({
  goal,
  dateLabel,
  showResultLabel = false,
}: {
  goal: Goal;
  dateLabel?: string;
  showResultLabel?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.note ?? "");

  const openEditor = () => {
    setDraft(goal.note ?? "");
    setEditing(true);
  };

  const saveNote = () => {
    startTransition(async () => {
      await setGoalNote(goal.id, draft);
      setEditing(false);
    });
  };

  return (
    <div className={pending ? "opacity-50" : undefined}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          {showResultLabel && (
            <span
              className={`font-display text-lg shrink-0 ${RESULT_COLOR[goal.result as GoalResult]}`}
            >
              {RESULT_LABEL[goal.result as GoalResult]}
            </span>
          )}
          <div className="min-w-0">
            {dateLabel && (
              <p className="text-xs text-ink-faint mb-0.5">{dateLabel}</p>
            )}
            <p className="text-[0.95rem]">{goal.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {MARKS.map((mark) => {
            const active = goal.result === mark.value;
            return (
              <button
                key={mark.value}
                type="button"
                title={mark.label}
                onClick={() => {
                  startTransition(() =>
                    setGoalResult(goal.id, active ? "pending" : mark.value)
                  );
                  if (!active && !goal.note) openEditor();
                }}
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
            title="一言コメント"
            onClick={() => (editing ? setEditing(false) : openEditor())}
            className={`ml-1 text-xs transition-colors cursor-pointer ${
              editing || goal.note
                ? "text-ink-soft hover:text-ink"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            コメント
          </button>
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
      </div>
      {editing ? (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={draft}
            autoFocus
            placeholder="一言コメント（所感）"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // IME変換確定のEnter（isComposing / keyCode 229）では保存しない
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === "Enter") saveNote();
              if (e.key === "Escape") setEditing(false);
            }}
            className="field flex-1 text-sm"
          />
          <button
            type="button"
            onClick={saveNote}
            className="btn-primary shrink-0 text-sm"
          >
            保存
          </button>
        </div>
      ) : (
        goal.note && (
          <button
            type="button"
            title="コメントを編集"
            onClick={openEditor}
            className="mt-1 block text-left text-xs text-ink-soft hover:text-ink transition-colors cursor-pointer"
          >
            {goal.note}
          </button>
        )
      )}
    </div>
  );
}
