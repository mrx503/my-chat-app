
"use client";

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Users,
  DollarSign,
  Landmark,
  PanelLeft,
  MessageSquare,
  Flag,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
  SheetHeader
} from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import Logo from '@/components/logo';

const breadcrumbNameMap: { [key: string]: string } = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/deposits': 'Deposits',
  '/admin/withdrawals': 'Withdrawals',
  '/admin/messaging': 'Messaging',
  '/admin/reports': 'Reports',
};

export default function AdminHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
           <SheetHeader className="sr-only">
             <SheetTitle>Admin Menu</SheetTitle>
             <SheetDescription>Navigation links for the admin dashboard.</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Logo className="h-6 w-6 transition-all group-hover:scale-110" />
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Users className="h-5 w-5" />
              Users
            </Link>
            <Link
              href="/admin/deposits"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <DollarSign className="h-5 w-5" />
              Deposits
            </Link>
            <Link
              href="/admin/withdrawals"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Landmark className="h-5 w-5" />
              Withdrawals
            </Link>
            <Link
              href="/admin/messaging"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-5 w-5" />
              Messaging
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Flag className="h-5 w-5" />
              Reports
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
       <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                    <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.slice(1).map((segment, index) => {
                const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
                const name = breadcrumbNameMap[href] || segment;
                const isLast = index === pathSegments.length - 2;
                return (
                    <React.Fragment key={href}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {isLast ? (
                                <BreadcrumbPage className="capitalize">{name}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link href={href} className="capitalize">{name}</Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </React.Fragment>
                )
            })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
