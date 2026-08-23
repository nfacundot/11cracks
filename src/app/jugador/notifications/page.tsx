import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { NotificationList } from "@/components/notification-list";
import { PushSetup } from "@/components/push-setup";

export const metadata = { title: "Notificaciones" };

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Notificaciones</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {unread > 0 ? `${unread} sin leer` : "Todo al día"}
          </p>
        </div>
      </header>

      <div className="rounded-2xl bg-white/60 backdrop-blur-xl p-4 shadow-sm ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:ring-green-900">
        <p className="mb-2 text-sm font-bold">
          Recibe avisos en tu celular 📲
        </p>
        <PushSetup />
      </div>

      <NotificationList notifications={notifications} />
    </div>
  );
}
