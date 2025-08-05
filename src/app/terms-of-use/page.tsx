// This file is new
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">{title}</h2>
        <div className="text-muted-foreground leading-relaxed text-sm space-y-2">
            {children}
        </div>
        <Separator className="my-4"/>
    </div>
);

export default function TermsOfUsePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-muted/40">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Terms of Use
                </h1>
            </header>
            <main className="p-4 md:p-6">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Terms and Conditions for using duck App</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Section title="1. Content Ownership and Responsibility">
                            <p>When you upload any content (video, image, reel, comment, post...) to the platform, you acknowledge and confirm that:</p>
                             <ul className="list-disc list-inside space-y-1">
                                <li>The content is your own creation, or you have the full legal rights to upload and publish it.</li>
                                <li>The content does not contain any third-party copyrighted material unless you are authorized to use it.</li>
                            </ul>
                            <Alert variant="destructive" className="mt-2">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Warning</AlertTitle>
                                <AlertDescription>
                                    If you upload any content for which you do not own the rights or have legal permission, you bear full legal responsibility and release the platform administration from any claims or complaints arising from it.
                                </AlertDescription>
                            </Alert>
                        </Section>

                        <Section title="2. Inappropriate and Prohibited Content">
                            <p>It is strictly forbidden to publish or upload any content that contains:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Scenes that are indecent or offensive to public morals.</li>
                                <li>Violence, hate speech, harassment, threats, or violation of others' rights.</li>
                            </ul>
                            <p className="mt-2">The platform administration reserves the full right to:</p>
                             <ul className="list-disc list-inside space-y-1">
                                <li>Delete any infringing content immediately and without notice.</li>
                                <li>Permanently ban the offending account, whether it belongs to the content owner or a participant.</li>
                            </ul>
                        </Section>

                        <Section title="3. Reels and Videos System">
                            <p>The platform allows users to upload short videos (reels) similar to social video applications.</p>
                            <p>By using this feature, you agree that:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>The videos are original and do not infringe on the rights of others.</li>
                                <li>The video may be subject to review before publication or deletion in case of violation.</li>
                                <li>The platform is not responsible for the content uploaded by users but reserves the right to intervene and delete it at any time.</li>
                            </ul>
                        </Section>

                        <Section title="4. Reporting System">
                            <p>The platform provides a button to report any infringing content.</p>
                            <p>Reports will be reviewed carefully, and appropriate action will be taken, including immediate deletion or banning.</p>
                        </Section>
                        
                        <Section title="5. Acceptance of Terms">
                           <p>By using the platform or uploading any content, you automatically agree to these terms and acknowledge your full responsibility.</p>
                        </Section>

                        <Alert>
                           <ShieldAlert className="h-4 w-4" />
                           <AlertTitle>Legal Disclaimer</AlertTitle>
                           <AlertDescription>
                               The platform administration is not responsible for any content uploaded by users. The responsibility lies entirely with the party who published the content.
                           </AlertDescription>
                       </Alert>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
