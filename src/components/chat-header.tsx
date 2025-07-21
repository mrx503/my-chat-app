
"use client"

import React, { useState } from 'react';
import { Phone, Video, MoreVertical, ShieldQuestion, ShieldCheck, ShieldOff, Waves } from 'lucide-react';
import type { Contact } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from './ui/input';

interface ChatHeaderProps {
  contact: Contact;
  isEncrypted: boolean;
  setIsEncrypted: (isEncrypted: boolean) => void;
}

export default function ChatHeader({ contact, isEncrypted, setIsEncrypted }: ChatHeaderProps) {
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const correctPassword = "password"; // Hardcoded for now

  const handleMicrowaveClick = () => {
    if (isEncrypted) {
      // If it's already encrypted, we need to ask for a password to decrypt
      setShowPasswordDialog(true);
    } else {
      // If it's not encrypted, encrypt it directly
      setIsEncrypted(true);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === correctPassword) {
      setIsEncrypted(false);
      setShowPasswordDialog(false);
      setPassword('');
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  return (
    <>
      <header className="flex items-center p-4 border-b bg-background shadow-sm">
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
          <Button variant="ghost" size="icon" onClick={handleMicrowaveClick}>
             {isEncrypted ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <Waves className="h-5 w-5" />}
             <span className="sr-only">Microwave Chat</span>
          </Button>
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

      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Password to Decrypt</AlertDialogTitle>
            <AlertDialogDescription>
              To view the original messages, please enter the password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input 
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPassword('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordSubmit}>Decrypt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
