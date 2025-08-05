
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Coins, Landmark, DollarSign, CreditCard } from 'lucide-react';

const ServiceCard = ({ icon, title, description, action, disabled }: { icon: React.ReactNode, title: string, description: string, action?: () => void, disabled?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="bg-primary/10 p-3 rounded-full">
                {icon}
            </div>
            <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
        </CardHeader>
        <CardFooter>
            <Button className="w-full" variant="secondary" onClick={action} disabled={disabled || !action}>
                {action && !disabled ? 'Go' : 'Coming Soon'}
            </Button>
        </CardFooter>
    </Card>
);

export default function WalletPage() {
    const { currentUser, updateCurrentUser } = useAuth();
    const router = useRouter();

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
                <h1 className="text-xl font-bold ml-4">My Wallet</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                        <CardHeader>
                            <CardDescription className="text-primary-foreground/80">Current Balance</CardDescription>
                            <CardTitle className="text-4xl lg:text-5xl font-bold flex items-center gap-3">
                                <Coins className="h-10 w-10"/>
                                {currentUser.coins || 0}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>You can earn more coins by letting users watch ads on your posts.</p>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight">Services</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <ServiceCard 
                                icon={<DollarSign className="h-6 w-6 text-primary"/>}
                                title="Deposit"
                                description="Add more coins to your wallet."
                                action={() => router.push('/wallet/deposit')}
                           />
                           <ServiceCard 
                                icon={<Landmark className="h-6 w-6 text-primary"/>}
                                title="Vodafone Cash"
                                description="Transfer coins to your Vodafone Cash wallet."
                                action={() => router.push('/wallet/vodafone-cash')}
                           />
                            <ServiceCard 
                                icon={<CreditCard className="h-6 w-6 text-primary"/>}
                                title="PayPal"
                                description="Transfer funds to your PayPal account."
                                disabled
                           />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
