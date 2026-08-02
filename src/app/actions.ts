"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { entries, goals, GOAL_RESULTS, type GoalResult } from "@/db/schema";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { getDb, getEnv } from "@/lib/db";
import { formatJa } from "@/lib/dates";

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

export async function setGoalResult(id: number, result: GoalResult, note?: string) {
  if (!GOAL_RESULTS.includes(result)) return;
  const db = await getDb();
  await db
    .update(goals)
    .set({ result, note: note?.trim() || null })
    .where(eq(goals.id, id));
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: number) {
  const db = await getDb();
  await db.delete(goals).where(eq(goals.id, id));
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

出力形式（Markdownで、全体で400〜600字程度）:
1. **今日の受け止め** — 日記全体への共感的なひとこと
2. **良かったこと** — 具体的に2〜3点
3. **心の整理** — セルフトークや感情への認知的なコメント（該当する記述がなければ省略可）
4. **明日へのひとこと** — 前向きで具体的な提案をひとつ

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
