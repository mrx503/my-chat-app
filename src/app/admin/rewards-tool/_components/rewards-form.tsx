"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { simulateAdRewards } from '../actions';

export default function RewardsForm() {
    const [clickCount, setClickCount] = useState<number>(10);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await simulateAdRewards(clickCount);
            if (result.success) {
                toast({ 
                    title: 'Simulation Complete!', 
                    description: `${result.message}. Check the Users table for updated balances.`
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ 
                variant: 'destructive', 
                title: 'Simulation Failed', 
                description: error.message 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div className="space-y-2">
                <Label htmlFor="click-count">Number of Simulated Ad Views</Label>
                <Input
                    id="click-count"
                    type="number"
                    value={clickCount}
                    onChange={(e) => setClickCount(Number(e.target.value))}
                    min="1"
                    max="100" // Set a reasonable max to prevent performance issues
                    required
                />
                 <p className="text-xs text-muted-foreground">Each view grants 0.25 coins to a random user.</p>
            </div>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                Run Simulation
            </Button>
        </form>
    );
}
