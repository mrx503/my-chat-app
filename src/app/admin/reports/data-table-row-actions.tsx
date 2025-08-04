
"use client";

import { Row } from "@tanstack/react-table";
import { Check, MoreHorizontal, X, Loader2, Trash2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Report } from "@/lib/types";
import { dismissReport, resolveReportAndDeleteResource } from "./actions";
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
  const report = row.original as Report;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"dismiss" | "resolve" | null>(null);

  const onAction = async () => {
    if (!action) return;
    setIsLoading(true);

    try {
        let result;
        if (action === 'dismiss') {
            result = await dismissReport(report.id);
        } else { // resolve
            result = await resolveReportAndDeleteResource(report.id, report.resourceId, report.resourceType, report.reportedUserId, report.reporterId, report.reason);
        }

      if (result.success) {
        toast({
          title: `Action Successful`,
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

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <AlertDialogTrigger asChild onClick={() => setAction("dismiss")}>
            <DropdownMenuItem>
                <ShieldX className="mr-2 h-4 w-4" />
                Dismiss Report
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <DropdownMenuSeparator />
           <AlertDialogTrigger asChild onClick={() => setAction("resolve")}>
            <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Content & Notify
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {action === 'dismiss' ? 
                'This will mark the report as "dismissed" and no action will be taken. Are you sure?'
                : 
                `This will permanently delete the ${report.resourceType} and send notifications to the involved users. This action cannot be undone.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setAction(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction} disabled={isLoading} className={action === 'resolve' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
            {isLoading ? <Loader2 className="animate-spin" /> : (action === 'resolve' ? `Yes, Delete ${report.resourceType}` : "Yes, Dismiss")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
