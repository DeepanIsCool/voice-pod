"use client";

import { useState, useRef, useEffect } from "react";
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
import { Play, Pause, Volume2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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

// ---- TYPES ----
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

// ---- AUDIO PLAYER ----
function getAudioUrl(lastdata: string | undefined) {
  if (!lastdata) return "";
  return `https://ai.rajatkhandelwal.com/audio/${lastdata}.wav`;
}

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Fixes seeking responsiveness
  const isSeeking = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isSeeking.current) setCurrentTime(audio.currentTime);
    };
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  // Instantly seek anywhere
  const handleSeek = (value: number[]) => {
    isSeeking.current = true;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
    isSeeking.current = false;
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    return (
      <div className="text-gray-400 text-sm">
        Audio recording not available.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-muted shadow p-4 flex flex-col gap-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={togglePlayPause}>
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 1}
          step={0.01}
          onValueChange={handleSeek}
          className="flex-1 mx-2"
        />
        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div className="flex items-center gap-2 w-24 ml-2">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <Slider
            value={[volume]}
            max={1}
            min={0}
            step={0.01}
            onValueChange={handleVolumeChange}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            const axios = (await import("axios")).default;
            const fileName = audioUrl.split("/").pop() || "audio.wav";
            try {
              const response = await axios.get(audioUrl, { responseType: "blob" });
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", fileName);
              document.body.appendChild(link);
              link.click();
              link.parentNode?.removeChild(link);
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error("Failed to download audio", err);
            }
          }}
        >
          {/* Download SVG */}
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14m0 0l-5-5m5 5l5-5" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

// ---- CONVERSATION BUBBLE ----
function ConversationBubble({
  role,
  content,
}: {
  role: string;
  content: string;
}) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const base =
    "px-4 py-2 rounded-lg text-sm shadow max-w-[70%] whitespace-pre-wrap";
  const userClasses =
    "ml-auto bg-blue-600 text-white rounded-br-md rounded-tl-md";
  const assistantClasses =
    "mr-auto bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50 rounded-bl-md rounded-tr-md";
  const sysClasses =
    "mx-auto bg-yellow-100 text-yellow-900 border border-yellow-200";
  return (
    <div
      className={`flex ${
        isUser
          ? "justify-end"
          : isAssistant
          ? "justify-start"
          : "justify-center"
      } mb-2`}
    >
      <div
        className={`${base} ${
          isUser ? userClasses : isAssistant ? assistantClasses : sysClasses
        }`}
      >
        <span className="block text-xs font-bold opacity-70 capitalize mb-1">
          {role}
        </span>
        {content}
      </div>
    </div>
  );
}

// Custom global filter for src and dst only
import { Row, FilterFn } from "@tanstack/react-table";

const srcDstGlobalFilter: FilterFn<CallLog> = (row, _columnId, filterValue) => {
  const src = row.original.src?.toLowerCase() ?? "";
  const dst = row.original.dst?.toLowerCase() ?? "";
  const value = filterValue.toLowerCase();
  return src.includes(value) || dst.includes(value);
};

// ---- MAIN TABLE COMPONENT ----
export function CallLogsTable({ data }: CallLogsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  // Copy logic is here (inside dialog)
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const columns: ColumnDef<CallLog>[] = [
    {
      accessorKey: "start",
      header: "Time",
      cell: ({ row }) => {
        const date = new Date(row.getValue("start"));
        return (
          <div>
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour12: false })}
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
      accessorKey: "from",
      header: "From",
      cell: ({ row }) => {
        const raw = row.getValue("from") || row.original.src;
        // Remove leading zero if present
        let formatted = typeof raw === "string" && raw.startsWith("0") ? raw.slice(1) : raw;
        if (!formatted) formatted = "-";
        return <div>{String(formatted)}</div>;
      },
    },
    {
      accessorKey: "to",
      header: "To",
      cell: ({ row }) => {
        const raw = row.getValue("to") || row.original.dst;
        // Remove two leading zeros if present
        let formatted = raw;
        if (typeof raw === "string" && raw.startsWith("00")) {
          formatted = raw.slice(2);
        }
        if (!formatted) formatted = "-";
        return <div>{String(formatted)}</div>;
      },
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
    globalFilterFn: srcDstGlobalFilter, // Only search src and dst
  });

  // Transcript for selectedLog (to copy)
  const transcriptArr = selectedLog?.summary?.[0]?.transcription ?? [];
  const transcriptText = transcriptArr
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const handleCopyTranscript = async () => {
    if (!transcriptText) return;
    await navigator.clipboard.writeText(transcriptText);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 1500);
  };

  return (
    <div className="flex flex-col max-w-12xl h-full w-full space-y-4">
      <div className="flex items-center justify-between p-4">
        <Input
          placeholder="Search by number"
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="w-full overflow-x-auto">
        <Table className="w-full" style={{ tableLayout: "auto" }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => setSelectedLog(row.original)}
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

      {/* Pagination Controls with Current Page */}
      <div className="flex items-center justify-end space-x-2 p-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <span className="text-sm font-mono opacity-80 select-none">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="flex flex-col gap-6">
              {/* Call Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background rounded-lg p-4 shadow">
                <div>
                  <span className="font-medium">Time:</span>
                  <div>{new Date(selectedLog.start).toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium">From:</span>
                  <div>{selectedLog.src}</div>
                </div>
                <div>
                  <span className="font-medium">Duration:</span>
                  <div>{selectedLog.duration}s</div>
                </div>
              </div>
              {/* Audio Section */}
              <div>
                <h3 className="text-base font-semibold mb-2">Call Recording</h3>
                {selectedLog.lastdata ? (
                  <AudioPlayer audioUrl={getAudioUrl(selectedLog.lastdata)} />
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No audio recording available.
                  </div>
                )}
              </div>
              {/* Transcript */}
              <div>
                <div className="flex items-center mb-2 gap-2">
                  <h3 className="text-base font-semibold">Transcript</h3>
                  {transcriptArr.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto flex items-center gap-1"
                      onClick={handleCopyTranscript}
                    >
                      <Copy className="w-4 h-4" />
                      {copyStatus === "copied" ? "Copied!" : "Copy All"}
                    </Button>
                  )}
                </div>
                <div className="bg-muted rounded-lg p-4 max-h-[350px] overflow-y-auto">
                  {transcriptArr.map((msg, idx) => (
                    <ConversationBubble
                      key={idx}
                      role={msg.role}
                      content={msg.content}
                    />
                  ))}
                  {transcriptArr.length === 0 && (
                    <div className="text-sm text-center text-gray-400">
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
