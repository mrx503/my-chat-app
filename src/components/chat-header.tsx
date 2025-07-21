"use client"

import React from 'react';
import { Phone, Video, MoreVertical, Menu } from 'lucide-react';

import type { Contact } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ChatHeaderProps {
  contact: Contact;
  children: React.ReactNode;
}

export default function ChatHeader({ contact, children }: ChatHeaderProps) {
  return (
    <header className="flex items-center p-4 border-b bg-background shadow-sm">
        <div className="md:hidden">
             <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open contacts menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[340px]">
                   {children}
                </SheetContent>
            </Sheet>
        </div>
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="profile picture" />
          <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{contact.name}</h2>
          <p className="text-sm text-muted-foreground">{contact.online ? 'Online' : 'Offline'}</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
