"use client";

import { Trash2, Copy, Pause, Play, Volume2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { useEffect, useState } from "react";

// Custom hook to check if component has mounted (client-only rendering)
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  return hasMounted;
}

interface Transcription {
  role: string;
  content: string;
}
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
  cost?: string | number;
  sessionid?: string;
  from?: string;
  to?: string;
  latency?: number;
  Summary?: Array<{ transcription: Transcription[] }>;
  summary?: Array<{ transcription: Transcription[] }>;
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

function ConversationBubble({ role, content }: { role: string; content: string }) {
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

const srcDstGlobalFilter: FilterFn<CallLog> = (row, _columnId, filterValue) => {
  const src = row.original.src?.toLowerCase() ?? "";
  const dst = row.original.dst?.toLowerCase() ?? "";
  const value = filterValue.toLowerCase();
  return src.includes(value) || dst.includes(value);
};

function getCachedUsdInr() {
  if (typeof window === "undefined") return null;
  const item = localStorage.getItem("usdInrRate");
  if (!item) return null;
  try {
    const parsed = JSON.parse(item);
    if (
      parsed &&
      typeof parsed.rate === "number" &&
      typeof parsed.timestamp === "number"
    ) {
      // Valid for 12 hours
      if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
        return parsed.rate;
      }
    }
  } catch {}
  return null;
}

function setCachedUsdInr(rate: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    "usdInrRate",
    JSON.stringify({ rate, timestamp: Date.now() })
  );
}

export default function Dashboard() {
  const hasMounted = useHasMounted();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [dockerStatus, setDockerStatus] = useState<
    "ok" | "error" | "loading"
  >("loading");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLButtonElement>(null);

  // --- Currency conversion ---
  const [usdInrRate, setUsdInrRate] = useState<number | null>(
    getCachedUsdInr() || null
  );
  const [usdInrError, setUsdInrError] = useState<string | null>(null);

  async function fetchUsdInrRate() {
    setUsdInrError(null);
    // Try primary API
    try {
      const res = await fetch("https://api.exchangerate.host/convert?from=USD&to=INR");
      const data = await res.json();
      if (data && typeof data.result === "number" && data.result > 0) {
        setUsdInrRate(Number(data.result));
        setCachedUsdInr(Number(data.result));
        return;
      }
      // If result is missing or invalid, try fallback
      console.warn("Primary API failed or returned invalid result", data);
    } catch (e) {
      console.warn("Primary API fetch failed", e);
    }
    // Fallback: try another API
    try {
      const res2 = await fetch("https://open.er-api.com/v6/latest/USD");
      const data2 = await res2.json();
      if (data2 && data2.rates && typeof data2.rates.INR === "number" && data2.rates.INR > 0) {
        setUsdInrRate(Number(data2.rates.INR));
        setCachedUsdInr(Number(data2.rates.INR));
        return;
      }
      console.warn("Fallback API failed or returned invalid result", data2);
      setUsdInrError("Failed to get rate");
    } catch (e2) {
      setUsdInrError("Failed to fetch USD→INR rate.");
      console.warn("Fallback API fetch failed", e2);
    }
  }

  useEffect(() => {
    if (!usdInrRate) fetchUsdInrRate();
    const interval = setInterval(fetchUsdInrRate, 1000 * 60 * 60); // hourly refresh
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  // --- Docker health ---
  useEffect(() => {
    let cancelled = false;
    let first = true;
    async function fetchDockerHealth() {
      if (first) setDockerStatus("loading");
      try {
        const headers = getAuthHeaders();
        const response = await fetch(
          "https://ai.rajatkhandelwal.com/dockerhealth",
          { headers }
        );
        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        if (!cancelled) {
          setDockerStatus(data && data.status === "ok" ? "ok" : "error");
        }
      } catch {
        if (!cancelled) setDockerStatus("error");
      }
      first = false;
    }
    fetchDockerHealth();
    const interval = setInterval(fetchDockerHealth, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // --- Call logs ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchCallLogs() {
      try {
        const response = await fetch(
          "https://ai.rajatkhandelwal.com/calllogs",
          {
            headers: getAuthHeaders(),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch call logs");
        }
        const data = await response.json();
        const mapped: CallLog[] = (Array.isArray(data) ? data : []).map(
          (item: any) => ({
            id: item.id,
            name: item.name ?? undefined,
            accountcode: item.accountcode ?? undefined,
            src: item.src ?? undefined,
            dst: item.dst ?? undefined,
            dcontext: item.dcontext ?? undefined,
            clid: item.clid ?? undefined,
            channel: item.channel ?? "",
            dstchannel: item.dstchannel ?? undefined,
            lastapp: item.lastapp ?? undefined,
            lastdata: item.lastdata ?? undefined,
            start: item.start ?? "",
            answer: item.answer ?? undefined,
            end: item.end ?? undefined,
            duration: typeof item.duration === "number" ? item.duration : 0,
            billsec:
              typeof item.billsec === "number" ? item.billsec : undefined,
            disposition: item.disposition ?? undefined,
            amaflags: item.amaflags ?? undefined,
            uniqueid: item.uniqueid ?? undefined,
            userfield: item.userfield ?? undefined,
            cost: item.cost ?? undefined,
            sessionid: item.sessionid ?? undefined,
            from: item.from ?? undefined,
            to: item.to ?? undefined,
            latency: item.latency ?? undefined,
            Summary: item.Summary ?? undefined,
            summary: item.summary ?? undefined,
          })
        );
        setCallLogs(mapped);
        setLogs(mapped);
      } catch (error) {
        console.error("Error fetching call logs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load call logs. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchCallLogs();
    interval = setInterval(fetchCallLogs, 60000);
    return () => clearInterval(interval);
  }, [toast]);

  useEffect(() => {
    if (selectAllRef.current) {
      const input = selectAllRef.current.querySelector("input");
      if (input) {
        input.indeterminate =
          selectedRows.size > 0 &&
          selectedRows.size < logs.filter((l) => l.lastdata).length;
      }
    }
  }, [selectedRows, logs]);

  // --- TABLE COLUMNS ---
  const columns: ColumnDef<CallLog>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          ref={selectAllRef}
          checked={
            logs.length > 0 &&
            selectedRows.size === logs.filter((l) => l.lastdata).length
          }
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedRows(
                new Set(logs.filter((l) => l.lastdata).map((l) => l.lastdata!))
              );
            } else {
              setSelectedRows(new Set());
            }
          }}
          aria-label="Select all logs"
        />
      ),
      cell: ({ row }) => {
        const lastdata = row.original.lastdata;
        if (!lastdata) return null;
        return (
          <Checkbox
            checked={selectedRows.has(lastdata)}
            onCheckedChange={() => {
              setSelectedRows((prev) => {
                const next = new Set(prev);
                if (next.has(lastdata)) next.delete(lastdata);
                else next.add(lastdata);
                return next;
              });
            }}
            aria-label={`Select log ${lastdata}`}
            onClick={(e) => e.stopPropagation()}
          />
        );
      },
      size: 32,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        if (!hasMounted) return <span>--</span>;
        const date = new Date(row.original.start);
        const day = date.getDate();
        const daySuffix =
          day % 10 === 1 && day !== 11
            ? "st"
            : day % 10 === 2 && day !== 12
            ? "nd"
            : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";
        const month = date.toLocaleString("en-US", { month: "short" });
        const year = date.getFullYear();
        return <span>{`${day}${daySuffix} ${month} ${year}`}</span>;
      },
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => {
        if (!hasMounted) return <span>--:--</span>;
        const date = new Date(row.original.start);
        return (
          <span>
            {date
              .toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
              .replace("AM", "am")
              .replace("PM", "pm")}
          </span>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const totalSeconds = Number(row.original.duration);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return (
          <span>
            {mins > 0 ? `${mins}m ` : ""}
            {secs}s
          </span>
        );
      },
    },
    // --- COST COLUMN WITH LIVE CONVERSION ---
    {
      accessorKey: "cost",
      header: () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1">
                Cost <Info className="w-4 h-4 text-blue-400 dark:text-blue-300" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Shows per-call cost converted to INR using the latest exchange rate.<br />
              <b>Formula:</b> <code>Cost (USD) × USD→INR Rate</code>
              <br />
              {usdInrRate && (
                <span>
                  <b>Current rate:</b> 1 USD = ₹{usdInrRate.toFixed(2)}
                </span>
              )}
              {usdInrError && (
                <span className="text-destructive">
                  <br />
                  {usdInrError}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => {
        const cost = Number(row.original.cost) || 0;
        if (isLoading)
          return <Skeleton className="w-12 h-6 rounded bg-muted" />;
        if (!usdInrRate)
          return <span>{cost ? `$${cost.toFixed(2)}` : "—"}</span>;
        const inr = cost * usdInrRate;
        return (
          <div>
            <span className="font-semibold text-green-700 dark:text-green-300">
              ₹{inr.toFixed(2)}
            </span>
            {cost > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                (USD ${cost.toFixed(2)})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sessionid",
      header: "Session ID",
      cell: ({ row }) => (
        <div className="truncate max-w-[120px]">
          {row.original.sessionid ?? row.original.id}
        </div>
      ),
    },
    {
      accessorKey: "from",
      header: "From",
      cell: ({ row }) => {
        let raw = row.original.from || row.original.src;
        if (!raw || raw === "919240011600") return <div>Agent</div>;
        if (
          typeof raw === "string" &&
          raw.startsWith("91") &&
          raw.length > 10
        )
          raw = raw.slice(2);
        if (typeof raw === "string") raw = raw.replace(/^0+/, "");
        return <div>{raw}</div>;
      },
    },
    {
      accessorKey: "to",
      header: "To",
      cell: ({ row }) => {
        let raw = row.original.to || row.original.dst;
        if (!raw) return <div>Agent</div>;
        let normalized = String(raw).replace(/^0+/, "");
        if (
          normalized === "919240011600" ||
          normalized === "919240011600".replace(/^91/, "")
        )
          return <div>Agent</div>;
        if (
          normalized === "919240011600" ||
          normalized === "00919240011600" ||
          normalized === "9240011600"
        )
          return <div>Agent</div>;
        if (normalized.startsWith("91") && normalized.length > 10)
          normalized = normalized.slice(2);
        return <div>{normalized}</div>;
      },
    },
    {
      accessorKey: "latency",
      header: "Average Latency",
      cell: ({ row }) => {
        const latency = row.original.latency;
        return latency !== undefined && latency !== null ? (
          <span>{latency} ms</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
  ];

  const table = useReactTable({
    data: logs,
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
    globalFilterFn: srcDstGlobalFilter,
  });

  const transcriptArr =
    selectedLog?.summary?.[0]?.transcription ||
    selectedLog?.Summary?.[0]?.transcription ||
    [];
  const transcriptText = transcriptArr
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const handleCopyTranscript = async () => {
    if (!transcriptText) return;
    await navigator.clipboard.writeText(transcriptText);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 1500);
  };

  // Status indicator (glowing dot)
  const statusColor =
    dockerStatus === "ok"
      ? "bg-green-500 shadow-[0_0_8px_2px_#22c55e88]"
      : dockerStatus === "loading"
      ? "bg-gray-400 shadow-[0_0_8px_2px_#a1a1aa77] animate-pulse"
      : "bg-red-500 shadow-[0_0_8px_2px_#ef444488]";
  const statusText =
    dockerStatus === "ok"
      ? "Active"
      : dockerStatus === "loading"
      ? "Checking..."
      : "Inactive";

  return (
    <div className="flex flex-col h-full min-h-[80vh] w-full px-2 sm:px-4 py-6 space-y-8">
      <div className="flex items-center justify-between mb-2 sm:mb-4 w-full">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Call Logs
        </h1>
        {hasMounted && usdInrRate && (
          <span className="text-xs text-muted-foreground ml-4">
            1 USD = ₹{usdInrRate.toFixed(2)}
          </span>
        )}
      </div>

      {/* Stats Row (includes status card) */}
      <div className="flex flex-wrap w-full gap-x-6 gap-y-4 justify-between items-stretch">
        {/* ...existing code for stats row... */}
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Total Calls
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">
              {callLogs.length}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Unique Users
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">
              {new Set(callLogs.map((log) => log.src)).size}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Avg. Duration
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">
              {callLogs.length > 0
                ? `${(
                    callLogs.reduce((acc, log) => acc + log.duration, 0) /
                    callLogs.length
                  ).toFixed(2)}s`
                : "0s"}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Last Call
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">
              {hasMounted && callLogs.length > 0
                ? new Date(
                    Math.max(
                      ...callLogs.map((log) =>
                        new Date(log.start).getTime()
                      )
                    )
                  ).toLocaleDateString()
                : !hasMounted
                ? "--/--/----"
                : "N/A"}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold">{statusText}</span>
            <span
              className={`inline-block w-4 h-4 rounded-full ${statusColor}`}
              aria-label={`Status: ${statusText}`}
            ></span>
          </div>
        </div>
      </div>

      {/* Table, search, and controls in a single flat container */}
      <div className="flex-1 w-full max-w-12xl overflow-x-auto mt-2 rounded-xl bg-muted shadow p-2 sm:p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 pb-2">
              <Input
                placeholder="Search by number"
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
              />
              <Button
                variant="destructive"
                size="sm"
                className="ml-4 bg-destructive/80 text-destructive-foreground border border-destructive shadow hover:bg-destructive dark:bg-destructive/70 dark:hover:bg-destructive transition"
                disabled={selectedRows.size === 0 || deleting}
                onClick={async () => {
                  if (selectedRows.size === 0) return;
                  setDeleting(true);
                  try {
                    const res = await fetch(
                      "https://ai.rajatkhandelwal.com/deletecalllog",
                      {
                        method: "POST",
                        headers: {
                          ...getAuthHeaders(),
                          Accept: "*/*",
                        },
                        body: JSON.stringify({
                          lastdata: Array.from(selectedRows),
                        }),
                      }
                    );
                    if (res.ok) {
                      setLogs((prev) =>
                        prev.filter(
                          (l) => !l.lastdata || !selectedRows.has(l.lastdata)
                        )
                      );
                      setSelectedRows(new Set());
                    } else {
                      alert("Failed to delete selected call logs.");
                    }
                  } catch {
                    alert("Failed to delete selected call logs.");
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" /> Delete Selected
              </Button>
            </div>
            <div className="w-full overflow-x-auto">
              <Table className="w-full" style={{ tableLayout: "auto" }}>
                {/* ...existing code for TableHeader, TableBody... */}
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header, i) => (
                        <TableHead
                          key={header.id}
                          className={
                            i === 0
                              ? "px-2 py-2 text-left text-base font-semibold w-8"
                              : "px-4 py-2 whitespace-nowrap text-left text-base font-semibold"
                          }
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
                        {row.getVisibleCells().map((cell, i) => (
                          <TableCell
                            key={cell.id}
                            className={
                              i === 0
                                ? "px-2 py-2 w-8"
                                : "px-4 py-2 whitespace-nowrap text-base"
                            }
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
              <span className="text-sm font-mono opacity-80 select-none">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
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
                {/* ...existing code for dialog content... */}
                <DialogHeader>
                  <div className="flex flex-row items-center gap-2">
                    <DialogTitle>Call Details</DialogTitle>
                    {selectedLog?.lastdata && (
                      <button
                        title="Delete Call Log"
                        className="ml-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                        disabled={deleting}
                        onClick={async () => {
                          setDeleting(true);
                          try {
                            const res = await fetch(
                              "https://ai.rajatkhandelwal.com/deletecalllog",
                              {
                                method: "POST",
                                headers: {
                                  ...getAuthHeaders(),
                                  Accept: "*/*",
                                },
                                body: JSON.stringify({
                                  lastdata: [selectedLog.lastdata],
                                }),
                              }
                            );
                            if (res.ok) {
                              setLogs((prev) =>
                                prev.filter(
                                  (l) => l.lastdata !== selectedLog.lastdata
                                )
                              );
                              setSelectedLog(null);
                            } else {
                              alert("Failed to delete call log.");
                            }
                          } catch {
                            alert("Failed to delete call log.");
                          } finally {
                            setDeleting(false);
                          }
                        }}
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    )}
                  </div>
                </DialogHeader>
                {selectedLog && (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background rounded-lg p-4 shadow">
                      <div>
                        <span className="font-medium">Date:</span>
                        <div>
                          {hasMounted
                            ? (() => {
                                const date = new Date(selectedLog.start);
                                const day = date.getDate();
                                const daySuffix =
                                  day % 10 === 1 && day !== 11
                                    ? "st"
                                    : day % 10 === 2 && day !== 12
                                    ? "nd"
                                    : day % 10 === 3 && day !== 13
                                    ? "rd"
                                    : "th";
                                const month = date.toLocaleString("en-US", {
                                  month: "short",
                                });
                                const year = date.getFullYear();
                                return `${day}${daySuffix} ${month} ${year}`;
                              })()
                            : "--"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Time:</span>
                        <div>
                          {hasMounted
                            ? (() => {
                                const date = new Date(selectedLog.start);
                                return date
                                  .toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                  .replace("AM", "am")
                                  .replace("PM", "pm");
                              })()
                            : "--:--"}
                        </div>
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
                    <div>
                      <h3 className="text-base font-semibold mb-2">
                        Call Recording
                      </h3>
                      {selectedLog.lastdata ? (
                        <AudioPlayer
                          audioUrl={getAudioUrl(selectedLog.lastdata)}
                        />
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          No audio recording available.
                        </div>
                      )}
                    </div>
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
                            {copyStatus === "copied"
                              ? "Copied!"
                              : "Copy All"}
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
          </>
        )}
      </div>
    </div>
  );
}
