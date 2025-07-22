
"use client"

import React, { useState } from 'react';
import { Phone, Video, MoreVertical, ShieldCheck, Waves, Trash2, ShieldX, Shield } from 'lucide-react';
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

export default function ChatHeader({ contact, isEncrypted, setIsEncrypted, onDeleteChat, onBlockUser, isBlocked }: ChatHeaderProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [chatPassword, setChatPassword] = useState<string | null>(null);

  const [showCreatePasswordDialog, setShowCreatePasswordDialog] = useState(false);
  const [showDecryptDialog, setShowDecryptDialog] = useState(false);

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
       <AlertDialog>
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
