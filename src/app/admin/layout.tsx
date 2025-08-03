
import React, { Suspense } from 'react';
import AdminHeader from './_components/header';
import AdminNav from './_components/nav';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import AdminRouteGuard from './_components/route-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminRouteGuard>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminNav />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <AdminHeader />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  </div>
                }
              >
                {children}
              </Suspense>
            </main>
          </div>
          <Toaster />
        </div>
      </AdminRouteGuard>
    </AuthProvider>
  );
}
