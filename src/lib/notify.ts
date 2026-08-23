import "server-only";

import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/push";
import type { NotificationType } from "@/generated/prisma";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  opts?: { icon?: string; link?: string; push?: boolean }
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      icon: opts?.icon,
      link: opts?.link,
    },
  });

  if (opts?.push !== false) {
    await sendPushNotification(userId, {
      title,
      body,
      icon: opts?.icon,
      url: opts?.link ?? "/jugador/notifications",
    });
  }

  return notification;
}
