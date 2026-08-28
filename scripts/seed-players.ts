import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PLAYERS: { name: string; username: string; position: string | null }[] = [
  { name: "Carlos Ramírez", username: "carlos.ramirez", position: "POR" },
  { name: "Diego Fernández", username: "diego.fernandez", position: "POR" },
  { name: "Miguel Torres", username: "miguel.torres", position: "LD" },
  { name: "Andrés Morales", username: "andres.morales", position: "LD" },
  { name: "Joaquín Herrera", username: "joaquin.herrera", position: "DFC" },
  { name: "Valentín Castro", username: "valentin.castro", position: "DFC" },
  { name: "Emiliano Vargas", username: "emiliano.vargas", position: "LI" },
  { name: "Nicolás Rojas", username: "nicolas.rojas", position: "MCD" },
  { name: "Santiago Peña", username: "santiago.pena", position: "MC" },
  { name: "Mateo Aguilar", username: "mateo.aguilar", position: "MC" },
  { name: "Bruno Domínguez", username: "bruno.dominguez", position: "MCO" },
  { name: "Thiago Mendoza", username: "thiago.mendoza", position: "ED" },
  { name: "Lucas Navarro", username: "lucas.navarro", position: "ED" },
  { name: "Gabriel Silva", username: "gabriel.silva", position: "EI" },
  { name: "Alejandro Ríos", username: "alejandro.rios", position: "EI" },
  { name: "Daniel Ortiz", username: "daniel.ortiz", position: "DC" },
  { name: "Sebastián Luna", username: "sebastian.luna", position: "DC" },
  { name: "Rafael Ibáñez", username: "rafael.ibanez", position: "SD" },
  { name: "Ignacio Duarte", username: "ignacio.duarte", position: null },
  { name: "Tomás Reyes", username: "tomas.reyes", position: null },
];

async function main() {
  const password = await bcrypt.hash("123456", 10);
  let created = 0;

  for (const player of PLAYERS) {
    const email = `${player.username}@11cracks.local`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Ya existe: ${email}`);
      continue;
    }
    await prisma.user.create({
      data: {
        email,
        password,
        name: player.name,
        username: player.username,
        role: "JUGADOR",
        position: player.position,
      },
    });
    created++;
  }

  console.log(`Listo. Jugadores creados: ${created}/${PLAYERS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
