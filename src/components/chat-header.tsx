
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Video, MoreVertical, ShieldCheck, Waves, Trash2, ShieldX, Shield, ArrowLeft } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ChatHeaderProps {
  contact: Contact;
  isEncrypted: boolean;
  setIsEncrypted: (isEncrypted: boolean) => void;
  onDeleteChat: () => void;
  onBlockUser: () => void;
  isBlocked: boolean;
}

function formatLastSeen(timestamp?: any) {
    if (!timestamp) return 'Offline';
    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffSeconds < 60) return 'last seen just now';
        
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `last seen ${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return `last seen yesterday`;
        
        return `last seen on ${date.toLocaleDateString()}`;

    } catch (e) {
        return 'Offline';
    }
}


export default function ChatHeader({ contact, isEncrypted, setIsEncrypted, onDeleteChat, onBlockUser, isBlocked }: ChatHeaderProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [chatPassword, setChatPassword] = useState<string | null>(null);

  const [showCreatePasswordDialog, setShowCreatePasswordDialog] = useState(false);
  const [showDecryptDialog, setShowDecryptDialog] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (contact?.privacySettings?.showOnlineStatus === false) {
        setStatus('');
        return;
    }

    if (contact.online) {
        setStatus('Online');
    } else {
        if(contact?.privacySettings?.showLastSeen === false) {
             setStatus('Offline');
        } else {
            setStatus(formatLastSeen(contact.lastSeen));
        }
    }
  }, [contact]);


  const handleMicrowaveClick = () => {
    if (isEncrypted) {
      setShowDecryptDialog(true);
    } else {
      if (chatPassword) {
        setIsEncrypted(true);
      } else {
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
      <AlertDialog>
        <header className="flex items-center p-4 border-b bg-background shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="profile picture" />
              <AvatarFallback>{contact.name ? contact.name.charAt(0) : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{contact.name}</h2>
              <p className="text-sm text-muted-foreground">{status}</p>
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Chat</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onBlockUser}>
                  {isBlocked ? <Shield className="mr-2 h-4 w-4" /> : <ShieldX className="mr-2 h-4 w-4" />}
                  <span>{isBlocked ? 'Unblock' : 'Block'} User</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>
        
        {/* Delete Chat Confirmation */}
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the chat history.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteChat} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
