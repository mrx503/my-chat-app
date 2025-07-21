import type { User, Message, Contact, Chat } from '@/lib/types';

export const currentUser: User = {
  id: 'user0',
  name: 'You',
  avatar: `https://placehold.co/100x100.png`,
};

export const contacts: Contact[] = [
  { id: 'user1', name: 'Aisha', avatar: `https://placehold.co/100x100.png`, online: true },
  { id: 'user2', name: 'Omar', avatar: `https://placehold.co/100x100.png`, online: false },
  { id: 'user3', name: 'Fatima', avatar: `https://placehold.co/100x100.png`, online: true },
  { id: 'user4', name: 'Youssef', avatar: `https://placehold.co/100x100.png`, online: false },
  { id: 'user5', name: 'Layla', avatar: `https://placehold.co/100x100.png`, online: true },
];

const initialMessages: Message[] = [
    { id: 'msg1', senderId: 'user1', text: 'Hey, how are you?', timestamp: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 'msg2', senderId: 'user0', text: 'I am good, thanks for asking! How about you?', timestamp: Date.now() - 1000 * 60 * 60 * 1 },
    { id: 'msg3', senderId: 'user1', text: 'Doing great! Just working on the new Murrasil project.', timestamp: Date.now() - 1000 * 60 * 30 },
    { id: 'msg4', senderId: 'user2', text: 'Can we schedule a meeting for tomorrow?', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 },
    { id: 'msg5', senderId: 'user3', text: 'Did you see the latest designs?', timestamp: Date.now() - 1000 * 60 * 5 },
    { id: 'msg6', senderId: 'user0', text: 'Not yet, could you send them over?', timestamp: Date.now() - 1000 * 60 * 4 },
    { id: 'msg7', senderId: 'user3', text: 'Sure, sending them now!', timestamp: Date.now() - 1000 * 60 * 3 },
    { id: 'msg8', senderId: 'user4', text: 'Let me know if you need anything else.', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 },
];

export const chats: Chat[] = contacts.map((contact, index) => {
    const chatMessages = initialMessages.filter(m => m.senderId === contact.id || m.senderId === currentUser.id)
    .sort((a, b) => a.timestamp - b.timestamp)
    // create a semi-realistic chat history for each contact
    .filter((_, i) => (i + index) % 2 === 0 || i < 3);

    const lastMessage = chatMessages[chatMessages.length - 1];

    return {
        id: `chat${index + 1}`,
        contact: {
            ...contact,
            lastMessage: lastMessage?.text,
            lastMessageTimestamp: lastMessage?.timestamp,
            unreadMessages: index % 3 === 0 ? Math.floor(Math.random() * 3) + 1 : 0
        },
        messages: chatMessages,
    };
}).sort((a,b) => (b.contact.lastMessageTimestamp ?? 0) - (a.contact.lastMessageTimestamp ?? 0));
