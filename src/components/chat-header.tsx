
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MoreVertical, ShieldCheck, ShieldOff, Trash2, ShieldX, Shield, ArrowLeft } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface ChatHeaderProps {
  contact: Contact;
  isEncrypted: boolean;
  onSetEncryption: (password: string) => void;
  onDecrypt: (password: string) => Promise<boolean>;
  onDeleteChat: () => void;
  onBlockUser: () => void;
  isBlocked: boolean;
  isSystemChat: boolean;
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


export default function ChatHeader({ 
    contact, isEncrypted, 
    onSetEncryption, onDecrypt,
    onDeleteChat, onBlockUser, isBlocked, isSystemChat 
}: ChatHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCreatePasswordDialog, setShowCreatePasswordDialog] = useState(false);
  const [showDecryptDialog, setShowDecryptDialog] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (isSystemChat) {
      setStatus('Official System Channel');
      return;
    }

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
  }, [contact, isSystemChat]);

  const handleEncryptionClick = () => {
    if (isEncrypted) {
      setShowDecryptDialog(true);
    } else {
      setShowCreatePasswordDialog(true);
    }
  };

  const handleCreatePassword = () => {
    if (password && password === confirmPassword) {
      onSetEncryption(password);
      setShowCreatePasswordDialog(false);
      setPassword('');
      setConfirmPassword('');
    } else {
      toast({
          variant: 'destructive',
          title: 'Passwords do not match or are empty.',
      });
    }
  };

  const handlePasswordSubmit = async () => {
    const success = await onDecrypt(password);
    if (success) {
        setShowDecryptDialog(false);
        setPassword('');
    } else {
        setPassword('');
    }
  };
  
  const handleCallClick = () => {
    toast({
        title: "Feature Coming Soon!",
        description: "Voice and video calls will be available in a future update.",
    })
  }
  
  const encryptionIcon = isEncrypted 
    ? <ShieldCheck className="h-5 w-5 text-amber-500" /> 
    : <ShieldOff className="h-5 w-5" />;

  return (
    <>
      <AlertDialog>
        <header className="flex items-center p-4 border-b bg-background shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push('/chats')}>
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
            {!isSystemChat && (
              <>
                <Button variant="ghost" size="icon" onClick={handleEncryptionClick}>
                  {encryptionIcon}
                  <span className="sr-only">Toggle Chat Encryption</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCallClick}>
                  <Phone className="h-5 w-5" />
                </Button>
              </>
            )}
            
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
                {!isSystemChat && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onBlockUser}>
                      {isBlocked ? <Shield className="mr-2 h-4 w-4" /> : <ShieldX className="mr-2 h-4 w-4" />}
                      <span>{isBlocked ? 'Unblock' : 'Block'} User</span>
                    </DropdownMenuItem>
                  </>
                )}
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
            <AlertDialogTitle>Encrypt Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Create a password to encrypt this chat for all participants. You will need this password to decrypt it later.
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
            <AlertDialogAction onClick={handleCreatePassword}>Encrypt Chat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decrypt Dialog */}
      <AlertDialog open={showDecryptDialog} onOpenChange={setShowDecryptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Password to Decrypt</AlertDialogTitle>
            <AlertDialogDescription>
              To decrypt this chat for everyone, please enter the password.
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
            <AlertDialogAction onClick={handlePasswordSubmit}>Decrypt for Everyone</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
