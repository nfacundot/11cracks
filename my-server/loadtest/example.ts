import { Client, Room } from "@colyseus/sdk";
import { cli, Options } from "@colyseus/loadtest";

function randomAvatar() {
  const skins = ["#ffe0bd", "#f1c27d", "#e0ac69", "#c68642", "#8d5524"];
  const shirts = ["#16a34a", "#2563eb", "#dc2626", "#7c3aed", "#facc15"];
  return JSON.stringify({
    gender: Math.random() > 0.5 ? "male" : "female",
    skin: skins[Math.floor(Math.random() * skins.length)],
    jersey: shirts[Math.floor(Math.random() * shirts.length)],
  });
}

export async function main(options: Options) {
  const client = new Client(options.endpoint);
  const room: Room = await client.joinOrCreate(options.roomName, {
    name: `bot-${Math.floor(Math.random() * 1000)}`,
    avatar: randomAvatar(),
  });

  console.log("joined successfully!");

  const interval = setInterval(() => {
    room.send("avatar:update", randomAvatar());
  }, 3000);

  room.onStateChange((state: any) => {
    console.log("players in lobby:", state.count);
  });

  room.onLeave((_code: number) => {
    clearInterval(interval);
    console.log("left");
  });
}

cli(main);
