
import type { Timestamp } from "firebase/firestore";

export type User = {
  id: string; // This is the document ID from Firestore
  uid: string; // This is the Firebase Auth UID
  name: string;
  email: string;
  avatar: string;
  online?: boolean;
};

export type Message = {
  id: string;
  text: string;
  senderId: string; // Firebase Auth UID
  timestamp: Timestamp | Date;
};

export type Contact = User & {
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  unreadMessages?: number;
};

export type Chat = {
  id: string;
  users: string[]; // array of user UIDs
  contact: Contact; // The other user in the chat
  messages: Message[];
  createdAt: Timestamp;
};
