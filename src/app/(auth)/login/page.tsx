"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm px-10 py-12 rise text-center">
        <h1 className="font-display text-3xl font-bold tracking-[0.4em] mb-1">
          日々録
        </h1>
        <p className="text-[11px] tracking-[0.35em] text-ink-faint mb-10">
          GROWTH JOURNAL
        </p>
        <form action={formAction} className="space-y-6">
          <input
            type="password"
            name="password"
            placeholder="合言葉"
            autoFocus
            required
            className="field text-center tracking-widest"
          />
          {state?.error && (
            <p className="text-sm text-shu">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full justify-center">
            {pending ? "確認中…" : "ひらく"}
          </button>
        </form>
      </div>
    </div>
  );
}
