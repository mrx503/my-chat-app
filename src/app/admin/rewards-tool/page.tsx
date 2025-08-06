import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';
import RewardsForm from './_components/rewards-form';

export default function AdminRewardsToolPage() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ad Rewards Simulation Tool</CardTitle>
                    <CardDescription>
                       Safely test your ad reward system by granting coins to random users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive" className="mb-6">
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle>Important Notice</AlertTitle>
                        <AlertDescription>
                            This tool is for testing purposes only. It simulates reward distribution and does NOT interact with any real ad networks. Using automated tools to interact with live ads violates their terms of service and will lead to an account ban.
                        </AlertDescription>
                    </Alert>
                    <RewardsForm />
                </CardContent>
            </Card>
        </div>
    );
}
