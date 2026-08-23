-- Cambiar los roles a: JUGADOR, ENTRENADOR, ADMIN, SUPERADMIN
CREATE TYPE "Role_new" AS ENUM ('JUGADOR', 'ENTRENADOR', 'ADMIN', 'SUPERADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (
  CASE "role"::text
    WHEN 'STUDENT' THEN 'JUGADOR'::"Role_new"
    WHEN 'COACH' THEN 'ENTRENADOR'::"Role_new"
    WHEN 'PARENT' THEN 'ADMIN'::"Role_new"
    ELSE "role"::text::"Role_new"
  END
);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'JUGADOR';
