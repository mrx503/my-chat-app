
"use client"

import React, { useState } from 'react';
import { Phone, Video, MoreVertical, ShieldCheck, Waves } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ChatHeaderProps {
  contact: Contact;
  isEncrypted: boolean;
  setIsEncrypted: (isEncrypted: boolean) => void;
}

export default function ChatHeader({ contact, isEncrypted, setIsEncrypted }: ChatHeaderProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [chatPassword, setChatPassword] = useState<string | null>(null);

  const [showCreatePasswordDialog, setShowCreatePasswordDialog] = useState(false);
  const [showDecryptDialog, setShowDecryptDialog] = useState(false);

  const handleMicrowaveClick = () => {
    if (isEncrypted) {
      // If encrypted, show decrypt dialog
      setShowDecryptDialog(true);
    } else {
      // If not encrypted, check if password exists
      if (chatPassword) {
        // Password exists, just encrypt
        setIsEncrypted(true);
      } else {
        // No password set for this chat yet, show create password dialog
        setShowCreatePasswordDialog(true);
      }
    }
  };

  const handleCreatePassword = () => {
    if (password && password === confirmPassword) {
      setChatPassword(password);
      setIsEncrypted(true);
      setShowCreatePasswordDialog(false);
      setPassword('');
      setConfirmPassword('');
    } else {
      alert('Passwords do not match or are empty.');
    }
  };

  const handlePasswordSubmit = () => {
    if (password === chatPassword) {
      setIsEncrypted(false);
      setShowDecryptDialog(false);
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
      
      {/* Create Password Dialog */}
      <AlertDialog open={showCreatePasswordDialog} onOpenChange={setShowCreatePasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create a Password</AlertDialogTitle>
            <AlertDialogDescription>
              To encrypt this chat, please create a password. You will need this to decrypt the messages later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input 
                id="new-password"
                type="password"
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePassword()}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPassword(''); setConfirmPassword(''); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreatePassword}>Create and Encrypt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decrypt Dialog */}
      <AlertDialog open={showDecryptDialog} onOpenChange={setShowDecryptDialog}>
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
