export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export type FriendUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  teamName: string | null;
  teamLogoUrl: string | null;
  since: string;
  online: boolean;
};

export type FriendRelation = "none" | "outgoing" | "incoming" | "friends";

export const FRIEND_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
  lastActiveAt: true,
  teamMembers: {
    select: { team: { select: { name: true, logoUrl: true } } },
    take: 1,
  },
} as const;

export type FriendUserRow = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  lastActiveAt: Date | null;
  teamMembers: Array<{ team: { name: string; logoUrl: string | null } }>;
};

export function isOnline(lastActiveAt: Date | null | undefined, now: number = Date.now()): boolean {
  return lastActiveAt != null && now - lastActiveAt.getTime() <= ONLINE_WINDOW_MS;
}

export function toFriendUser(user: FriendUserRow, since: Date, now: number = Date.now()): FriendUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    teamName: user.teamMembers[0]?.team.name ?? null,
    teamLogoUrl: user.teamMembers[0]?.team.logoUrl ?? null,
    since: since.toISOString(),
    online: isOnline(user.lastActiveAt, now),
  };
}
