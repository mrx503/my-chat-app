
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow, format } from 'date-fns'
import { ArrowUpDown, Copy, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableRowActions } from "./data-table-row-actions"


const IdCell = ({ id }: { id: string }) => {
  const { toast } = useToast();
  const copyUserId = () => {
    navigator.clipboard.writeText(id);
    toast({ title: "User ID Copied!" });
  };
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs">{id.substring(0, 8)}...</span>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyUserId}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
        const user = row.original;
        return (
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "uid",
    header: "User ID",
    cell: ({ row }) => <IdCell id={row.original.uid} />,
  },
  {
    accessorKey: "isBanned",
    header: "Account Status",
    cell: ({ row }) => {
        const isBanned = row.original.isBanned
        const bannedUntilString = row.original.bannedUntil as unknown as string;
        if (isBanned) {
          return <Badge variant="destructive">Banned</Badge>;
        }
        if (bannedUntilString) {
             const bannedUntilDate = new Date(bannedUntilString);
             if (bannedUntilDate > new Date()) {
                const formattedDate = format(bannedUntilDate, 'PPP');
                return <Badge variant="destructive" title={`Restricted until ${formattedDate}`}>Restricted</Badge>
             }
        }
        return <Badge variant="success">Active</Badge>
    }
  },
  {
    accessorKey: "coins",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Coins
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const amount = row.original.coins;
        const displayAmount = typeof amount === 'number' ? amount : 0;
        return <div className="font-medium text-center">{displayAmount}</div>
    }
  },
  {
    accessorKey: "online",
    header: "Online Status",
    cell: ({ row }) => {
      const isOnline = row.original.online;
      const lastSeenString = row.original.lastSeen as unknown as string;
      if (isOnline) {
        return <Badge variant="success">Online</Badge>;
      }
      if (lastSeenString) {
        // Convert the ISO string back to a Date object
        const lastSeenDate = new Date(lastSeenString);
        return <span className="text-xs text-muted-foreground">{formatDistanceToNow(lastSeenDate, { addSuffix: true })}</span>
      }
      return <Badge variant="secondary">Offline</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <DataTableRowActions row={row} />
    },
  },
]
