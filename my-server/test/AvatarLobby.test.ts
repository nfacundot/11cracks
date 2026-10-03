import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

import appConfig from "../src/app.config.js";
import type { AvatarLobbyState } from "../src/rooms/schema/AvatarLobbyState.js";

type Snapshot = Array<{ sessionId: string; name: string; config: string }>;

describe("avatar lobby", () => {
  let colyseus: ColyseusTestServer<typeof appConfig>;

  before(async () => (colyseus = await boot(appConfig)));
  after(async () => colyseus.shutdown());

  beforeEach(async () => {
    await colyseus.cleanup();
  });

  it("publica el avatar enviado al entrar", async () => {
    const room = await colyseus.createRoom<AvatarLobbyState>("players_lobby", {});
    const client = await colyseus.connectTo(room, {
      name: "Ana",
      avatar: JSON.stringify({ skin: "#f1c27d", gender: "female" }),
    });

    const snapshot = JSON.parse(client.state.avatarsJson) as Snapshot;
    assert.strictEqual(client.state.count, 1);
    assert.strictEqual(snapshot[0]?.name, "Ana");
    assert.match(snapshot[0]?.config ?? "", /f1c27d/);
  });

  it("actualiza el avatar mediante mensaje", async () => {
    const room = await colyseus.createRoom<AvatarLobbyState>("players_lobby", {});
    const client = await colyseus.connectTo(room);

    const patch = room.waitForNextPatch();
    client.send("avatar:update", JSON.stringify({ gender: "male" }));
    await patch;

    const snapshot = JSON.parse(client.state.avatarsJson) as Snapshot;
    assert.match(snapshot[0]?.config ?? "", /male/);
  });
});
