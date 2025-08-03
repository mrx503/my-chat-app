
"use client";

import { Row } from "@tanstack/react-table";
import { Coins, MoreHorizontal, UserX, Ban, CalendarClock, Loader2, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/types";
import { handleUserAction, sendCoinsToUser } from "./actions";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const user = row.original as User;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogState, setDialogState] = useState<{
      open: boolean, 
      type: 'send-coins' | 'restrict' | 'ban' | 'unban' | null,
      title: string,
      description: string,
      actionLabel: string,
      inputValue?: string | number,
      onConfirm?: () => Promise<void>
  }>({
      open: false,
      type: null,
      title: '',
      description: '',
      actionLabel: ''
  });

  const onAction = async (actionType: 'ban' | 'unban' | 'restrict', days?: number) => {
    setIsLoading(true);
    try {
      const result = await handleUserAction(user.uid, actionType, days);
      if (result.success) {
        toast({
          title: "Action Successful",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Action Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
      setDialogState({ ...dialogState, open: false });
    }
  };

  const onSendCoins = async () => {
    const amount = Number(dialogState.inputValue);
    if(isNaN(amount) || amount <= 0) {
        toast({variant: 'destructive', title: 'Invalid Amount'});
        return;
    }

    setIsLoading(true);
    try {
      const result = await sendCoinsToUser(user.uid, amount);
       if (result.success) {
        toast({
          title: "Coins Sent!",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch(error: any) {
         toast({
            variant: 'destructive',
            title: "Action Failed",
            description: error.message || "An unexpected error occurred.",
        });
    } finally {
        setIsLoading(false);
        setDialogState({ ...dialogState, open: false });
    }
  }
  
  const openDialog = (type: typeof dialogState.type, title: string, description: string, actionLabel: string, onConfirm: () => Promise<void>) => {
    setDialogState({ open: true, type, title, description, actionLabel, onConfirm, inputValue: '' });
  };
  
  const isRestricted = user.bannedUntil && new Date(user.bannedUntil as any) > new Date();

  return (
    <>
      <AlertDialog open={dialogState.open} onOpenChange={(open) => setDialogState({...dialogState, open})}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuItem onClick={() => openDialog('send-coins', 'Send Coins', `How many coins do you want to send to ${user.name}?`, 'Send', onSendCoins)}>
                  <Coins className="mr-2 h-4 w-4 text-yellow-500" />
                  Send Coins
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(user.isBanned || isRestricted) ? (
                 <DropdownMenuItem onClick={() => openDialog('unban', 'Lift Restriction', `Are you sure you want to lift all restrictions for ${user.name}?`, 'Confirm', () => onAction('unban'))}>
                    <Undo className="mr-2 h-4 w-4 text-green-500"/>
                    Lift Restriction
                </DropdownMenuItem>
              ): (
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Ban className="mr-2 h-4 w-4 text-orange-500"/>
                        Restrict Access
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {[1, 3, 7, 30].map(days => (
                        <DropdownMenuItem key={days} onClick={() => openDialog('restrict', `Restrict for ${days} days?`, `This will prevent ${user.name} from logging in for ${days} days.`, 'Restrict', () => onAction('restrict', days))}>
                            <CalendarClock className="mr-2 h-4 w-4"/>
                            For {days} day{days > 1 && 's'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuItem className="text-destructive" onClick={() => openDialog('ban', 'Permanently Ban User?', `This will permanently ban ${user.name} from accessing the app. This action is final.`, 'Ban Permanently', () => onAction('ban'))}>
                      <UserX className="mr-2 h-4 w-4" />
                      Ban User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
            </AlertDialogHeader>
            {dialogState.type === 'send-coins' && (
                <div className="grid gap-2">
                    <Label htmlFor="coins-amount">Amount</Label>
                    <Input 
                        id="coins-amount" 
                        type="number"
                        placeholder="e.g., 100" 
                        value={dialogState.inputValue as string}
                        onChange={(e) => setDialogState({...dialogState, inputValue: e.target.value})}
                    />
                </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={dialogState.onConfirm} disabled={isLoading} className={dialogState.type?.includes('ban') ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
                {isLoading ? <Loader2 className="animate-spin" /> : dialogState.actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
