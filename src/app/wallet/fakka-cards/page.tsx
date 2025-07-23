
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, collection, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CARD_PRICE = 70;

const OperatorCard = ({ operator, onSelect, disabled }: { operator: string, onSelect: () => void, disabled: boolean }) => (
    <Card className="flex flex-col">
        <CardHeader>
            <CardTitle>{operator}</CardTitle>
            <CardDescription>Get a scratch card for {operator}.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-2xl font-bold flex items-center gap-2">
                <Coins className="h-6 w-6 text-amber-500" />
                {CARD_PRICE}
            </p>
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={onSelect} disabled={disabled}>
                {disabled ? 'Insufficient Coins' : 'Get Card'}
            </Button>
        </CardFooter>
    </Card>
);

export default function FakkaCardsPage() {
    const { currentUser, updateCurrentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const userCoins = currentUser?.coins ?? 0;
    const canAfford = userCoins >= CARD_PRICE;

    const handleSelectOperator = async (operator: 'Vodafone' | 'Etisalat' | 'Orange') => {
        if (!currentUser || !canAfford) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Coins',
                description: `You need at least ${CARD_PRICE} coins to get a card.`,
            });
            return;
        }

        setIsLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const requestsColRef = collection(db, 'withdrawalRequests');

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("User data not found.");
                
                const latestCoins = userDoc.data().coins ?? 0;
                if (latestCoins < CARD_PRICE) throw new Error("You don't have enough coins.");

                const newBalance = latestCoins - CARD_PRICE;
                transaction.update(userDocRef, { coins: newBalance });

                const newRequestRef = doc(requestsColRef);
                transaction.set(newRequestRef, {
                    userId: currentUser.uid,
                    email: currentUser.email,
                    type: 'fakka-card',
                    operator: operator,
                    amount: CARD_PRICE,
                    status: 'pending',
                    createdAt: new Date(),
                });
            });

            updateCurrentUser({ coins: userCoins - CARD_PRICE });

            toast({
                title: 'Request Submitted!',
                description: `Your request for a ${operator} card has been sent. You will receive the card via a system message shortly.`,
            });
            router.push('/wallet');

        } catch (error: any) {
            console.error("Error submitting Fakka card request:", error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Loading or not logged in...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-muted/40">
            <header className="flex items-center p-4 bg-background border-b shadow-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold ml-4">Get a Fakka Card</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Choose Your Operator</CardTitle>
                            <CardDescription>Your current balance is {userCoins} coins. Each card costs {CARD_PRICE} coins.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {!canAfford && (
                                <Alert variant="destructive" className="mb-4">
                                    <Coins className="h-4 w-4" />
                                    <AlertTitle>Insufficient Balance</AlertTitle>
                                    <AlertDescription>
                                        You need at least {CARD_PRICE} coins. Earn more by watching ads in your wallet.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                               <OperatorCard operator="Vodafone" onSelect={() => handleSelectOperator('Vodafone')} disabled={!canAfford || isLoading} />
                               <OperatorCard operator="Etisalat" onSelect={() => handleSelectOperator('Etisalat')} disabled={!canAfford || isLoading} />
                               <OperatorCard operator="Orange" onSelect={() => handleSelectOperator('Orange')} disabled={!canAfford || isLoading} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
