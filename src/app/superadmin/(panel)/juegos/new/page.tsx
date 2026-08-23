import { NewGameView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Nuevo juego | Superadmin" };

export default function SuperadminNewGamePage() {
  return <NewGameView basePath="/superadmin" />;
}
