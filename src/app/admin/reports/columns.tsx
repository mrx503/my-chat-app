
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Report } from "@/lib/types"
import { format } from 'date-fns'
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTableRowActions } from "./data-table-row-actions"
import Link from "next/link"

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
    accessorKey: "videoUrl",
    header: "Clip",
    cell: ({ row }) => {
        const videoUrl = row.original.videoUrl;
        return (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Clip
            </a>
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
