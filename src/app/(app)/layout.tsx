import Link from "next/link";
import { logout } from "@/app/actions";

const NAV = [
  { href: "/", label: "今日" },
  { href: "/entries", label: "記録" },
  { href: "/goals", label: "目標" },
  { href: "/review", label: "振り返り" },
];

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24">
      <header className="flex items-end justify-between pt-8 pb-6 border-b border-line">
        <Link href="/" className="group">
          <h1 className="font-display text-2xl font-bold tracking-[0.3em]">
            日々録
          </h1>
          <p className="text-[11px] tracking-[0.35em] text-ink-faint mt-1 group-hover:text-shu transition-colors">
            HIBIROKU — GROWTH JOURNAL
          </p>
        </Link>
        <nav className="flex items-center gap-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm tracking-[0.15em] text-ink-soft hover:text-shu transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <form action={logout}>
            <button
              type="submit"
              className="text-[11px] tracking-widest text-ink-faint hover:text-shu transition-colors cursor-pointer"
            >
              出
            </button>
          </form>
        </nav>
      </header>
      <main className="pt-8">{children}</main>
    </div>
  );
}
