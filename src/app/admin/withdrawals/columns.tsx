// This file is new
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { WithdrawalRequest } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export const columns: ColumnDef<WithdrawalRequest>[] = [
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.original.status
      const variant = status === 'approved' ? 'success' : status === 'rejected' ? 'destructive' : 'secondary'
      return <Badge variant={variant} className="capitalize">{status}</Badge>
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount (Coins)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        return <div className="font-medium text-center">{amount}</div>
    }
  },
   {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      return <Badge variant="outline" className="capitalize">{row.original.type}</Badge>
    }
  },
  {
    accessorKey: "vodafoneNumber",
    header: "Recipient Number",
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.original.createdAt as any;
      return date?.toDate ? format(date.toDate(), 'PPP p') : "N/A"
    },
  },
]
