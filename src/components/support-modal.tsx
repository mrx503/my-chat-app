
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Star, Gem, Crown, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, runTransaction, collection, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import type { User, Clip, Post, AppNotification } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Clip | Post; // Can be a Clip or a Post
  sender: User & { uid: string };
  onTransactionComplete: (newBalance: number) => void;
  isPost?: boolean;
}

const gifts = [
  { id: 'rose', name: 'Rose', cost: 5, icon: <Gem className="h-8 w-8 text-pink-400" /> },
  { id: 'star', name: 'Star', cost: 25, icon: <Star className="h-8 w-8 text-yellow-400" /> },
  { id: 'heart', name: 'Heart', cost: 100, icon: <Heart className="h-8 w-8 text-red-500" /> },
  { id: 'crown', name: 'Crown', cost: 500, icon: <Crown className="h-8 w-8 text-amber-500" /> },
];

export default function SupportModal({ isOpen, onClose, recipient, sender, onTransactionComplete, isPost = false }: SupportModalProps) {
  const [selectedGift, setSelectedGift] = useState<(typeof gifts)[0] | null>(gifts[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const senderBalance = sender.coins ?? 0;
  const canAfford = selectedGift ? senderBalance >= selectedGift.cost : false;
  const resourceType = isPost ? 'post' : 'clip';

  const handleSendGift = async () => {
    if (!selectedGift || !canAfford) {
      toast({ variant: 'destructive', title: 'Insufficient Balance', description: "You don't have enough coins to send this gift." });
      return;
    }
    
    setIsProcessing(true);

    const senderRef = doc(db, 'users', sender.uid);
    const recipientRef = doc(db, 'users', recipient.uploaderId);

    try {
      await runTransaction(db, async (transaction) => {
        const senderDoc = await transaction.get(senderRef);
        if (!senderDoc.exists() || (senderDoc.data().coins ?? 0) < selectedGift.cost) {
          throw new Error("You don't have enough coins.");
        }

        const currentSenderBalance = senderDoc.data().coins ?? 0;
        const newSenderBalance = currentSenderBalance - selectedGift.cost;
        
        // Perform the transfer
        transaction.update(senderRef, { coins: newSenderBalance });
        transaction.update(recipientRef, { coins: increment(selectedGift.cost) });

        // Create notification
        const notifRef = doc(collection(db, 'notifications'));
        const newNotification: Partial<AppNotification> = {
            recipientId: recipient.uploaderId,
            senderId: sender.uid,
            senderName: sender.name || sender.email!,
            senderAvatar: sender.avatar,
            type: 'gift',
            resourceId: recipient.id,
            message: `Sent you a ${selectedGift.name} worth ${selectedGift.cost} coins!`,
            read: false,
            timestamp: serverTimestamp() as any,
        };
        transaction.set(notifRef, newNotification);
      });
      
      const finalBalance = senderBalance - selectedGift.cost;
      onTransactionComplete(finalBalance);

      toast({
        title: 'Gift Sent!',
        description: `You successfully sent a ${selectedGift.name} to ${recipient.uploaderName}.`,
      });
      onClose();

    } catch (error: any) {
      console.error("Error sending gift:", error);
      toast({ variant: 'destructive', title: 'Transaction Failed', description: error.message || 'Could not complete the transaction.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Gift to {recipient.uploaderName}</DialogTitle>
          <DialogDescription>
            Show your support for this {resourceType}! Your current balance is {senderBalance} coins.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            <div className="grid grid-cols-4 gap-4">
                {gifts.map(gift => (
                    <button 
                        key={gift.id}
                        onClick={() => setSelectedGift(gift)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                            selectedGift?.id === gift.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                        )}
                        disabled={isProcessing}
                    >
                        {gift.icon}
                        <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-yellow-500"/>
                            <span className="text-sm font-semibold">{gift.cost}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handleSendGift} disabled={isProcessing || !canAfford || !selectedGift}>
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
                {isProcessing ? 'Sending...' : `Send ${selectedGift?.name || 'Gift'}`}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
