import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { entries, goals } from "@/db/schema";
import { getDb } from "@/lib/db";
import { addDays, todayJst } from "@/lib/dates";

export async function getEntryByDate(date: string) {
  const db = await getDb();
  return db.query.entries.findFirst({ where: eq(entries.date, date) });
}

export async function getEntriesInRange(start: string, end: string) {
  const db = await getDb();
  return db.query.entries.findMany({
    where: and(gte(entries.date, start), lte(entries.date, end)),
    orderBy: asc(entries.date),
  });
}

export async function getAllEntryDates(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ date: entries.date })
    .from(entries)
    .orderBy(desc(entries.date));
  return rows.map((r) => r.date);
}

/** 連続記録日数（今日または昨日から遡って数える） */
export async function getStreak(): Promise<number> {
  const dates = new Set(await getAllEntryDates());
  const today = todayJst();
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function getGoalsByDate(date: string) {
  const db = await getDb();
  return db.query.goals.findMany({
    where: eq(goals.targetDate, date),
    orderBy: asc(goals.id),
  });
}

export async function getAllGoals() {
  const db = await getDb();
  return db.query.goals.findMany({ orderBy: desc(goals.targetDate) });
}

export async function getGoalsInRange(start: string, end: string) {
  const db = await getDb();
  return db.query.goals.findMany({
    where: and(gte(goals.targetDate, start), lte(goals.targetDate, end)),
    orderBy: asc(goals.targetDate),
  });
}
