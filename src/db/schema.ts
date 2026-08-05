import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** YYYY-MM-DD (JST) */
  date: text("date").notNull().unique(),
  wins: text("wins").notNull().default(""),
  gratitude: text("gratitude").notNull().default(""),
  health: text("health").notNull().default(""),
  social: text("social").notNull().default(""),
  selfTalk: text("self_talk").notNull().default(""),
  learnings: text("learnings").notNull().default(""),
  aiReview: text("ai_review"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Entry = typeof entries.$inferSelect;

export const GOAL_RESULTS = ["pending", "done", "partial", "missed"] as const;
export type GoalResult = (typeof GOAL_RESULTS)[number];

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** YYYY-MM-DD (JST)。月間目標はその月の1日 */
  targetDate: text("target_date").notNull(),
  /** "day"（特定日）| "month"（月間目標） */
  scope: text("scope").notNull().default("day"),
  title: text("title").notNull(),
  result: text("result").notNull().default("pending"),
  note: text("note"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Goal = typeof goals.$inferSelect;

/** 月間目標のデイリーチェックイン */
export const goalCheckins = sqliteTable("goal_checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: integer("goal_id").notNull(),
  /** YYYY-MM-DD (JST) */
  date: text("date").notNull(),
  result: text("result").notNull().default("pending"),
  note: text("note"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type GoalCheckin = typeof goalCheckins.$inferSelect;

export const aiSummaries = sqliteTable("ai_summaries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** "week" | "month" */
  rangeType: text("range_type").notNull(),
  /** 期間の開始日 YYYY-MM-DD (JST) */
  startDate: text("start_date").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type AiSummary = typeof aiSummaries.$inferSelect;
