"use client";

import { CallLogsTable } from "@/components/call-logs-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { useEffect, useState } from "react";

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
  latency: number | undefined;
}

export default function Dashboard() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [dockerStatus, setDockerStatus] = useState<"ok" | "error" | "loading">(
    "loading"
  );

  // Fetch docker health
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
            summary: Array.isArray(item.Summary)
              ? item.Summary.map((sum: any) => ({
                  transcription: Array.isArray(sum.transcription)
                    ? sum.transcription.map((t: any) => ({
                        role: t.role ?? "",
                        content: t.content ?? "",
                      }))
                    : [],
                }))
              : [],
            latency: item.latency ?? undefined,
          })
        );
        setCallLogs(mapped);
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
      </div>

      {/* Stats Row (includes status card) */}
      <div className="flex flex-wrap w-full gap-x-6 gap-y-4 justify-between items-stretch">
        {/* Total Calls */}
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Total Calls
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">{callLogs.length}</span>
          )}
        </div>
        {/* Unique Users */}
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
        {/* Avg Duration */}
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
        {/* Last Call */}
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Last Call
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">
              {callLogs.length > 0
                ? new Date(
                    Math.max(
                      ...callLogs.map((log) => new Date(log.start).getTime())
                    )
                  ).toLocaleDateString()
                : "N/A"}
            </span>
          )}
        </div>
        {/* Status */}
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

      {/* Table, fills width and scrolls if necessary */}
      <div className="flex-1 w-full max-w-12xl  overflow-x-auto mt-2 rounded-xl bg-muted shadow p-2 sm:p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <CallLogsTable data={callLogs} />
        )}
      </div>
    </div>
  );
}
