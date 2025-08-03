// This file is new
"use client";

import { Row } from "@tanstack/react-table";
import { Check, MoreHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WithdrawalRequest } from "@/lib/types";
import { handleWithdrawalRequest } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const request = row.original as WithdrawalRequest;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const onAction = async () => {
    if (!action) return;
    setIsLoading(true);

    try {
      const result = await handleWithdrawalRequest(request, action);
      if (result.success) {
        toast({
          title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
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
      setAction(null);
    }
  };

  if (request.status !== 'pending') {
    return null;
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <AlertDialogTrigger asChild onClick={() => setAction("approve")}>
            <DropdownMenuItem>
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Approve
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <DropdownMenuSeparator />
           <AlertDialogTrigger asChild onClick={() => setAction("reject")}>
            <DropdownMenuItem>
                <X className="mr-2 h-4 w-4 text-red-500" />
                Reject
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Action</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {action} this withdrawal request of {request.amount} coins for {request.email}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setAction(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction} disabled={isLoading} className={action === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
            {isLoading ? <Loader2 className="animate-spin" /> : `Confirm ${action}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
