"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { touchStreak } from "@/lib/streak";

export type ProfileState = { error?: string; success?: string } | undefined;

export async function updateProfile(
  prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const bio = String(formData.get("bio") || "").trim().slice(0, 160);
  const position = String(formData.get("position") || "").trim().slice(0, 30);
  const favoriteTeam = String(formData.get("favoriteTeam") || "").trim().slice(0, 40);
  const country = String(formData.get("country") || "").trim().slice(0, 40);

  if (name.length < 2 || name.length > 50) {
    return { error: "El nombre debe tener entre 2 y 50 caracteres" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, bio: bio || null, position: position || null, favoriteTeam: favoriteTeam || null, country: country || null },
  });

  revalidatePath("/profile");
  return { success: "Perfil actualizado" };
}

export async function setAvatar(avatarUrl: string) {
  const user = await requireUser();

  if (!avatarUrl || !avatarUrl.startsWith("/uploads/")) {
    return { error: "Imagen no válida" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true };
}

export async function claimDailyStreak() {
  const user = await requireUser();
  const result = await touchStreak(user.id);
  revalidatePath("/dashboard");
  return { ok: true, ...result };
}
