import { Timestamp } from "firebase/firestore";

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
  timestamp: Timestamp | Date;
};

export type Contact = User & {
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  unreadMessages?: number;
};

export type Chat = {
  id: string;
  users: string[]; // array of user IDs
  contact: Contact; // The other user in the chat
  messages: Message[];
};
