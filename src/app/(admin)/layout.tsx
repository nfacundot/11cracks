import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { LogOutIcon } from "@/components/icons";
import { logout } from "@/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh bg-zinc-100 dark:bg-black">
      <AdminNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-green-100 bg-white/60 backdrop-blur-xl px-6 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
          <h1 className="text-sm font-black uppercase tracking-widest text-zinc-400">
            Panel de administración
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/learn"
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
