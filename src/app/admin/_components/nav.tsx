// This file is new
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Package,
  Settings,
  DollarSign,
  Landmark,
  ArrowLeft
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Logo from '@/components/logo';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/deposits', icon: DollarSign, label: 'Deposits' },
  { href: '/admin/withdrawals', icon: Landmark, label: 'Withdrawals' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
           <Logo className="h-6 w-6 transition-all group-hover:scale-110" />
            <span className="sr-only">Duck Chat App</span>
          </Link>

          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to App</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Back to App</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
