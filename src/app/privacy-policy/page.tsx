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
                    سياسة الخصوصية
                </h1>
            </header>
            <main className="p-4 md:p-6">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>سياسة الخصوصية لتطبيق duck</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Section title="1. مقدمة">
                            <p>نحن نقدر ثقتك بنا، ونعمل على حماية خصوصيتك وبياناتك الشخصية.</p>
                            <p>توضح هذه السياسة كيفية جمع واستخدام وتخزين المعلومات التي تقدمها عند استخدام تطبيقنا.</p>
                        </Section>
                        
                        <Section title="2. المعلومات التي نجمعها">
                            <p>عند استخدامك للتطبيق، قد نقوم بجمع المعلومات التالية:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>الاسم، البريد الإلكتروني، أو رقم الهاتف (عند التسجيل).</li>
                                <li>معلومات فنية مثل: نوع الجهاز، نظام التشغيل، اللغة، عنوان IP.</li>
                                <li>سلوك الاستخدام داخل التطبيق (مثل الصفحات التي تزورها).</li>
                                <li>بيانات الإعلانات (في حالة تفعيل الإعلانات لاحقًا).</li>
                            </ul>
                        </Section>

                        <Section title="3. استخدام المعلومات">
                            <p>نستخدم البيانات التي نجمعها من أجل:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>إنشاء حسابك وتسجيل الدخول.</li>
                                <li>تحسين تجربة المستخدم داخل التطبيق.</li>
                                <li>تخصيص المحتوى والإعلانات لك بشكل أفضل.</li>
                                <li>الحفاظ على أمان الحسابات والنظام.</li>
                            </ul>
                        </Section>

                        <Section title="4. مشاركة البيانات">
                           <ul className="list-disc list-inside space-y-1">
                                <li>لا نقوم ببيع أو تأجير بياناتك لأي جهة خارجية.</li>
                                <li>قد نتعاون مع شركات إعلانات (مثل Google AdMob) التي قد تستخدم بعض البيانات (مثل نوع الجهاز أو الاهتمامات العامة) لعرض إعلانات مخصصة.</li>
                                <li>نحن لا نشارك بياناتك الشخصية مع أي طرف ثالث بدون موافقتك.</li>
                            </ul>
                        </Section>

                        <Section title="5. حماية البيانات">
                            <p>نحن نستخدم تدابير أمان تقنية وإدارية لحماية بياناتك من الوصول أو التعديل أو الإتلاف غير المصرح به.</p>
                        </Section>

                        <Section title="6. محتوى المستخدم">
                            <ul className="list-disc list-inside space-y-1">
                                <li>أنت مسؤول عن أي محتوى تقوم برفعه على التطبيق.</li>
                                <li>يُمنع نشر أي محتوى يحتوي على مواد خادشة للحياء أو مخالفة للأخلاق أو القوانين.</li>
                                <li>يحق للإدارة حذف المحتوى أو حظر الحساب المخالف فورًا دون إشعار مسبق.</li>
                            </ul>
                        </Section>

                        <Section title="7. المكافآت مقابل مشاهدة الإعلانات">
                           <ul className="list-disc list-inside space-y-1">
                                <li>قد نقدم نظامًا تحفيزيًا يحصل فيه المستخدم على مكافآت رمزية (مثل نقاط أو رصيد افتراضي) مقابل مشاهدة الإعلانات حتى نهايتها.</li>
                                <li>تُمنح المكافآت تلقائيًا بعد التحقق من مشاهدة الإعلان كاملًا.</li>
                                <li>هذه المكافآت لا تُعد التزامًا ماليًا مباشرًا أو حقًا قانونيًا.</li>
                                <li>لا يتم منح مكافآت في حال تم تخطي الإعلان أو الخروج منه قبل نهايته.</li>
                            </ul>
                        </Section>

                         <Section title="8. التعديلات">
                            <p>قد نقوم بتحديث هذه السياسة من وقت لآخر، وسيتم إخطار المستخدم بأي تغييرات داخل التطبيق أو عبر البريد الإلكتروني.</p>
                        </Section>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
