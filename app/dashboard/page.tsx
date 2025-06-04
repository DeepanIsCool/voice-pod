//dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { getAuthHeaders } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CallLogsTable } from "@/components/call-logs-table"
import { useToast } from "@/components/ui/use-toast"

// Unified CallLog type for both API and table
interface CallLog {
  id: string
  start: string // maps to API 'start'
  duration: number
  channel: string
  cost?: string
  sessionid?: string
  endreason?: string
  sessionstatus?: string
  usersentiment?: string
  from?: string
  to?: string
  sessionoutcome?: string
  latency?: string
  // API fields
  src?: string
  dst?: string
  disposition?: string
}

export default function Dashboard() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchCallLogs() {
      try {
        const response = await fetch("http://ai.rajatkhandelwal.com/calllogs", {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error("Failed to fetch call logs")
        }
        const data = await response.json()
        // Map API data to table CallLog type
        const mapped = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: item.id,
          start: item.start,
          duration: item.duration,
          channel: item.channel,
          cost: "$0.00",
          sessionid: item.uniqueid,
          endreason: item.disposition,
          sessionstatus: "ended",
          usersentiment: "-",
          from: item.src,
          to: item.dst,
          sessionoutcome: "Unsuccessful",
          latency: "-",
          src: item.src,
          dst: item.dst,
          disposition: item.disposition,
        }))
        setCallLogs(mapped)
      } catch (error) {
        console.error("Error fetching call logs:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load call logs. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchCallLogs();
    interval = setInterval(fetchCallLogs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [toast])

  return (
    <div className="flex flex-col h-full min-h-[80vh] space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ...existing code for cards... */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{callLogs.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{new Set(callLogs.map((log) => log.from)).size}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {callLogs.length > 0
                  ? `${(callLogs.reduce((acc, log) => acc + log.duration, 0) / callLogs.length).toFixed(2)}s`
                  : "0s"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Call</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {callLogs.length > 0
                  ? new Date(Math.max(...callLogs.map((log) => new Date(log.start).getTime()))).toLocaleDateString()
                  : "N/A"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex-1">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Call Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-2 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="w-full">
                <CallLogsTable data={callLogs} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
