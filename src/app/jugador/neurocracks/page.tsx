import { requireUser } from "@/lib/auth";
import { getNeurocracksData } from "@/lib/el-camino/data";
import { ElCaminoHome } from "@/components/player/el-camino-home";

export const metadata = { title: "El Camino" };

export default async function Page() {
  const user = await requireUser();
  const { playerId, caminos } = await getNeurocracksData(user.id);
  return <ElCaminoHome playerId={playerId} caminos={caminos} />;
}
