// This file is new
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';

const CONTACT_EMAIL = 'dduckapp@gmail.com';

export default function ContactUsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Contact Us
                </h1>
            </header>
            <main className="p-4 md:p-6 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                           <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="mt-4">Get in Touch</CardTitle>
                        <CardDescription>
                            For any inquiries or complaints, please contact us via email. We're here to help!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground">You can reach our support team at:</p>
                        <a 
                            href={`mailto:${CONTACT_EMAIL}`}
                            className="text-lg font-semibold text-primary hover:underline"
                        >
                            {CONTACT_EMAIL}
                        </a>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
