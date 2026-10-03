import {
  defineServer,
  defineRoom,
  monitor,
  playground,
  createRouter,
  createEndpoint,
} from "colyseus";

/**
 * Import your Room files
 */
import { AvatarLobbyRoom } from "./rooms/AvatarLobbyRoom.js";

const server = defineServer({
  /**
   * Define your room handlers:
   */
  rooms: {
    players_lobby: defineRoom(AvatarLobbyRoom),
    coaches_lobby: defineRoom(AvatarLobbyRoom),
    world: defineRoom(AvatarLobbyRoom),
  },

  /**
   * Experimental: Define API routes. Built-in integration with the "playground" and SDK.
   */
  routes: createRouter({
    api_health: createEndpoint("/api/health", { method: "GET" }, async () => {
      return { ok: true, service: "11cracks-avatar-lobby" };
    }),
  }),

  /**
   * Bind your custom express routes here:
   */
  express: (app) => {
    if (process.env.NODE_ENV !== "production") {
      app.use("/monitor", monitor());

      /**
       * Use @colyseus/playground
       * (It is not recommended to expose this route in a production environment)
       */
      app.use("/", playground());
    }
  },
});

export default server;
