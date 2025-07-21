export type User = {
  id: string;
  name: string;
  avatar: string;
  online?: boolean;
};

export type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
};

export type Contact = User & {
  lastMessage?: string;
  lastMessageTimestamp?: number;
  unreadMessages?: number;
};

export type Chat = {
  id: string;
  contact: Contact;
  messages: Message[];
};
