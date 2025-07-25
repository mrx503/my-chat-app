
"use client"

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, Message, User, ReplyTo } from '@/lib/types';
import ChatArea from '@/components/chat-area';
import { Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { generateReply } from '@/ai/flows/auto-reply-flow';
import { sendNotification } from '@/ai/flows/send-notification-flow';

const SYSTEM_BOT_UID = 'system-bot-uid';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const chatId = params.chatId as string;
    const { toast } = useToast();

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [amIBlocked, setAmIBlocked] = useState(false);
    const [isAutoReplyActive, setIsAutoReplyActive] = useState(false);
    const [isSystemChat, setIsSystemChat] = useState(false);
    const lastProcessedMessageId = useRef<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if (!chatId) return;

        const chatDocRef = doc(db, 'chats', chatId);
        const unsubscribeChat = onSnapshot(chatDocRef, async (chatDoc) => {
            if (chatDoc.exists()) {
                const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat;

                if (!chatData.users.includes(currentUser.uid)) {
                    toast({ variant: 'destructive', title: "Access Denied", description: "You are not a member of this chat." });
                    setChat(null);
                    setLoading(false);
                    router.push('/');
                    return;
                }
                
                if (chatData.users.includes(SYSTEM_BOT_UID)) {
                    setIsSystemChat(true);
                }
                
                 const contactId = chatData.users.find(id => id !== currentUser.uid);
                 if(contactId) {
                    const contactDocRef = doc(db, 'users', contactId);
                    const unsubscribeContact = onSnapshot(contactDocRef, (contactDoc) => {
                         if (contactDoc.exists()) {
                            const contactData = { id: contactDoc.id, ...contactDoc.data() } as User;
                            setChat(prev => {
                                const newChat = prev ? {...prev, ...chatDoc.data(), id: chatDoc.id} : chatData;
                                newChat.contact = contactData;
                                return newChat;
                            });
                            
                            if(contactData.blockedUsers?.includes(currentUser.uid)) {
                                setAmIBlocked(true);
                                toast({ variant: 'destructive', title: 'You are blocked', description: 'You cannot send messages to this user.' });
                            } else {
                                setAmIBlocked(false);
                            }
                        }
                    });
                    
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const unsubscribeUser = onSnapshot(userDocRef, (userDoc) => {
                        const userData = userDoc.data();
                        if (userData?.blockedUsers?.includes(contactId)) {
                             setIsBlocked(true);
                        } else {
                            setIsBlocked(false);
                        }
                    });

                    const initialContactDoc = await getDoc(contactDocRef);
                     if (initialContactDoc.exists()) {
                        chatData.contact = { id: initialContactDoc.id, ...initialContactDoc.data() } as User;
                    }

                    setChat(chatData);
                    setLoading(false);
                    return () => {
                        unsubscribeContact();
                        unsubscribeUser();
                    }
                 } else {
                     setChat(chatData);
                 }
                 setLoading(false);
            } else {
                setLoading(false);
                toast({ variant: 'destructive', title: 'Chat not found' });
                router.push('/');
            }
        });

        const messagesColRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesColRef, orderBy('timestamp', 'asc'));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(newMessages);

            const latestMessage = newMessages[newMessages.length - 1];
            if(latestMessage && latestMessage.senderId !== currentUser?.uid && latestMessage.id !== lastProcessedMessageId.current) {
                lastProcessedMessageId.current = latestMessage.id;
                if(isAutoReplyActive) {
                    if (!latestMessage.isAutoReply) {
                        handleAutoReply(latestMessage.text);
                    }
                }
            }
        });

        return () => {
            unsubscribeChat();
            unsubscribeMessages();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, currentUser, router, toast, isAutoReplyActive]);

    const handleAutoReply = async (incomingMessage: string) => {
        if(!chatId || !currentUser) return;
        try {
            const result = await generateReply({ message: incomingMessage });
            if(result.reply) {
                const messagesColRef = collection(db, 'chats', chatId, 'messages');
                await addDoc(messagesColRef, {
                    text: result.reply,
                    senderId: currentUser.uid,
                    timestamp: serverTimestamp(),
                    type: 'text',
                    status: 'sent',
                    isAutoReply: true,
                });
            }
        } catch (error) {
            console.error("Error generating auto-reply:", error);
            toast({
                variant: 'destructive',
                title: 'Auto-Reply Failed',
                description: 'Could not generate an AI reply.',
            });
        }
    }

    useEffect(() => {
        if (!chat?.contact || !currentUser) return;
        markMessagesAsRead(chat.contact.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, chat?.contact, currentUser]);

    const markMessagesAsRead = async (contactId: string) => {
        if (!chatId || !currentUser) return;
    
        const messagesToUpdate = messages.filter(
            (msg) => msg.senderId === contactId && msg.status !== 'read'
        );

        if (messagesToUpdate.length === 0) return;
    
        try {
            const batch = writeBatch(db);
            messagesToUpdate.forEach((msg) => {
                const messageRef = doc(db, 'chats', chatId, 'messages', msg.id);
                batch.update(messageRef, { status: 'read' });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking messages as read: ", error);
        }
    };

    const handleNewMessage = async (messageText: string) => {
        if (!chatId || !messageText.trim() || !currentUser || isBlocked || amIBlocked || isSystemChat) return;
        if (chat?.encrypted) {
            toast({ variant: 'destructive', title: 'Chat is Encrypted', description: 'You must decrypt the chat to send messages.' });
            return;
        }

        const messagesColRef = collection(db, 'chats', chatId, 'messages');
        
        let replyToObject: ReplyTo | null = null;
        if (replyingTo) {
            const senderName = replyingTo.senderId === currentUser.uid ? 'You' : chat?.contact.name || '...';
            replyToObject = {
                messageId: replyingTo.id,
                messageText: replyingTo.text,
                senderId: replyingTo.senderId,
                senderName: senderName,
                type: replyingTo.type,
                fileName: replyingTo.fileName ?? '',
            };
        }

        await addDoc(messagesColRef, {
            text: messageText,
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            type: 'text',
            status: 'sent',
            ...(replyingTo && { replyTo: replyToObject })
        });
        setReplyingTo(null);

        // Send Push Notification
        if (chat.contact?.pushSubscription) {
            try {
                await sendNotification({
                    subscription: chat.contact.pushSubscription,
                    payload: {
                        title: currentUser.name || 'New Message',
                        body: messageText,
                        url: `${window.location.origin}/chat/${chatId}`,
                    }
                });
            } catch (e) {
                console.error("Failed to send push notification", e);
            }
        }
    };
    
    const compressImage = (file: File, quality = 0.7): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL(file.type, quality));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const readFileAsBase64 = (file: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };
    
    const handleSendVoiceMessage = async (audioBase64: string) => {
        if (!chatId || !currentUser || isBlocked || amIBlocked || isSystemChat) return;
        if (chat?.encrypted) {
            toast({ variant: 'destructive', title: 'Chat is Encrypted', description: 'You must decrypt the chat to send files.' });
            return;
        }

        const messagesColRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesColRef, {
            text: '',
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            type: 'audio',
            fileURL: audioBase64,
            fileName: `voice-message-${uuidv4()}.webm`,
        });
    }

    const handleSendFile = async (file: File) => {
        if (!chatId || !currentUser || isBlocked || amIBlocked || isSystemChat) return;
        if (chat?.encrypted) {
            toast({ variant: 'destructive', title: 'Chat is Encrypted', description: 'You must decrypt the chat to send files.' });
            return;
        }
        
        toast({ title: 'Sending file...', description: 'Please wait.' });

        try {
            const isImage = file.type.startsWith('image/');
            const base64 = isImage ? await compressImage(file) : await readFileAsBase64(file);
            
            const messagesColRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesColRef, {
                text: '',
                senderId: currentUser.uid,
                timestamp: serverTimestamp(),
                type: isImage ? 'image' : 'file',
                fileURL: base64,
                fileName: file.name
            });
    
            toast({ title: 'Success!', description: 'File sent successfully.' });

            if (chat.contact?.pushSubscription) {
                try {
                    const body = isImage ? 'Sent an image' : `Sent a file: ${file.name}`;
                    await sendNotification({
                        subscription: chat.contact.pushSubscription,
                        payload: {
                            title: currentUser.name || 'New Message',
                            body: body,
                            url: `${window.location.origin}/chat/${chatId}`,
                        }
                    });
                } catch (e) {
                     console.error("Failed to send push notification for file", e);
                }
            }
        } catch (error: any) {
            console.error("Error sending file:", error);
            const description = error.message.includes('longer than 1048487 bytes')
                ? 'The file is too large to be sent.'
                : 'Could not send the file. Please try again.';
            toast({ variant: 'destructive', title: 'Send Failed', description });
        }
    };

    const handleDeleteChat = async () => {
        if (!chatId) return;
        try {
            await deleteDoc(doc(db, 'chats', chatId));
            toast({ title: 'Chat Deleted', description: 'The conversation has been removed.' });
            router.push('/');
        } catch (error) {
            console.error("Error deleting chat:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the chat.' });
        }
    };

    const handleBlockUser = async () => {
        if (!currentUser || !chat?.contact.id) return;
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
            if (isBlocked) {
                await updateDoc(userDocRef, { blockedUsers: arrayRemove(chat.contact.id) });
                toast({ title: 'User Unblocked', description: `You can now receive messages from ${chat.contact.name}.` });
            } else {
                await updateDoc(userDocRef, { blockedUsers: arrayUnion(chat.contact.id) });
                toast({ title: 'User Blocked', description: `You will no longer receive messages from ${chat.contact.name}.` });
            }
        } catch (error) {
            console.error("Error blocking user:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update block status.' });
        }
    };

    const handleDeleteMessage = async (messageId: string, type: 'me' | 'everyone') => {
        if (!chatId || !currentUser) return;
    
        const messageDocRef = doc(db, 'chats', chatId, 'messages', messageId);
    
        try {
            if (type === 'me') {
                const updatedMessages = messages.filter(m => m.id !== messageId);
                setMessages(updatedMessages);

                toast({ title: 'Message hidden', description: 'The message has been hidden for you.' });
            } else if (type === 'everyone') {
                await updateDoc(messageDocRef, {
                    text: 'This message was deleted.',
                    type: 'text',
                    fileURL: '',
                    fileName: '',
                    isDeleted: true
                });
                toast({ title: 'Message deleted for everyone' });
            }
        } catch (error) {
            console.error("Error deleting message:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the message.' });
        }
    };

    const handleReplyToMessage = (message: Message) => {
        setReplyingTo(message);
    };

    const handleToggleAutoReply = () => {
        const newStatus = !isAutoReplyActive;
        setIsAutoReplyActive(newStatus);
        toast({
            title: `AI Assistant ${newStatus ? 'Enabled' : 'Disabled'}`,
            description: newStatus ? 'The AI will now reply to messages for you.' : 'The AI will no longer reply automatically.',
        });
    };
    
    const handleSetEncryption = async (password: string) => {
        if (!chatId) return;
        try {
            const chatDocRef = doc(db, 'chats', chatId);
            await updateDoc(chatDocRef, {
                encrypted: true,
                chatPassword: password
            });
            toast({ title: "Chat Encrypted", description: "Messages in this chat are now encrypted." });
        } catch (error) {
            console.error("Error setting encryption:", error);
            toast({ variant: 'destructive', title: 'Encryption Failed' });
        }
    };

    const handleDecrypt = async (password: string) => {
        if (!chatId) return false;
        if (password === chat?.chatPassword) {
            const chatDocRef = doc(db, 'chats', chatId);
            await updateDoc(chatDocRef, {
                encrypted: false,
                chatPassword: ''
            });
            toast({ title: "Chat Decrypted", description: "The chat is now decrypted for everyone." });
            return true;
        } else {
            toast({ variant: 'destructive', title: 'Incorrect Password' });
            return false;
        }
    };

    if (loading) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot size={80} className="text-muted-foreground/50 mb-4 animate-pulse" />
                <h1 className="text-2xl font-semibold">Loading Chat...</h1>
                <p className="text-muted-foreground">Please wait while we fetch your conversation.</p>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot size={80} className="text-muted-foreground/50 mb-4" />
                <h1 className="text-2xl font-semibold">Chat not found</h1>
                <p className="text-muted-foreground">The requested chat does not exist or you don't have permission to view it.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <ChatArea
                chat={chat}
                messages={messages}
                onNewMessage={handleNewMessage}
                onSendFile={handleSendFile}
                onSendVoiceMessage={handleSendVoiceMessage}
                onDeleteMessage={handleDeleteMessage}
                onReplyToMessage={handleReplyToMessage}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onSetEncryption={handleSetEncryption}
                onDecrypt={handleDecrypt}
                isBlocked={isBlocked || amIBlocked}
                onDeleteChat={handleDeleteChat}
                onBlockUser={handleBlockUser}
                isSelfBlocked={isBlocked}
                isAutoReplyActive={isAutoReplyActive}
                onToggleAutoReply={handleToggleAutoReply}
                isSystemChat={isSystemChat}
                className="flex-1 min-h-0"
            />
        </div>
    );
}
