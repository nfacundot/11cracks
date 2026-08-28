import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subscribeTactics } from "@/lib/tactics-bus";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("No autorizado", { status: 401 });
  }

  const { teamId } = await params;
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
    select: { id: true },
  });
  if (!member) {
    return new Response("Prohibido", { status: 403 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let ping: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enqueue = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
          return true;
        } catch {
          return false;
        }
      };
      const send = (event: string, data: unknown) =>
        enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      send("ready", { ok: true });

      unsubscribe = subscribeTactics(teamId, (payload) => {
        if (!enqueue(`event: tactics\ndata: ${JSON.stringify(payload)}\n\n`)) {
          if (ping) clearInterval(ping);
          unsubscribe?.();
        }
      });

      ping = setInterval(() => {
        if (!enqueue(": ping\n\n")) {
          if (ping) clearInterval(ping);
          unsubscribe?.();
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        if (ping) clearInterval(ping);
        unsubscribe?.();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (ping) clearInterval(ping);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
