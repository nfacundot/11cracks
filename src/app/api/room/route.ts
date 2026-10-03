import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_FLOOR_COLOR,
  DEFAULT_WALL_COLOR,
  ROOM_SIZES,
  parseFurniture,
  type RoomData,
} from "@/lib/room";

export const dynamic = "force-dynamic";

const HEX = /^#[0-9a-fA-F]{6}$/;
const SIZE_KEYS = new Set<string>(ROOM_SIZES.map((size) => size.key));

type RoomRow = {
  id: string;
  name: string;
  size: string;
  floorColor: string;
  wallColor: string;
  avatarX: number;
  avatarZ: number;
  avatarRot: number;
  furniture: unknown;
};

function serialize(row: RoomRow): RoomData {
  return {
    id: row.id,
    name: row.name,
    size: row.size,
    floorColor: row.floorColor,
    wallColor: row.wallColor,
    avatarX: row.avatarX,
    avatarZ: row.avatarZ,
    avatarRot: row.avatarRot,
    furniture: parseFurniture(row.furniture),
  };
}

const SELECT = {
  id: true,
  name: true,
  size: true,
  floorColor: true,
  wallColor: true,
  avatarX: true,
  avatarZ: true,
  avatarRot: true,
  furniture: true,
} as const;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await prisma.room.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: SELECT,
  });

  return NextResponse.json({ rooms: rows.map(serialize) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { name?: unknown; size?: unknown; floorColor?: unknown; wallColor?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 40) : "";
  if (!name) {
    return NextResponse.json({ error: "Ponle un nombre a tu habitación." }, { status: 400 });
  }

  const size = typeof payload.size === "string" && SIZE_KEYS.has(payload.size) ? payload.size : ROOM_SIZES[0].key;
  const floorColor = typeof payload.floorColor === "string" && HEX.test(payload.floorColor) ? payload.floorColor : DEFAULT_FLOOR_COLOR;
  const wallColor = typeof payload.wallColor === "string" && HEX.test(payload.wallColor) ? payload.wallColor : DEFAULT_WALL_COLOR;

  const count = await prisma.room.count({ where: { userId: user.id } });
  if (count >= 12) {
    return NextResponse.json({ error: "Máximo de 12 habitaciones alcanzado." }, { status: 400 });
  }

  const room = await prisma.room.create({
    data: { userId: user.id, name, size, floorColor, wallColor },
    select: SELECT,
  });

  return NextResponse.json({ room: serialize(room) });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: {
    id?: unknown;
    name?: unknown;
    size?: unknown;
    floorColor?: unknown;
    wallColor?: unknown;
    avatarX?: unknown;
    avatarZ?: unknown;
    avatarRot?: unknown;
    furniture?: unknown;
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  if (!id) {
    return NextResponse.json({ error: "Falta el id de la habitación" }, { status: 400 });
  }

  const owned = await prisma.room.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) {
    return NextResponse.json({ error: "Habitación no encontrada" }, { status: 404 });
  }

  const data: {
    name?: string;
    size?: string;
    floorColor?: string;
    wallColor?: string;
    avatarX?: number;
    avatarZ?: number;
    avatarRot?: number;
    furniture?: ReturnType<typeof parseFurniture>;
  } = {};

  if (typeof payload.name === "string" && payload.name.trim()) data.name = payload.name.trim().slice(0, 40);
  if (typeof payload.size === "string" && SIZE_KEYS.has(payload.size)) data.size = payload.size;
  if (typeof payload.floorColor === "string" && HEX.test(payload.floorColor)) data.floorColor = payload.floorColor;
  if (typeof payload.wallColor === "string" && HEX.test(payload.wallColor)) data.wallColor = payload.wallColor;
  if (typeof payload.avatarX === "number" && Number.isFinite(payload.avatarX)) data.avatarX = payload.avatarX;
  if (typeof payload.avatarZ === "number" && Number.isFinite(payload.avatarZ)) data.avatarZ = payload.avatarZ;
  if (typeof payload.avatarRot === "number" && Number.isFinite(payload.avatarRot)) data.avatarRot = payload.avatarRot;
  if (payload.furniture !== undefined) data.furniture = parseFurniture(payload.furniture);

  const room = await prisma.room.update({ where: { id }, data: data as Prisma.RoomUpdateInput, select: SELECT });
  return NextResponse.json({ room: serialize(room) });
}
