const JST_FORMAT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 今日の日付 (JST) を YYYY-MM-DD で返す */
export function todayJst(): string {
  return JST_FORMAT.format(new Date());
}

/** YYYY-MM-DD に日数を加算 */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 曜日 (JST基準の日付文字列に対して) 0=日曜 */
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-08-02" -> "8月2日（日）" */
export function formatJa(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}月${d}日（${WEEKDAY_JA[dayOfWeek(date)]}）`;
}

/** その月の日付一覧 (YYYY-MM -> ["YYYY-MM-01", ...]) */
export function daysInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from(
    { length: last },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`
  );
}

/** 月を加算 (YYYY-MM) */
export function addMonths(month: string, diff: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + diff, 1));
  return d.toISOString().slice(0, 7);
}

export type ReviewRange = "week" | "month";

/** 振り返り期間（週次: 月曜はじまり / 月次）の開始・終了・表示名を求める */
export function resolveReviewRange(
  range: ReviewRange,
  offset: number,
  today: string
): { start: string; end: string; title: string } {
  if (range === "week") {
    const mondayOffset = (dayOfWeek(today) + 6) % 7;
    const thisMonday = addDays(today, -mondayOffset);
    const start = addDays(thisMonday, offset * 7);
    const end = addDays(start, 6);
    return { start, end, title: `${formatJa(start)} 〜 ${formatJa(end)}` };
  }
  const [y, m] = today.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  const start = d.toISOString().slice(0, 10);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  const end = last.toISOString().slice(0, 10);
  return {
    start,
    end,
    title: `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`,
  };
}
