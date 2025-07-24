
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface SystemChatCardProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

export default function SystemChatCard({ unreadCount, onClick, className }: SystemChatCardProps) {
  return (
    <Card 
        onClick={onClick}
        className={cn(
            "cursor-pointer hover:bg-muted/50 transition-colors",
            className
        )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">System Messages</CardTitle>
        <Bot className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
                Important updates and rewards.
            </p>
            {unreadCount > 0 && (
                <Badge variant="destructive" className="flex items-center justify-center rounded-full text-xs h-6 w-6 p-0">
                    {unreadCount}
                </Badge>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
