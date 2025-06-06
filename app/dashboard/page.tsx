//app/dashboard/page.tsx

"use client"

import { useEffect, useState } from "react"
import { getAuthHeaders } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CallLogsTable } from "@/components/call-logs-table"
import { useToast } from "@/components/ui/use-toast"

// Add transcript/summary to CallLog for future chat popup
interface CallLog {
  id: string
  name: string | undefined
  accountcode: string | undefined
  src: string | undefined
  dst: string | undefined
  dcontext: string | undefined
  clid: string | undefined
  channel: string
  dstchannel: string | undefined
  lastapp: string | undefined
  lastdata: string | undefined
  start: string
  answer: string | undefined
  end: string | undefined
  duration: number
  billsec: number | undefined
  disposition: string | undefined
  amaflags: string | undefined
  uniqueid: string | undefined
  userfield: string | undefined
  // For transcript
  summary: Array<{
    transcription: Array<{
      role: string
      content: string
    }>
  }>
}

export default function Dashboard() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    let interval: NodeJS.Timeout
    async function fetchCallLogs() {
      try {
        const response = await fetch("https://ai.rajatkhandelwal.com/calllogs", {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error("Failed to fetch call logs")
        }
        const data = await response.json()
        // Map all fields
        const mapped: CallLog[] = (Array.isArray(data) ? data : []).map((item: any) => ({
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
          billsec: typeof item.billsec === "number" ? item.billsec : undefined,
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
    fetchCallLogs()
    interval = setInterval(fetchCallLogs, 60000)
    return () => clearInterval(interval)
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
              <div className="text-2xl font-bold">{new Set(callLogs.map((log) => log.src)).size}</div>
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
