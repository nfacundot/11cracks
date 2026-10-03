import { Room, type Client, type CloseCode } from "colyseus";
import { AvatarLobbyState } from "./schema/AvatarLobbyState.js";

const MAX_CONFIG_LENGTH = 4096;
const MAX_NAME_LENGTH = 24;

export type AvatarEntry = {
  sessionId: string;
  userId: string;
  name: string;
  username: string;
  team: string;
  teamLogo: string;
  config: string;
  x: number;
  z: number;
  rot: number;
};

type JoinOptions = {
  userId?: unknown;
  name?: unknown;
  username?: unknown;
  team?: unknown;
  teamLogo?: unknown;
  avatar?: unknown;
  x?: unknown;
  z?: unknown;
  rot?: unknown;
};

/**
 * Lobby del mundo: cada jugador publica su avatar y su posición en tiempo real.
 * Todos los clientes conectados ven y pueden interactuar con el resto.
 */
export class AvatarLobbyRoom extends Room<{ state: AvatarLobbyState }> {
  maxClients = 24;
  state = new AvatarLobbyState();

  private avatars = new Map<string, AvatarEntry>();

  onCreate() {
    this.onMessage("avatar:update", (client: Client, message: unknown) => {
      this.setAvatar(client, message);
    });

    this.onMessage("avatar:move", (client: Client, message: unknown) => {
      this.move(client, message);
    });

    this.publish();
  }

  onJoin(client: Client, options?: JoinOptions) {
    this.setAvatar(client, options?.avatar, options);
  }

  onLeave(client: Client, _code: CloseCode) {
    this.avatars.delete(client.sessionId);
    this.publish();
  }

  onDispose() {
    this.avatars.clear();
  }

  private move(client: Client, message: unknown) {
    const entry = this.avatars.get(client.sessionId);
    if (!entry) return;

    const m = (message ?? {}) as { x?: unknown; z?: unknown; rot?: unknown };
    if (typeof m.x === "number" && Number.isFinite(m.x)) entry.x = m.x;
    if (typeof m.z === "number" && Number.isFinite(m.z)) entry.z = m.z;
    if (typeof m.rot === "number" && Number.isFinite(m.rot)) entry.rot = m.rot;
    this.publish();
  }

  private setAvatar(client: Client, rawAvatar: unknown, options?: JoinOptions) {
    const config =
      typeof rawAvatar === "string"
        ? rawAvatar
        : JSON.stringify(rawAvatar ?? {});
    if (config.length > MAX_CONFIG_LENGTH) return;

    const name =
      typeof options?.name === "string" && options.name.trim().length > 0
        ? options.name.trim().slice(0, MAX_NAME_LENGTH)
        : undefined;

    const entry: AvatarEntry =
      this.avatars.get(client.sessionId) ?? {
        sessionId: client.sessionId,
        userId: typeof options?.userId === "string" ? options.userId : "",
        name: name ?? "Crack",
        username: "",
        team: "",
        teamLogo: "",
        config: "{}",
        x: typeof options?.x === "number" ? options.x : 0,
        z: typeof options?.z === "number" ? options.z : 55,
        rot: typeof options?.rot === "number" ? options.rot : Math.PI,
      };

    entry.config = config;
    if (name) entry.name = name;
    if (typeof options?.userId === "string") entry.userId = options.userId;
    if (typeof options?.username === "string") entry.username = options.username.slice(0, 40);
    if (typeof options?.team === "string") entry.team = options.team.slice(0, 40);
    if (typeof options?.teamLogo === "string") entry.teamLogo = options.teamLogo.slice(0, 300);

    this.avatars.set(client.sessionId, entry);
    this.publish();
  }

  private publish() {
    const list = [...this.avatars.values()];
    this.state.avatarsJson = JSON.stringify(list);
    this.state.count = list.length;
    this.state.revision++;
  }
}
