
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Report } from "@/lib/types"
import { format } from 'date-fns'
import { ArrowUpDown, Link as LinkIcon, Clapperboard, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTableRowActions } from "./data-table-row-actions"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<Report>[] = [
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
        const report = row.original;
        return (
            <div>
                <p className="font-medium">{report.reason}</p>
                {report.customReason && <p className="text-xs text-muted-foreground italic">"{report.customReason}"</p>}
            </div>
        )
    }
  },
  {
    accessorKey: "reporterEmail",
    header: "Reporter",
    cell: ({ row }) => {
        const report = row.original;
        return (
            <Link href={`/profile/${report.reporterId}`} className="hover:underline">
                {report.reporterEmail}
            </Link>
        )
    }
  },
  {
    accessorKey: "reportedUserEmail",
    header: "Reported User",
     cell: ({ row }) => {
        const report = row.original;
        return (
            <Link href={`/profile/${report.reportedUserId}`} className="hover:underline">
                {report.reportedUserEmail}
            </Link>
        )
    }
  },
  {
    accessorKey: "resourceUrl",
    header: "Content",
    cell: ({ row }) => {
        const report = row.original;
        const Icon = report.resourceType === 'clip' ? Clapperboard : FileText;
        return (
            <div className="flex items-center gap-2">
                 <Badge variant="outline" className="capitalize">
                    <Icon className="h-3 w-3 mr-1"/>
                    {report.resourceType}
                </Badge>
                <a href={report.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    <LinkIcon className="h-4 w-4"/>
                </a>
            </div>
        )
    }
  },
  {
    accessorKey: "timestamp",
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
      const dateString = row.original.timestamp as unknown as string;
      const date = new Date(dateString);
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
