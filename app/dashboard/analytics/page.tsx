"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
// --- USD to INR conversion helpers (copied from call-logs) ---
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
import { Info, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";

// API DATA STRUCTURE
interface CallLog {
  id: string;
  src?: string | null;
  dst?: string | null;
  start: string;
  duration: number;
  latency?: number | null;
  cost?: number | string | null;
  dcontext?: string | null;
}

// COLOR PALETTE
const PIE_COLORS_LIGHT = ["#2563eb", "#38bdf8"];
const PIE_COLORS_DARK = ["#60a5fa", "#22d3ee"];

// UTILS
const getShortDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const groupByDay = (logs: CallLog[]) => {
  const map: Record<string, CallLog[]> = {};
  logs.forEach((log) => {
    const day = getShortDate(log.start);
    if (!map[day]) map[day] = [];
    map[day].push(log);
  });
  return map;
};

const isIncoming = (log: CallLog) =>
  (log.dcontext || "").toLowerCase().includes("inbound") ||
  (!!log.dst && (!log.src || log.src === "")); // fallback

const isOutgoing = (log: CallLog) =>
  (log.dcontext || "").toLowerCase().includes("outbound") ||
  (!!log.src && !!log.dst); // fallback

// CARD COMPONENT
function MetricCard({
  title,
  value,
  loading,
  tooltip,
  className = "",
  children,
}: {
  title: string;
  value?: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`
        flex flex-col gap-1 rounded-2xl
        shadow-[0_3px_20px_0_rgba(37,99,235,0.08)]
        border border-border px-6 py-4 min-w-[180px] 
        bg-white/90 dark:bg-[#141a2a]/80
        transition-all ${className}
      `}
    >
      <div className="flex flex-row items-center gap-2 mb-1">
        <span className="text-base font-semibold text-blue-700 dark:text-blue-300">
          {title}
        </span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white dark:bg-gray-900 border border-border text-xs text-gray-700 dark:text-gray-200 shadow-lg">
                <span>{tooltip}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center">
        {loading ? (
          <Skeleton className="h-8 w-24 rounded-lg" />
        ) : (
          <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {value}
          </span>
        )}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

// CHART COMPONENTS
import { LabelList } from "recharts";

function BarChartCard({
  title,
  data,
  loading,
  dataKey,
  tooltip,
  color,
  height = 260, // Increased height for better visibility
}: any) {
  const { resolvedTheme } = useTheme();
  const barColor = color || (resolvedTheme === "dark" ? "#60a5fa" : "#2563eb");
  const axisColor = resolvedTheme === "dark" ? "#cbd5e1" : "#64748b";
  const tickColor = resolvedTheme === "dark" ? "#dbeafe" : "#334155";
  const gridColor = resolvedTheme === "dark" ? "#334155" : "#e5e7eb";
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-[#141a2a]/80 shadow-md border border-border px-7 py-5 flex-1 flex flex-col min-w-[260px] min-h-[260px] transition-all">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-semibold text-blue-700 dark:text-blue-300">{title}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white dark:bg-gray-900 border border-border text-xs text-gray-700 dark:text-gray-200 shadow-lg">
                <span>{tooltip}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-[220px] w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} barCategoryGap={30} margin={{ top: 30, right: 20, left: 0, bottom: 20 }}>
            <XAxis
              dataKey="name"
              stroke={axisColor}
              fontSize={14}
              tick={{ fill: tickColor, fontWeight: 500 }}
              axisLine={{ stroke: axisColor, strokeWidth: 1 }}
              tickLine={false}
              height={36}
              interval={0}
              angle={0}
              dy={8}
            />
            <YAxis
              stroke={axisColor}
              fontSize={14}
              tick={{ fill: tickColor, fontWeight: 500 }}
              axisLine={{ stroke: axisColor, strokeWidth: 1 }}
              tickLine={false}
              width={32}
              allowDecimals={false}
              minTickGap={2}
              domain={[0, (dataMax: number) => Math.max(dataMax + 2, 10)]}
              tickCount={6}
            />
            <ReTooltip
              contentStyle={{
                background: resolvedTheme === "dark" ? "#1e293b" : "#fff",
                borderColor: resolvedTheme === "dark" ? "#334155" : "#cbd5e1",
                color: resolvedTheme === "dark" ? "#fff" : "#222",
              }}
              cursor={{ fill: resolvedTheme === "dark" ? "#334155" : "#e0e7ef", opacity: 0.12 }}
            />
            <Bar
              dataKey={dataKey}
              fill={barColor}
              radius={[12, 12, 0, 0]}
              maxBarSize={48}
            >
              <LabelList
                dataKey={dataKey}
                position="top"
                style={{
                  fill: barColor,
                  fontWeight: 700,
                  fontSize: 16,
                  textShadow: resolvedTheme === "dark"
                    ? "0 1px 2px #141a2a"
                    : "0 1px 2px #fff"
                }}
                formatter={(value: any) => (value > 0 ? value : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function PieChartCard({ title, data, loading, tooltip, height = 220 }: any) {
  const { resolvedTheme } = useTheme();
  const COLORS = resolvedTheme === "dark" ? PIE_COLORS_DARK : PIE_COLORS_LIGHT;
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-[#141a2a]/80 shadow-md border border-border px-6 py-4 flex-1 flex flex-col min-w-[260px] min-h-[220px] transition-all">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base font-semibold text-blue-700 dark:text-blue-300">{title}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white dark:bg-gray-900 border border-border text-xs text-gray-700 dark:text-gray-200 shadow-lg">
                <span>{tooltip}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-[180px] w-full rounded-lg" />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full gap-2">
          <ResponsiveContainer width="100%" height={height - 40}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent, index }) => (
                  <span style={{
                    color: resolvedTheme === "dark" ? COLORS[index % COLORS.length] : COLORS[index % COLORS.length],
                    fontWeight: 600,
                    fontSize: 13,
                  }}>{`${name}: ${value}`}</span>
                )}
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={false}
                stroke={resolvedTheme === "dark" ? "#1e293b" : "#fff"}
              >
                {data.map((entry: any, idx: number) => (
                  <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip
                contentStyle={{
                  background: resolvedTheme === "dark" ? "#1e293b" : "#fff",
                  borderColor: resolvedTheme === "dark" ? "#334155" : "#cbd5e1",
                  color: resolvedTheme === "dark" ? "#fff" : "#222",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-row justify-center gap-6 mt-2">
            {data.map((entry: any, idx: number) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  aria-label={entry.name}
                />
                <span className="text-sm font-medium" style={{ color: resolvedTheme === "dark" ? COLORS[idx % COLORS.length] : COLORS[idx % COLORS.length] }}>
                  {entry.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold ml-1">({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const { resolvedTheme } = useTheme();

  // --- Currency conversion state ---
  const [usdInrRate, setUsdInrRate] = useState<number | null>(getCachedUsdInr() || null);
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

  // API FETCH
  const fetchCallLogs = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("https://ai.rajatkhandelwal.com/calllogs", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch call logs");
      const data = await response.json();
      const mapped: CallLog[] = (Array.isArray(data) ? data : []).map(
        (item: any) => ({
          id: item.id,
          src: item.src ?? undefined,
          dst: item.dst ?? undefined,
          start: item.start ?? "",
          duration: typeof item.duration === "number" ? item.duration : 0,
          latency: item.latency ?? null,
          cost: item.cost ?? null,
          dcontext: item.dcontext ?? null,
        })
      );
      setCallLogs(mapped);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load call logs. Please try again later.",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
    const interval = setInterval(fetchCallLogs, 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  // METRICS
  const totalCallCount = useMemo(() => callLogs.length, [callLogs]);
  const avgCallDuration = useMemo(
    () =>
      callLogs.length === 0
        ? 0
        : callLogs.reduce((acc, l) => acc + l.duration, 0) / callLogs.length,
    [callLogs]
  );

  // --- Average cost in INR ---
  const avgCostInr = useMemo(() => {
    if (!callLogs.length) return 0;
    const totalUsd = callLogs.reduce((acc, l) => acc + (typeof l.cost === 'number' ? l.cost : Number(l.cost) || 0), 0);
    if (!usdInrRate) return 0;
    return totalUsd * usdInrRate / callLogs.length;
  }, [callLogs, usdInrRate]);
  const avgLatency = useMemo(() => {
    const filtered = callLogs.filter((l) => typeof l.latency === "number");
    return filtered.length
      ? filtered.reduce((acc, l) => acc + (l.latency as number), 0) /
          filtered.length
      : 0;
  }, [callLogs]);
  // --- Leads count from leads API ---
  const [totalLeads, setTotalLeads] = useState<number>(0);
  useEffect(() => {
    async function fetchLeadsCount() {
      try {
        const res = await fetch("https://ai.rajatkhandelwal.com/leads", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch leads");
        const data = await res.json();
        setTotalLeads(Array.isArray(data) ? data.length : 0);
      } catch {
        setTotalLeads(0);
      }
    }
    fetchLeadsCount();
  }, []);
  const uniqueLeads = useMemo(() => {
    const leads = new Set<string>();
    callLogs.forEach((l) => {
      if (l.src && l.src.toLowerCase() !== "agent") leads.add(l.src);
      if (l.dst && l.dst.toLowerCase() !== "agent") leads.add(l.dst);
    });
    return leads.size;
  }, [callLogs]);
  const incomingCount = useMemo(
    () => callLogs.filter(isIncoming).length,
    [callLogs]
  );
  const outgoingCount = useMemo(
    () => callLogs.filter(isOutgoing).length,
    [callLogs]
  );

  const costPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    callLogs.forEach((l) => {
      const day = getShortDate(l.start);
      const cost = typeof l.cost === "number" ? l.cost : Number(l.cost) || 0;
      if (!map[day]) map[day] = 0;
      map[day] += cost;
    });
    // Sort by date ascending (oldest to newest)
    return Object.entries(map)
      .map(([k, v]) => ({ name: k, value: v }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [callLogs]);

  const callsPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    callLogs.forEach((l) => {
      const day = getShortDate(l.start);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [callLogs]);

  const callTypePie = useMemo(() => {
    return [
      { name: "Incoming", value: incomingCount },
      { name: "Outgoing", value: outgoingCount },
    ];
  }, [incomingCount, outgoingCount]);

  // PAGE LAYOUT
  return (
    <>
      <div className="flex items-center justify-between mb-2 sm:mb-4 w-full">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Analytics Dashboard
        </h1>
        <button
          onClick={fetchCallLogs}
          className="flex items-center gap-2 border border-primary text-primary hover:bg-primary/10 font-semibold rounded-lg shadow transition px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={refreshing}
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className={`flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-[#151d2e] dark:via-[#0f172a] dark:to-[#172554] py-6 px-2 sm:px-6 space-y-10 w-full`}>
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
          <MetricCard
            title="Avg Call Duration"
            loading={isLoading}
            value={`${avgCallDuration.toFixed(1)}s`}
            tooltip="Average Call Duration = Total duration of all calls ÷ Number of calls"
          />
          <MetricCard
            title="Call Counts"
            loading={isLoading}
            value={totalCallCount}
            tooltip="Total number of calls = Total rows in call logs"
          />
          <MetricCard
            title="Avg Latency"
            loading={isLoading}
            value={`${avgLatency.toFixed(0)} ms`}
            tooltip="Average Latency = Sum of 'latency' ÷ Number of calls with latency"
          />
          <MetricCard
            title="Total Leads"
            loading={isLoading}
            value={totalLeads}
            tooltip="Total Leads = Unique phone numbers (src + dst)"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Unique Leads"
              loading={isLoading}
              value={uniqueLeads}
              tooltip="Unique Leads = Unique src numbers"
              className="min-w-[120px] px-3 py-4"
            />
          <MetricCard
            title="Avg Cost"
            loading={isLoading}
            value={
              isLoading
                ? undefined
                : usdInrRate
                  ? `₹${avgCostInr.toFixed(2)}`
                  : callLogs.length === 0
                    ? 0
                    : `$${(
                        callLogs.reduce((acc, l) => acc + (typeof l.cost === 'number' ? l.cost : Number(l.cost) || 0), 0) / callLogs.length
                      ).toFixed(4)}`
            }
            tooltip={
              usdInrRate
                ? `Average Cost = Total cost of all calls ÷ Number of calls, converted to INR.\nCurrent rate: 1 USD = ₹${usdInrRate.toFixed(2)}`
                : usdInrError
                  ? `Average Cost = Total cost of all calls ÷ Number of calls.\n${usdInrError}`
                  : "Average Cost = Total cost of all calls ÷ Number of calls"
            }
            className="min-w-[120px] px-3 py-4"
          />
          </div>
          <PieChartCard
            title="Incoming / Outgoing"
            loading={isLoading}
            data={callTypePie}
            tooltip="Count of calls by direction (inferred from dcontext or src/dst fields)"
          />
          <BarChartCard
            title="Total Calls Per Day"
            loading={isLoading}
            data={callsPerDay}
            dataKey="count"
            tooltip="Bar chart of calls grouped by day"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <BarChartCard
            title="Total Cost / Day"
            loading={isLoading}
            data={costPerDay}
            dataKey="value"
            tooltip="Sum of 'cost' per day from call logs"
            height={220}
          />
          <div className="rounded-2xl bg-white/80 dark:bg-[#1e253b]/60 border border-dashed border-blue-200 flex flex-col justify-center items-center min-h-[220px]">
            <span className="text-xl font-bold text-blue-400 dark:text-blue-200 opacity-60">
              More Analytics Coming Soon
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
