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
  /** YYYY-MM-DD (JST) */
  targetDate: text("target_date").notNull(),
  title: text("title").notNull(),
  result: text("result").notNull().default("pending"),
  note: text("note"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Goal = typeof goals.$inferSelect;
