
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Landmark, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, collection, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MIN_WITHDRAWAL_AMOUNT = 500;

export default function VodafoneCashPage() {
    const { currentUser, updateCurrentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [vodafoneNumber, setVodafoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const userCoins = currentUser?.coins ?? 0;
    const canWithdraw = userCoins >= MIN_WITHDRAWAL_AMOUNT;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers
        if (/^\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentUser) {
            setError('You must be logged in to make a withdrawal.');
            return;
        }

        const numericAmount = Number(amount);
        const currentCoins = currentUser.coins ?? 0;

        // --- Start of Critical Validation Block ---
        if (!vodafoneNumber.trim() || !/^\d{11}$/.test(vodafoneNumber.trim())) {
            setError('Please enter a valid 11-digit Vodafone number.');
            return;
        }
        if (!amount || numericAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (currentCoins < MIN_WITHDRAWAL_AMOUNT) {
            setError(`You need at least ${MIN_WITHDRAWAL_AMOUNT} coins to make a withdrawal.`);
            return;
        }
        if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
             setError(`The minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} coins.`);
            return;
        }
        if (numericAmount > currentCoins) {
            setError("You don't have enough coins for this withdrawal.");
            return;
        }
        // --- End of Critical Validation Block ---

        setIsLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const requestsColRef = collection(db, 'withdrawalRequests');

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                
                if (!userDoc.exists()) {
                    throw new Error("User data not found.");
                }
                
                const latestCoins = userDoc.data().coins ?? 0;

                if (latestCoins < numericAmount) {
                    throw new Error("You don't have enough coins for this withdrawal.");
                }

                // 1. Deduct coins from user's balance
                const newBalance = latestCoins - numericAmount;
                transaction.update(userDocRef, { coins: newBalance });

                // 2. Create withdrawal request
                const newRequestRef = doc(requestsColRef);
                transaction.set(newRequestRef, {
                    userId: currentUser.uid,
                    email: currentUser.email,
                    type: 'vodafone-cash',
                    vodafoneNumber: vodafoneNumber.trim(),
                    amount: numericAmount,
                    status: 'pending',
                    createdAt: new Date(),
                });
            });

            // Optimistically update local state
            updateCurrentUser({ coins: currentCoins - numericAmount });

            toast({
                title: 'Request Submitted',
                description: 'Your withdrawal request has been sent for review. It may take up to 24 hours.',
            });
            router.push('/wallet');

        } catch (error: any) {
            console.error("Error submitting withdrawal request:", error);
            const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: errorMessage,
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
                <h1 className="text-xl font-bold ml-4 flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    Vodafone Cash Withdrawal
                </h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-md mx-auto">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Submit a Withdrawal Request</CardTitle>
                                <CardDescription>Your current balance is {userCoins} coins. The minimum withdrawal is {MIN_WITHDRAWAL_AMOUNT} coins.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                 {!canWithdraw && (
                                    <Alert variant="destructive">
                                        <Coins className="h-4 w-4" />
                                        <AlertTitle>Insufficient Balance</AlertTitle>
                                        <AlertDescription>
                                            You need at least {MIN_WITHDRAWAL_AMOUNT} coins to make a withdrawal request. Earn more by watching ads in your wallet.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={currentUser.email ?? ''} readOnly disabled />
                                    <p className="text-xs text-muted-foreground">This is the email associated with your account.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vodafone-number">Vodafone Cash Number</Label>
                                    <Input 
                                        id="vodafone-number" 
                                        type="tel" 
                                        placeholder="e.g., 01012345678" 
                                        value={vodafoneNumber}
                                        onChange={(e) => setVodafoneNumber(e.target.value)}
                                        required 
                                        maxLength={11}
                                        disabled={!canWithdraw}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (in Coins)</Label>
                                    <Input 
                                        id="amount" 
                                        type="text"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        placeholder={canWithdraw ? `e.g., ${MIN_WITHDRAWAL_AMOUNT}`: 'Insufficient balance'}
                                        value={amount}
                                        onChange={handleAmountChange}
                                        required 
                                        disabled={!canWithdraw}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full" disabled={isLoading || !canWithdraw}>
                                    {isLoading ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            </main>
        </div>
    );
}
