
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Coins, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyAccount } from './actions';

const VERIFICATION_COST = 500;

export default function VerifyPage() {
    const { currentUser, updateCurrentUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    if (!currentUser) {
        // This will be handled by the auth context redirecting to /login
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const userCoins = currentUser.coins ?? 0;
    const isVerified = currentUser.isVerified ?? false;
    const canAfford = userCoins >= VERIFICATION_COST;

    const handleVerification = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const result = await verifyAccount(currentUser.uid);
            if (result.success) {
                toast({
                    title: 'Congratulations!',
                    description: 'Your account has been successfully verified.',
                });
                // Optimistically update the user context
                updateCurrentUser({ 
                    isVerified: true,
                    coins: userCoins - VERIFICATION_COST
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-muted/40">
            <header className="flex items-center p-4 bg-background border-b shadow-sm sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold ml-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Account Verification
                </h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-md mx-auto">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <ShieldCheck className="h-16 w-16 text-primary mb-2"/>
                            <CardTitle className="text-2xl">Get Verified!</CardTitle>
                            <CardDescription>
                                Stand out from the crowd with a verification badge next to your name.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isVerified ? (
                                <Alert variant="success">
                                    <ShieldCheck className="h-4 w-4" />
                                    <AlertTitle>You are already verified!</AlertTitle>
                                    <AlertDescription>
                                        The verification badge is active on your profile.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <>
                                    <Alert>
                                        <Coins className="h-4 w-4" />
                                        <AlertTitle>One-Time Fee</AlertTitle>
                                        <AlertDescription>
                                            Account verification costs a one-time fee of <strong>{VERIFICATION_COST} coins</strong>. Your current balance is <strong>{userCoins} coins</strong>.
                                        </AlertDescription>
                                    </Alert>
                                    {!canAfford && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Insufficient Balance</AlertTitle>
                                            <AlertDescription>
                                                You need at least {VERIFICATION_COST} coins to get verified. You can add more from your wallet.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button 
                                type="button" 
                                className="w-full" 
                                disabled={isLoading || isVerified || !canAfford}
                                onClick={handleVerification}
                                size="lg"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : isVerified ? (
                                    'Account Verified'
                                ) : (
                                    `Verify for ${VERIFICATION_COST} Coins`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
