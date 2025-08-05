// This file is new
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">{title}</h2>
        <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
            {children}
        </div>
        <Separator className="my-4"/>
    </div>
);

export default function PrivacyPolicyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Privacy Policy
                </h1>
            </header>
            <main className="p-4 md:p-6">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Privacy Policy for duck App</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Section title="1. Introduction">
                            <p>We value your trust and are committed to protecting your privacy and personal data.</p>
                            <p>This policy explains how we collect, use, and store the information you provide when using our application.</p>
                        </Section>
                        
                        <Section title="2. Information We Collect">
                            <p>When you use the app, we may collect the following information:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Name, email, or phone number (upon registration).</li>
                                <li>Technical information such as device type, operating system, language, and IP address.</li>
                                <li>Usage behavior within the app (e.g., pages you visit).</li>
                                <li>Advertising data (if ads are activated later).</li>
                            </ul>
                        </Section>

                        <Section title="3. Use of Information">
                            <p>We use the data we collect to:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Create and manage your account.</li>
                                <li>Improve the user experience within the app.</li>
                                <li>Better personalize content and ads for you.</li>
                                <li>Maintain the security of accounts and the system.</li>
                            </ul>
                        </Section>

                        <Section title="4. Data Sharing">
                           <ul className="list-disc list-inside space-y-1">
                                <li>We do not sell or rent your data to any third party.</li>
                                <li>We may partner with advertising companies (like Google AdMob) that may use some data (such as device type or general interests) to display personalized ads.</li>
                                <li>We do not share your personal data with any third party without your consent.</li>
                            </ul>
                        </Section>

                        <Section title="5. Data Protection">
                            <p>We use technical and administrative security measures to protect your data from unauthorized access, modification, or destruction.</p>
                        </Section>

                        <Section title="6. User Content">
                            <ul className="list-disc list-inside space-y-1">
                                <li>You are responsible for any content you upload to the application.</li>
                                <li>Publishing any content that contains indecent, unethical, or illegal materials is prohibited.</li>
                                <li>The administration has the right to delete content or ban the offending account immediately without prior notice.</li>
                            </ul>
                        </Section>

                        <Section title="7. Rewards for Watching Ads">
                           <ul className="list-disc list-inside space-y-1">
                                <li>We may offer an incentive system where the user receives symbolic rewards (like points or virtual credit) for watching ads to completion.</li>
                                <li>Rewards are granted automatically after verifying the ad was watched in its entirety.</li>
                                <li>These rewards are not a direct financial obligation or a legal right.</li>
                                <li>No rewards are given if the ad is skipped or exited before it ends.</li>
                            </ul>
                        </Section>

                         <Section title="8. Modifications">
                            <p>We may update this policy from time to time, and users will be notified of any changes within the app or via email.</p>
                        </Section>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
