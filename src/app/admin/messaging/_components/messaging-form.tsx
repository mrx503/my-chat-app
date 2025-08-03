// This file is new
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import type { User } from '@/lib/types';
import { sendSystemMessage } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';


interface MessagingFormProps {
    allUsers: User[];
}

export default function MessagingForm({ allUsers }: MessagingFormProps) {
    const [target, setTarget] = useState<'all' | 'single'>('all');
    const [message, setMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const usersForSelect = allUsers
        .filter(u => u.id !== 'system-bot-uid') // Filter out the bot
        .map(u => ({ label: u.email, value: u.id, user: u }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (target === 'single' && !selectedUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a user.' });
            setIsLoading(false);
            return;
        }

        try {
            const result = await sendSystemMessage(target, message, selectedUser?.id);
            if (result.success) {
                toast({ title: 'Success!', description: result.message });
                setMessage('');
                setSelectedUser(null);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to Send', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label>Target Audience</Label>
                <RadioGroup value={target} onValueChange={(value) => setTarget(value as 'all' | 'single')} className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="r1" />
                        <Label htmlFor="r1">All Users</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="r2" />
                        <Label htmlFor="r2">Single User</Label>
                    </div>
                </RadioGroup>
            </div>

            {target === 'single' && (
                <div className="space-y-2">
                    <Label>Select User</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-[300px] justify-between"
                            >
                            {selectedUser ? selectedUser.email : "Select user..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Search user by email..." />
                                <CommandEmpty>No user found.</CommandEmpty>
                                <CommandGroup>
                                <ScrollArea className="h-48">
                                    {usersForSelect.map((item) => (
                                        <CommandItem
                                            key={item.value}
                                            value={item.label}
                                            onSelect={() => {
                                                setSelectedUser(item.user);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedUser?.id === item.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {item.label}
                                        </CommandItem>
                                    ))}
                                </ScrollArea>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea 
                    id="message" 
                    placeholder="Type your message here..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                />
            </div>
            
            <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2"/> : null}
                Send Message
            </Button>
        </form>
    );
}
