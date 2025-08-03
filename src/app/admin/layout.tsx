// This file is new
import React, { Suspense } from 'react';
import { auth } from '@/lib/firebase';
import { getAdminUids } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import AdminHeader from './_components/header';
import AdminNav from './_components/nav';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';


const checkAdminAuth = async () => {
    // This is a simplified check. In a real app, you'd use a more robust
    // server-side session management system like NextAuth.js or custom tokens.
    // For this context, we assume the client-side check is our primary gate.
    // The redirect will happen on the client-side if auth fails.
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (!user) {
                resolve(false);
                return;
            }
            const adminUids = getAdminUids();
            if (!adminUids.includes(user.uid)) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const isAdmin = await checkAdminAuth();

    if (!isAdmin) {
        // This redirect might not fire immediately due to static generation,
        // client-side checks are crucial.
        redirect('/');
    }
    
    return (
        <AuthProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <AdminNav />
                <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                    <AdminHeader />
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
                            {children}
                        </Suspense>
                    </main>
                </div>
                 <Toaster />
            </div>
        </AuthProvider>
    );
}
