"use client";

import { useState, useTransition } from "react";
import {
  appendGoalNote,
  deleteGoal,
  setGoalNote,
  setGoalResult,
} from "@/app/actions";
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

/**
 * コメントの編集モード:
 * - append: 月間目標への日付付き追記（入力は1行、日付は自動付与）
 * - edit:   コメント全体の編集（日付目標は1行入力、月間目標はログ全体をtextareaで）
 */
type EditMode = null | "append" | "edit";

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
  const [mode, setMode] = useState<EditMode>(null);
  const [draft, setDraft] = useState("");
  const isMonth = goal.scope === "month";

  const openComment = () => {
    if (isMonth) {
      setDraft("");
      setMode("append");
    } else {
      setDraft(goal.note ?? "");
      setMode("edit");
    }
  };

  const openFullEdit = () => {
    setDraft(goal.note ?? "");
    setMode("edit");
  };

  const save = () => {
    startTransition(async () => {
      if (mode === "append") {
        await appendGoalNote(goal.id, draft);
      } else {
        await setGoalNote(goal.id, draft);
      }
      setMode(null);
      setDraft("");
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
                  if (!active && !goal.note) openComment();
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
            title={isMonth ? "経過を追記" : "一言コメント"}
            onClick={() => (mode ? setMode(null) : openComment())}
            className={`ml-1 text-xs transition-colors cursor-pointer ${
              mode || goal.note
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

      {mode === "append" && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={draft}
            autoFocus
            placeholder="きょうの経過をひとこと（日付は自動で付きます）"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === "Enter") save();
              if (e.key === "Escape") setMode(null);
            }}
            className="field flex-1 text-sm"
          />
          <button
            type="button"
            onClick={save}
            className="btn-primary shrink-0 text-sm"
          >
            追記
          </button>
        </div>
      )}

      {mode === "edit" &&
        (isMonth ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={draft}
              autoFocus
              rows={Math.min(6, Math.max(3, draft.split("\n").length + 1))}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
                if (e.key === "Escape") setMode(null);
              }}
              className="field w-full text-sm"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="btn-ghost text-sm"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={save}
                className="btn-primary shrink-0 text-sm"
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={draft}
              autoFocus
              placeholder="一言コメント（所感）"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === "Enter") save();
                if (e.key === "Escape") setMode(null);
              }}
              className="field flex-1 text-sm"
            />
            <button
              type="button"
              onClick={save}
              className="btn-primary shrink-0 text-sm"
            >
              保存
            </button>
          </div>
        ))}

      {mode === null && goal.note && (
        <button
          type="button"
          title="コメントを編集"
          onClick={openFullEdit}
          className="mt-1 block text-left text-xs text-ink-soft hover:text-ink transition-colors cursor-pointer whitespace-pre-line"
        >
          {goal.note}
        </button>
      )}
    </div>
  );
}
