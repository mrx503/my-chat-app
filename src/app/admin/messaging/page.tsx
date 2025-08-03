// This file is new
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import MessagingForm from './_components/messaging-form';
import { getUsers } from './actions';

export default async function AdminMessagingPage() {
    const users = await getUsers();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>System Messaging</CardTitle>
                    <CardDescription>
                       Send messages to individual users or broadcast to everyone. Messages will appear in their System Chat.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MessagingForm allUsers={users} />
                </CardContent>
            </Card>
        </div>
    );
}
