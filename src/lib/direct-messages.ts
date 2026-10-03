export type DirectMessageDto = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type ConversationDto = {
  userId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  teamName: string | null;
  teamLogoUrl: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export function cleanMessageBody(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}
