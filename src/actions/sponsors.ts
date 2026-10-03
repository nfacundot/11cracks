"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";

export type SponsorState = { error?: string; success?: string } | undefined;

const MAX_SPONSORS = 20;

function readSponsor(formData: FormData) {
  const order = Number(formData.get("order") || 0);
  const slot = Number(formData.get("slot") || 0);
  return {
    name: String(formData.get("name") || "").trim().slice(0, 60),
    imageUrl: String(formData.get("imageUrl") || "").trim().slice(0, 500),
    slot: Number.isInteger(slot) && slot >= 1 && slot <= MAX_SPONSORS ? slot : 0,
    order: Number.isFinite(order) ? Math.trunc(order) : 0,
    active: formData.get("active") !== null,
  };
}

export async function createSponsor(_prev: SponsorState, formData: FormData): Promise<SponsorState> {
  await requireSection("ADMIN");

  const data = readSponsor(formData);
  if (data.name.length < 2) return { error: "El nombre es obligatorio" };
  if (!data.imageUrl) return { error: "Sube un logo o indica una URL" };

  const total = await prisma.sponsor.count();
  if (total >= MAX_SPONSORS) return { error: `Máximo ${MAX_SPONSORS} patrocinadores` };

  if (data.slot > 0) {
    const taken = await prisma.sponsor.findFirst({ where: { slot: data.slot }, select: { id: true } });
    if (taken) return { error: `El espacio ${data.slot} ya está ocupado` };
  }

  await prisma.sponsor.create({ data });
  revalidatePath("/admin/patrocinadores");
  return { success: "Patrocinador creado" };
}

export async function updateSponsor(formData: FormData): Promise<void> {
  await requireSection("ADMIN");

  const id = String(formData.get("id") || "");
  if (!id) return;

  const data = readSponsor(formData);
  if (data.name.length < 2 || !data.imageUrl) return;

  if (data.slot > 0) {
    const taken = await prisma.sponsor.findFirst({ where: { slot: data.slot, id: { not: id } }, select: { id: true } });
    if (taken) return;
  }

  await prisma.sponsor.update({ where: { id }, data });
  revalidatePath("/admin/patrocinadores");
}

export async function toggleSponsorActive(formData: FormData): Promise<void> {
  await requireSection("ADMIN");

  const id = String(formData.get("id") || "");
  if (!id) return;
  const active = formData.get("active") === "1";

  await prisma.sponsor.update({ where: { id }, data: { active } });
  revalidatePath("/admin/patrocinadores");
}

export async function deleteSponsor(formData: FormData): Promise<void> {
  await requireSection("ADMIN");

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.sponsor.delete({ where: { id } });
  revalidatePath("/admin/patrocinadores");
}
