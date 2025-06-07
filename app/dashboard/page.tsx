"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { CallLogsTable } from "@/components/call-logs-table";
import { useToast } from "@/components/ui/use-toast";

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

export default function Dashboard() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // "ok" | "error" | "loading"
  const [dockerStatus, setDockerStatus] = useState<"ok" | "error" | "loading">(
    "loading"
  );

  // Fetch docker health, reusing previous status for interval requests (avoids flicker)
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
        // Try to parse JSON, but if it fails or status is not 'ok', treat as error
        let data;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        if (!cancelled) {
          if (data && data.status === "ok") {
            setDockerStatus("ok");
          } else {
            setDockerStatus("error");
          }
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

  return (
    <div className="flex flex-col h-full min-h-[80vh] w-full px-2 sm:px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
      </div>

      {/* Stats Row + RUNNING Button */}
      <div className="flex flex-row flex-wrap gap-4 w-full items-center">
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center min-w-[180px]">
          <span className="text-sm font-medium text-muted-foreground">
            Total Calls
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">{callLogs.length}</span>
          )}
        </div>
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center min-w-[180px]">
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
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center min-w-[180px]">
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
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center min-w-[180px]">
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
        {/* RUNNING BUTTON */}
        <button
          className={`
    px-8 py-3 rounded-lg font-bold text-lg shadow-md ml-2
    transition-all duration-200
    ${dockerStatus === "loading" ? "bg-gray-500 animate-pulse" : ""}
    ${
      dockerStatus === "ok"
        ? "bg-green-600 text-white"
        : dockerStatus === "error"
        ? "bg-red-600 text-white"
        : ""
    }
  `}
          style={{
            boxShadow:
              dockerStatus === "ok"
                ? "0 0 8px 2px #22c55e"
                : dockerStatus === "error"
                ? "0 0 8px 2px #ef4444"
                : undefined,
            filter:
              dockerStatus === "ok"
                ? "drop-shadow(0 0 5px #22c55e88)"
                : dockerStatus === "error"
                ? "drop-shadow(0 0 5px #ef444488)"
                : undefined,
          }}
          disabled={dockerStatus === "loading"}
        >
          {dockerStatus === "ok"
            ? "RUNNING!"
            : dockerStatus === "error"
            ? "Not Running"
            : "Checking..."}
        </button>
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
