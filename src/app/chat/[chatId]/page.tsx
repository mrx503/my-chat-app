
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Chat, Message, User } from '@/lib/types';
import ChatArea from '@/components/chat-area';
import { Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const chatId = params.chatId as string;
    const { toast } = useToast();

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [amIBlocked, setAmIBlocked] = useState(false);

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
                
                 const contactId = chatData.users.find(id => id !== currentUser.uid);
                 if(contactId) {
                    const contactDocRef = doc(db, 'users', contactId);
                    const unsubscribeContact = onSnapshot(contactDocRef, (contactDoc) => {
                         if (contactDoc.exists()) {
                            const contactData = { id: contactDoc.id, ...contactDoc.data() } as User;
                            setChat(prev => ({...prev!, contact: contactData}));
                            
                            // Check if the current user is blocked by the contact
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

                    // Initial fetch for chat contact
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
        });

        setIsEncrypted(false);

        return () => {
            unsubscribeChat();
            unsubscribeMessages();
        };
    }, [chatId, currentUser, router, toast]);

    const handleNewMessage = async (messageText: string) => {
        if (!chatId || !messageText.trim() || !currentUser || isBlocked || amIBlocked) return;

        const messagesColRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesColRef, {
            text: messageText,
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
            type: 'text',
        });
    };
    
    const handleSendFile = async (file: File) => {
        if (!chatId || !currentUser || isBlocked || amIBlocked) return;

        toast({ title: 'Uploading...', description: 'Please wait while your file is being uploaded.' });

        try {
            const storageRef = ref(storage, `chat_attachments/${chatId}/${Date.now()}_${file.name}`);
            const uploadTask = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadTask.ref);

            const messagesColRef = collection(db, 'chats', chatId, 'messages');
            await addDoc(messagesColRef, {
                text: '',
                senderId: currentUser.uid,
                timestamp: serverTimestamp(),
                type: file.type.startsWith('image/') ? 'image' : 'file',
                fileURL: downloadURL,
                fileName: file.name,
            });
            
            toast({ title: 'Success!', description: 'File sent successfully.' });
        } catch (error) {
            console.error("Error uploading file:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the file.' });
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
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            <main className="flex-1 flex flex-col bg-muted/30">
                <ChatArea
                  chat={{ ...chat, messages }}
                  onNewMessage={handleNewMessage}
                  onSendFile={handleSendFile}
                  isEncrypted={isEncrypted}
                  setIsEncrypted={setIsEncrypted}
                  isBlocked={isBlocked || amIBlocked}
                  onDeleteChat={handleDeleteChat}
                  onBlockUser={handleBlockUser}
                  isSelfBlocked={isBlocked}
                />
            </main>
        </div>
    );
}
