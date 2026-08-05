"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import {
  aiSummaries,
  entries,
  goalCheckins,
  goals,
  GOAL_RESULTS,
  type GoalResult,
} from "@/db/schema";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { getDb, getEnv } from "@/lib/db";
import { formatJa, resolveReviewRange, todayJst } from "@/lib/dates";
import {
  getCheckinsForGoals,
  getEntriesInRange,
  getGoalsInRange,
} from "@/lib/queries";

// ---------- 認証 ----------

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password");
  const env = await getEnv();

  if (typeof password !== "string" || password !== env.APP_PASSWORD) {
    return { error: "パスワードが違います" };
  }

  const token = await createSessionToken(env.AUTH_SECRET);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: sessionCookie.maxAge,
    path: "/",
  });
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie.name);
  redirect("/login");
}

// ---------- 日記 ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveEntry(date: string, formData: FormData) {
  if (!DATE_RE.test(date)) throw new Error("invalid date");
  const db = await getDb();

  const field = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v.trim() : "";
  };

  const values = {
    wins: field("wins"),
    gratitude: field("gratitude"),
    health: field("health"),
    social: field("social"),
    selfTalk: field("selfTalk"),
    learnings: field("learnings"),
  };

  await db
    .insert(entries)
    .values({ date, ...values })
    .onConflictDoUpdate({
      target: entries.date,
      set: { ...values, updatedAt: new Date().toISOString() },
    });

  revalidatePath("/");
  revalidatePath("/entries");
  revalidatePath(`/entries/${date}`);
}

// ---------- 目標 ----------

export async function addGoal(formData: FormData) {
  const title = formData.get("title");
  const targetDate = formData.get("targetDate");
  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof targetDate !== "string" ||
    !DATE_RE.test(targetDate)
  ) {
    return;
  }
  const db = await getDb();
  await db.insert(goals).values({ title: title.trim(), targetDate });
  revalidatePath("/goals");
  revalidatePath("/");
}

const MONTH_RE = /^\d{4}-\d{2}$/;

export async function addMonthlyGoal(formData: FormData) {
  const title = formData.get("title");
  const targetMonth = formData.get("targetMonth");
  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof targetMonth !== "string" ||
    !MONTH_RE.test(targetMonth)
  ) {
    return;
  }
  const db = await getDb();
  await db.insert(goals).values({
    title: title.trim(),
    targetDate: `${targetMonth}-01`,
    scope: "month",
  });
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function setGoalResult(id: number, result: GoalResult) {
  if (!GOAL_RESULTS.includes(result)) return;
  const db = await getDb();
  await db.update(goals).set({ result }).where(eq(goals.id, id));
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function setGoalNote(id: number, note: string) {
  const db = await getDb();
  await db
    .update(goals)
    .set({ note: note.trim() || null })
    .where(eq(goals.id, id));
  revalidatePath("/goals");
  revalidatePath("/");
}

/** 月間目標用: 日付付きでコメントを追記する */
export async function appendGoalNote(id: number, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const db = await getDb();
  const goal = await db.query.goals.findFirst({ where: eq(goals.id, id) });
  if (!goal) return;
  const [, m, d] = todayJst().split("-").map(Number);
  const line = `${m}/${d}: ${trimmed}`;
  const note = goal.note ? `${goal.note}\n${line}` : line;
  await db.update(goals).set({ note }).where(eq(goals.id, id));
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: number) {
  const db = await getDb();
  await db.delete(goals).where(eq(goals.id, id));
  await db.delete(goalCheckins).where(eq(goalCheckins.goalId, id));
  revalidatePath("/goals");
  revalidatePath("/");
}

// ---------- 月間目標のデイリーチェックイン ----------

export async function setTodayCheckinResult(goalId: number, result: GoalResult) {
  if (!GOAL_RESULTS.includes(result)) return;
  const db = await getDb();
  await db
    .insert(goalCheckins)
    .values({ goalId, date: todayJst(), result })
    .onConflictDoUpdate({
      target: [goalCheckins.goalId, goalCheckins.date],
      set: { result },
    });
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function setTodayCheckinNote(goalId: number, note: string) {
  const db = await getDb();
  await db
    .insert(goalCheckins)
    .values({ goalId, date: todayJst(), note: note.trim() || null })
    .onConflictDoUpdate({
      target: [goalCheckins.goalId, goalCheckins.date],
      set: { note: note.trim() || null },
    });
  revalidatePath("/goals");
  revalidatePath("/");
}

// ---------- AIカウンセラーレビュー ----------

const COUNSELOR_SYSTEM = `あなたは経験豊富な臨床心理士・カウンセラーです。クライアントが毎日書いている成長日記を読み、その人の人生がより良くなる観点でレビューとコメントを返します。

姿勢:
- 温かく、共感的に。決して説教せず、本人の言葉を尊重する
- 認知行動療法の視点を取り入れる。特に「自分を責めたこと」の欄には、その認知が事実に基づくか一緒に検討し、よりバランスの取れた見方を提案する
- 小さな行動や変化を具体的に拾って承認する（本人が見落としがちな成長を言語化する）
- 「今日の学び」に書かれた気づきは、心理学的な裏付けがあれば軽く補足して強化する

出力形式（Markdownで、全体で500〜750字程度）:
1. **今日の受け止め** — 日記全体への共感的なひとこと
2. **良かったこと** — 具体的に2〜3点
3. **心の整理** — セルフトークや感情への認知的なコメント（該当する記述がなければ省略可）
4. **明日へのひとこと** — 前向きで具体的な提案をひとつ
5. **人生を良くする一歩** — 日記から見えるこの人の状況・価値観をふまえた、人生がより良くなるための行動アドバイスを1〜2点。健康・人間関係・仕事・お金・学びなど、効きそうな領域を選び、「今日から実行できる小さな行動」のレベルまで具体化する（例:「◯◯な場面が多いようなので、△△を週1回やってみませんか」）。ありきたりな一般論ではなく、日記の記述を根拠にする

日本語で、丁寧だが親しみのある口調（〜ですね、〜だと思います）で書いてください。`;

export async function generateAiReview(
  date: string
): Promise<{ review?: string; error?: string }> {
  if (!DATE_RE.test(date)) return { error: "invalid date" };

  const db = await getDb();
  const entry = await db.query.entries.findFirst({
    where: eq(entries.date, date),
  });
  if (!entry) return { error: "先に日記を保存してください" };

  const sections = [
    ["今日うまくいったこと", entry.wins],
    ["感謝ポイント", entry.gratitude],
    ["健康のためにやったこと", entry.health],
    ["人間関係・社会とのつながり", entry.social],
    ["自分を責めたこと", entry.selfTalk],
    ["今日の学び", entry.learnings],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `## ${k}\n${v}`)
    .join("\n\n");

  if (!sections) return { error: "日記の内容が空です" };

  const env = await getEnv();
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: COUNSELOR_SYSTEM,
      messages: [
        {
          role: "user",
          content: `${formatJa(date)}の日記です。レビューをお願いします。\n\n${sections}`,
        },
      ],
    });

    const review = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!review) return { error: "レビューを生成できませんでした" };

    await db
      .update(entries)
      .set({ aiReview: review, updatedAt: new Date().toISOString() })
      .where(eq(entries.date, date));

    revalidatePath(`/entries/${date}`);
    revalidatePath("/");
    return { review };
  } catch (e) {
    console.error("AI review failed:", e);
    return { error: "AIレビューの生成に失敗しました。時間をおいて再試行してください" };
  }
}

// ---------- AI週次・月次まとめ ----------

const SUMMARY_SYSTEM = `あなたは経験豊富なコーチ・カウンセラーです。クライアントが毎日書いている成長日記の一定期間分（1週間または1ヶ月）を読み、その期間全体を俯瞰した振り返りレポートを作成します。

姿勢:
- 個々の日記の要約ではなく、期間全体を通したパターン・変化・成長を見つけて言語化する
- うまくいったことや学びに繰り返し現れるテーマがあれば指摘する
- 「自分を責めたこと」に傾向があれば、認知行動療法の視点でバランスの取れた見方を添える
- 目標の達成状況とその所感コメントから、目標の立て方・動き方の傾向を読み取る
- 温かく具体的に。抽象的な励ましではなく、日記の記述を引用しながら承認する

出力形式（Markdownで、全体で500〜800字程度）:
1. **この期間のハイライト** — 期間全体を象徴する出来事や変化を2〜3点
2. **見えてきたパターン** — うまくいったこと・学び・つながりに共通するテーマ
3. **心の傾向** — セルフトークの傾向と認知的なコメント（該当する記述がなければ省略可）
4. **次の期間への提案** — 具体的で実行しやすい提案を1〜2点

日本語で、丁寧だが親しみのある口調（〜ですね、〜だと思います）で書いてください。`;

export async function generateRangeSummary(
  range: "week" | "month",
  offset: number
): Promise<{ summary?: string; error?: string }> {
  if (range !== "week" && range !== "month") return { error: "invalid range" };
  if (!Number.isInteger(offset) || offset > 0 || offset < -520) {
    return { error: "invalid offset" };
  }

  const today = todayJst();
  const { start, end, title } = resolveReviewRange(range, offset, today);

  const [rangeEntries, allRangeGoals] = await Promise.all([
    getEntriesInRange(start, end),
    getGoalsInRange(start, end),
  ]);

  // 月間目標は月次まとめでのみ扱う
  const rangeGoals =
    range === "week"
      ? allRangeGoals.filter((g) => g.scope === "day")
      : allRangeGoals;

  if (rangeEntries.length === 0) {
    return { error: "この期間の日記がまだありません" };
  }

  const entryTexts = rangeEntries
    .map((e) => {
      const sections = [
        ["うまくいったこと", e.wins],
        ["感謝", e.gratitude],
        ["健康", e.health],
        ["つながり", e.social],
        ["自分を責めたこと", e.selfTalk],
        ["学び", e.learnings],
      ]
        .filter(([, v]) => v)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n");
      return `### ${formatJa(e.date)}\n${sections}`;
    })
    .join("\n\n");

  const checkins = await getCheckinsForGoals(
    rangeGoals.filter((g) => g.scope === "month").map((g) => g.id)
  );

  const CHECKIN_MARK: Record<string, string> = {
    done: "⚪︎",
    partial: "△",
    missed: "×",
    pending: "—",
  };

  const goalTexts =
    rangeGoals.length > 0
      ? rangeGoals
          .map((g) => {
            const mark =
              g.result === "done"
                ? "⚪︎達成"
                : g.result === "partial"
                  ? "△一部達成"
                  : g.result === "missed"
                    ? "×未達成"
                    : "—未判定";
            const note = g.note ? `（所感: ${g.note}）` : "";
            const when =
              g.scope === "month" ? "月間目標" : formatJa(g.targetDate);
            const progress = checkins
              .filter((c) => c.goalId === g.id)
              .map(
                (c) =>
                  `  - ${c.date.slice(5).replace("-", "/")} ${CHECKIN_MARK[c.result] ?? "—"}${c.note ? ` ${c.note}` : ""}`
              )
              .join("\n");
            return `- ${when} ${g.title} → ${mark}${note}${
              progress ? `\n  日々の経過:\n${progress}` : ""
            }`;
          })
          .join("\n")
      : "（この期間の目標はありません）";

  const env = await getEnv();
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: SUMMARY_SYSTEM,
      messages: [
        {
          role: "user",
          content: `${title}の日記と目標です。この期間の振り返りレポートをお願いします。\n\n## 日記\n\n${entryTexts}\n\n## 目標と結果\n\n${goalTexts}`,
        },
      ],
    });

    const summary = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!summary) return { error: "まとめを生成できませんでした" };

    const db = await getDb();
    await db
      .insert(aiSummaries)
      .values({ rangeType: range, startDate: start, content: summary })
      .onConflictDoUpdate({
        target: [aiSummaries.rangeType, aiSummaries.startDate],
        set: { content: summary, createdAt: new Date().toISOString() },
      });

    revalidatePath("/review");
    return { summary };
  } catch (e) {
    console.error("AI summary failed:", e);
    return { error: "まとめの生成に失敗しました。時間をおいて再試行してください" };
  }
}
