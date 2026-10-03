import { schema, t, type SchemaType } from "@colyseus/schema";

/**
 * Estado sincronizado del lobby de avatares.
 *
 * Guardamos los avatares como un string JSON para que el cliente no necesite
 * importar definiciones de schema compartidas: solo primitivos estándar viajan
 * por el wire.
 */
export const AvatarLobbyState = schema({
  /** Se incrementa en cada cambio para forzar el patch. */
  revision: t.uint32().default(0),
  /** Número de jugadores conectados al lobby. */
  count: t.uint16().default(0),
  /** JSON: Array<{ sessionId: string; name: string; config: string }> */
  avatarsJson: t.string().default("[]"),
});

export type AvatarLobbyState = SchemaType<typeof AvatarLobbyState>;
