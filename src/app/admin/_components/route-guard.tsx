
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isAdmin } from '@/lib/admin';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If loading is finished and there's no user, or the user is not an admin, redirect.
        if (!loading && (!currentUser || !isAdmin(currentUser.uid))) {
            router.push('/');
        }
    }, [currentUser, loading, router]);

    // While loading or if user is not yet verified as admin, show a loading spinner.
    if (loading || !currentUser || !isAdmin(currentUser.uid)) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-muted/40">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Verifying access...</p>
            </div>
        );
    }
    
    // If user is an admin, render the children components.
    return <>{children}</>;
}
