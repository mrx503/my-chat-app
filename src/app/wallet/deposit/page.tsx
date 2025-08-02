
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, DollarSign, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const VODAFONE_CASH_NUMBER = '01020530384';

export default function DepositPage() {
    const { currentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [senderNumber, setSenderNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(VODAFONE_CASH_NUMBER);
        toast({ title: 'Copied!', description: 'The number has been copied to your clipboard.' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentUser) {
            setError('You must be logged in to make a deposit request.');
            return;
        }

        const numericAmount = Number(amount);

        if (!senderNumber.trim() || !/^\d{11}$/.test(senderNumber.trim())) {
            setError('Please enter a valid 11-digit Vodafone number.');
            return;
        }
        if (!amount || numericAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        
        setIsLoading(true);
        const requestsColRef = collection(db, 'depositRequests');

        try {
            await addDoc(requestsColRef, {
                userId: currentUser.uid,
                email: currentUser.email,
                senderVodafoneNumber: senderNumber.trim(),
                amount: numericAmount,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            toast({
                title: 'Request Submitted',
                description: 'Your deposit request has been sent for review. The coins will be added after confirmation.',
            });
            router.push('/wallet');

        } catch (error: any) {
            console.error("Error submitting deposit request:", error);
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
                    <DollarSign className="h-5 w-5" />
                    Deposit Request
                </h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-md mx-auto">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Submit a Deposit Request</CardTitle>
                                <CardDescription>Transfer the desired amount to the number below, then fill out this form.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Alert>
                                    <AlertTitle className="flex items-center justify-between">
                                        <span>Transfer to this Number</span>
                                        <Button type="button" variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </AlertTitle>
                                    <AlertDescription className="text-lg font-mono font-bold text-center py-2">
                                        {VODAFONE_CASH_NUMBER}
                                    </AlertDescription>
                                </Alert>
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Your Email</Label>
                                    <Input id="email" type="email" value={currentUser.email ?? ''} readOnly disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vodafone-number">The number you sent from</Label>
                                    <Input 
                                        id="vodafone-number" 
                                        type="tel" 
                                        placeholder="e.g., 01012345678" 
                                        value={senderNumber}
                                        onChange={(e) => setSenderNumber(e.target.value)}
                                        required 
                                        maxLength={11}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount Sent (EGP)</Label>
                                    <Input 
                                        id="amount" 
                                        type="text"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        placeholder="e.g., 100"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        required 
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full" disabled={isLoading}>
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
