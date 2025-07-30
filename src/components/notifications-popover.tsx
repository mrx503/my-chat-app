
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AppNotification } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsPopoverProps {
    notifications: AppNotification[];
    unreadCount: number;
    onMarkRead: () => void;
}

const NotificationIcon = ({ type }: { type: AppNotification['type'] }) => {
    switch(type) {
        case 'like':
            return <Heart className="h-4 w-4 text-red-500" />;
        case 'comment':
            return <MessageCircle className="h-4 w-4 text-blue-500" />;
        case 'follow':
            return <UserPlus className="h-4 w-4 text-green-500" />;
        default:
            return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
};

const getNotificationText = (n: AppNotification) => {
    switch(n.type) {
        case 'like':
            return <><strong>{n.senderName}</strong> liked your clip.</>;
        case 'comment':
            return <><strong>{n.senderName}</strong> commented: <span className="italic">"{n.message}"</span></>;
        case 'follow':
            return <><strong>{n.senderName}</strong> started following you.</>;
        default:
            return "You have a new notification.";
    }
};

export default function NotificationsPopover({ notifications, unreadCount, onMarkRead }: NotificationsPopoverProps) {
    const router = useRouter();

    const handleNotificationClick = (n: AppNotification) => {
        // Mark as read is handled on popover open, but you could add specific logic here
        switch(n.type) {
            case 'like':
            case 'comment':
                router.push('/clips'); // Ideally navigate to the specific clip
                break;
            case 'follow':
                router.push(`/profile/${n.senderId}`);
                break;
            default:
                break;
        }
    };
    
    return (
        <Popover onOpenChange={(open) => { if (open && unreadCount > 0) onMarkRead() }}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-11 w-11">
                    <Bell className="h-7 w-7" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs">{unreadCount}</Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 border-b">
                    <h4 className="font-medium text-sm">Notifications</h4>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground p-8">
                            <p>No new notifications yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "w-full text-left p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors",
                                        !n.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="relative mt-1">
                                         <Avatar className="h-9 w-9">
                                            <AvatarImage src={n.senderAvatar} />
                                            <AvatarFallback>{n.senderName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                                            <NotificationIcon type={n.type} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">{getNotificationText(n)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {n.timestamp && n.timestamp.toDate && formatDistanceToNow(n.timestamp.toDate(), { addSuffix: true })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                 <div className="p-2 border-t text-center">
                    <Button variant="link" size="sm" onClick={() => { /* Implement view all */ }}>
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
