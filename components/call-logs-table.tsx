//components/call-logs-table.tsx

"use client";

import { useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallLog {
  id: string;
  name: string | undefined;
  accountcode: string | undefined;
  src: string | undefined;
  dst: string | undefined;
  dcontext: string | undefined;
  clid: string | undefined;
  channel: string;
  dstchannel: string | undefined;
  lastapp: string | undefined;
  lastdata: string | undefined;
  start: string;
  answer: string | undefined;
  end: string | undefined;
  duration: number;
  billsec: number | undefined;
  disposition: string | undefined;
  amaflags: string | undefined;
  uniqueid: string | undefined;
  userfield: string | undefined;
  // For transcript
  summary: Array<{
    transcription: Array<{
      role: string;
      content: string;
    }>;
  }>;
}

interface CallLogsTableProps {
  data: CallLog[];
}

export function CallLogsTable({ data }: CallLogsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  const columns: ColumnDef<CallLog>[] = [
    {
      accessorKey: "start",
      header: "Time",
      cell: ({ row }) => {
        const date = new Date(row.getValue("start"));
        return (
          <div>
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => <div>{row.getValue("duration")}s</div>,
    },
    {
      accessorKey: "channel",
      header: "Channel Type",
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => <div>{row.getValue("cost") ?? "$0.00"}</div>,
    },
    {
      accessorKey: "sessionid",
      header: "Session ID",
      cell: ({ row }) => (
        <div className="truncate max-w-[120px]">
          {row.getValue("sessionid") ?? row.original.id}
        </div>
      ),
    },
    {
      accessorKey: "endreason",
      header: "End Reason",
      cell: ({ row }) => (
        <div>
          {row.getValue("endreason") || row.original.disposition || "-"}
        </div>
      ),
    },
    {
      accessorKey: "sessionstatus",
      header: "Session Status",
      cell: ({ row }) => <div>{row.getValue("sessionstatus") ?? "ended"}</div>,
    },
    {
      accessorKey: "usersentiment",
      header: "User Sentiment",
      cell: ({ row }) => <div>{row.getValue("usersentiment") ?? "-"}</div>,
    },
    {
      accessorKey: "from",
      header: "From",
      cell: ({ row }) => (
        <div>{row.getValue("from") || row.original.src || "-"}</div>
      ),
    },
    {
      accessorKey: "to",
      header: "To",
      cell: ({ row }) => (
        <div>{row.getValue("to") || row.original.dst || "-"}</div>
      ),
    },
    {
      accessorKey: "sessionoutcome",
      header: "Session Outcome",
      cell: ({ row }) => (
        <div>{row.getValue("sessionoutcome") ?? "Unsuccessful"}</div>
      ),
    },
    {
      accessorKey: "latency",
      header: "End to End Latency",
      cell: ({ row }) => <div>{row.getValue("latency") ?? "-"}</div>,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="flex flex-col h-full w-full space-y-4">
      <div className="flex items-center justify-between p-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="w-full">
        <Table className="min-w-full w-full table-auto">
          <colgroup>
            {columns.map((_, idx) => (
              <col key={idx} style={{ width: `${100 / columns.length}%` }} />
            ))}
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="px-4 py-2 whitespace-nowrap text-left text-base font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => setSelectedLog(row.original)} // <-- Add this
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-2 whitespace-nowrap text-base"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Call Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              {/* Call Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Time</h3>
                  <p>{new Date(selectedLog.start).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-medium">From</h3>
                  <p>{selectedLog.src}</p>
                </div>
                <div>
                  <h3 className="font-medium">Duration</h3>
                  <p>{selectedLog.duration}s</p>
                </div>
                <div>
                  <h3 className="font-medium">ID</h3>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
              </div>
              {/* Transcript Conversation */}
              <div>
                <h3 className="font-medium mb-2">Transcript</h3>
                <div className="bg-muted rounded-lg p-4 max-h-[350px] overflow-y-auto space-y-3">
                  {(selectedLog.summary?.[0]?.transcription ?? []).map(
                    (msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className={`max-w-[80%]`}>
                          <div
                            className={`
                  px-3 py-2 rounded-lg
                  ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : msg.role === "assistant"
                      ? "bg-gray-200 text-gray-900"
                      : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  }
                `}
                          >
                            <span className="block text-xs mb-1 font-semibold capitalize">
                              {msg.role}
                            </span>
                            <span className="whitespace-pre-wrap">
                              {msg.content}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  {(selectedLog.summary?.[0]?.transcription?.length === 0 ||
                    !selectedLog.summary) && (
                    <div className="text-sm text-muted-foreground text-center">
                      No transcript available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
