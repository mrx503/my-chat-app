
import type { Timestamp } from "firebase/firestore";

export type User = {
  id: string; // This is the document ID from Firestore
  uid: string; // This is the Firebase Auth UID
  name: string;
  email: string;
  avatar: string;
  online?: boolean;
  lastSeen?: Timestamp;
  privacySettings?: {
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
  };
  blockedUsers?: string[];
};

export type Message = {
  id: string;
  text: string;
  senderId: string; // Firebase Auth UID
  timestamp: Timestamp | Date;
  type?: 'text' | 'image' | 'file' | 'audio'; // To distinguish message types
  fileURL?: string; // URL for the file/image/audio
  fileName?: string; // Name of the file
  status?: 'sent' | 'read';
  deletedFor?: string[]; // Array of user UIDs for whom the message is deleted
  isDeleted?: boolean; // True if deleted for everyone
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
