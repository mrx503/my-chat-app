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
                    شروط الاستخدام
                </h1>
            </header>
            <main className="p-4 md:p-6">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>شروط وأحكام استخدام تطبيق duck</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Section title="1. ملكية المحتوى والمسؤولية">
                            <p>عند قيامك برفع أي محتوى (فيديو، صورة، ريلز، تعليق, منشور...) على المنصة، فإنك تُقرّ وتؤكد أن:</p>
                             <ul className="list-disc list-inside space-y-1">
                                <li>المحتوى من إنتاجك الشخصي، أو أنك تمتلك الحقوق القانونية الكاملة لرفعه ونشره.</li>
                                <li>لا يحتوي المحتوى على أي مواد محمية بحقوق ملكية فكرية لطرف ثالث، إلا إذا كنت مخولاً باستخدامها.</li>
                            </ul>
                            <Alert variant="destructive" className="mt-2">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>تنبيه</AlertTitle>
                                <AlertDescription>
                                    في حال رفعك لأي محتوى لا تمتلك حقوقه أو بدون إذن قانوني، تتحمل كامل المسؤولية القانونية، وتُعفي إدارة المنصة من أي مطالبات أو شكاوى ناتجة عن ذلك.
                                </AlertDescription>
                            </Alert>
                        </Section>

                        <Section title="2. المحتوى غير اللائق والمخالف">
                            <p>يُمنع منعًا باتًا نشر أو رفع أي محتوى يحتوي على:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>مشاهد مخلة بالآداب العامة أو خادشة للحياء.</li>
                                <li>عنف، كراهية، تحرش، تهديد، أو انتهاك لحقوق الآخرين.</li>
                            </ul>
                            <p className="mt-2">تحتفظ إدارة المنصة بالحق الكامل في:</p>
                             <ul className="list-disc list-inside space-y-1">
                                <li>حذف أي محتوى مخالف فورًا وبدون إشعار.</li>
                                <li>حظر الحساب المخالف بشكل دائم، سواء كان صاحب المحتوى أو مشاركًا فيه.</li>
                            </ul>
                        </Section>

                        <Section title="3. نظام الريلز والفيديوهات">
                            <p>تتيح المنصة للمستخدمين رفع فيديوهات قصيرة (ريلز) مشابهة لتطبيقات الفيديو الاجتماعية.</p>
                            <p>باستخدام هذه الميزة، فإنك توافق على:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>أن تكون الفيديوهات أصلية، لا تنتهك حقوق الغير.</li>
                                <li>إمكانية خضوع الفيديو للمراجعة قبل النشر أو الحذف في حال المخالفة.</li>
                                <li>أن المنصة غير مسؤولة عن المحتوى الذي يرفعه المستخدمون، ولكنها تحتفظ بحق التدخل والحذف في أي وقت.</li>
                            </ul>
                        </Section>

                        <Section title="4. نظام البلاغات">
                            <p>تتيح المنصة زرًا للإبلاغ عن أي محتوى مخالف.</p>
                            <p>ستتم مراجعة البلاغات بعناية، واتخاذ الإجراء المناسب، بما في ذلك الحذف أو الحظر الفوري.</p>
                        </Section>
                        
                        <Section title="5. الموافقة على الشروط">
                           <p>باستخدامك للمنصة أو رفعك لأي محتوى، فأنت توافق تلقائيًا على هذه الشروط وتقرّ بمسؤوليتك الكاملة.</p>
                        </Section>

                        <Alert>
                           <ShieldAlert className="h-4 w-4" />
                           <AlertTitle>تنبيه قانوني</AlertTitle>
                           <AlertDescription>
                                إدارة المنصة غير مسؤولة عن أي محتوى يتم رفعه من قبل المستخدمين، والمسؤولية تقع بالكامل على الطرف الذي قام بالنشر.
                           </AlertDescription>
                       </Alert>

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
