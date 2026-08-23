import { NewGameView } from "@/components/admin/sections/lesson-editor-views";

export const metadata = { title: "Nuevo juego | Admin" };

export default function AdminNewGamePage() {
  return <NewGameView basePath="/admin" />;
}
