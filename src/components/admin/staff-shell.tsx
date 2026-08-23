import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { CleanUrl } from "@/components/admin/clean-url";
import { LogOutIcon } from "@/components/icons";
import { logout } from "@/actions/auth";

export function StaffShell({
  basePath,
  title,
  subtitle,
  user,
  children,
}: {
  basePath: string;
  title: string;
  subtitle: string;
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-zinc-100 dark:bg-black">
      <CleanUrl base={basePath} />
      <AdminNav basePath={basePath} title={title} subtitle={subtitle} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-green-100 bg-white/60 backdrop-blur-xl px-6 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
          <h1 className="text-sm font-black uppercase tracking-widest text-zinc-400">
            {subtitle}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/jugador/learn"
              className="rounded-xl px-3 py-2 text-sm font-bold text-zinc-600 transition hover:bg-green-50 dark:text-zinc-300 dark:hover:bg-emerald-900"
            >
              Ver app
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-600"
              >
                <LogOutIcon className="h-4 w-4" />
                Salir
              </button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
