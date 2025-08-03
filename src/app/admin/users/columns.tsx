// This file is new
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'
import { ArrowUpDown, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


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
        const amount = parseFloat(row.getValue("coins"))
        return <div className="font-medium text-center">{amount}</div>
    }
  },
  {
    accessorKey: "online",
    header: "Status",
    cell: ({ row }) => {
      const isOnline = row.original.online;
      const lastSeen = row.original.lastSeen;
      if (isOnline) {
        return <Badge variant="success">Online</Badge>;
      }
      if (lastSeen) {
         return <span className="text-xs text-muted-foreground">{formatDistanceToNow(lastSeen.toDate(), { addSuffix: true })}</span>
      }
      return <Badge variant="secondary">Offline</Badge>;
    },
  },
  {
    accessorKey: "followers",
    header: "Followers",
    cell: ({ row }) => {
        return <div className="text-center">{row.original.followers?.length ?? 0}</div>
    }
  },
  {
    accessorKey: "following",
    header: "Following",
     cell: ({ row }) => {
        return <div className="text-center">{row.original.following?.length ?? 0}</div>
    }
  },
]
