// This file is new
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { DepositRequest } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTableRowActions } from "./data-table-row-actions"

export const columns: ColumnDef<DepositRequest>[] = [
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
          Amount (EGP)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"))
        const formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "EGP",
        }).format(amount)

        return <div className="font-medium">{formatted}</div>
    }
  },
  {
    accessorKey: "senderVodafoneNumber",
    header: "Sender Voda Number",
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
      const date = row.original.createdAt?.toDate()
      return date ? format(date, 'PPP p') : "N/A"
    },
  },
   {
    id: "actions",
    cell: ({ row }) => {
      return <DataTableRowActions row={row} />
    },
  },
]
