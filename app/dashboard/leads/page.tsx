'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthHeaders } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const API_URL = 'https://ai.rajatkhandelwal.com';

type Lead = {
  id: string;
  dateAdded: string;
  firstNameLowerCase: string;
  lastNameLowerCase: string;
  phone: string;
  email: string;
  state: string | null;
  address: string | null;
  source: string | null;
  customFields: string;
  country?: string | null;
};

type CallResult = {
  number: number;
  data: {
    id: string;
    [key: string]: any;
  };
};

const PAGE_SIZE = 100;
const MAX_SELECT = 20;

function parseCustomFields(json: string): { id: string; value: string }[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function formatPhone(phone: string) {
  if (phone.startsWith('+91')) return phone.slice(3);
  if (phone.startsWith('+')) return phone.slice(1);
  return phone;
}

function formatDate(date: string) {
  try {
    return format(new Date(date), 'dd MMM yyyy, hh:mm a');
  } catch {
    return date;
  }
}

function isTerminalStatus(status: string) {
  const val = status?.toLowerCase();
  return val === 'hangup' || val === 'down' || val === 'failed' || val === 'completed' || val === 'answered' || val === 'busy';
}

export default function LeadsDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [callStatus, setCallStatus] = useState<Record<string, string>>({});
  const [callLoading, setCallLoading] = useState(false);
  const [activeCallMap, setActiveCallMap] = useState<Record<string, string>>({}); // phone -> leadId
  const [polling, setPolling] = useState(false);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);
  const [userModal, setUserModal] = useState<{ open: boolean; lead: Lead | null }>({ open: false, lead: null });
  const [error, setError] = useState<string | null>(null);

  // Fetch leads with pagination
  const fetchLeads = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/leads`, {
        headers: {
          ...getAuthHeaders(),
          'Accept': '*/*',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data: Lead[] = await res.json();
      setTotalLeads(data.length);
      setLeads(data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(page);
  }, [fetchLeads, page]);

  const totalPages = useMemo(() => Math.ceil(totalLeads / PAGE_SIZE), [totalLeads]);

  const handleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_SELECT) next.add(id);
      return next;
    });
  };

  const isCheckboxDisabled = (id: string) => {
    return !selected.has(id) && selected.size >= MAX_SELECT;
  };

const handleCall = async () => {
  if (selected.size === 0) return;
  setCallLoading(true);
  setError(null);

  try {
    const selectedLeads = leads.filter(lead => selected.has(lead.id));
    const numbers = selectedLeads
      .map(l => l.phone)
      .filter(Boolean)
      .map(phone => formatPhone(phone as string));

    console.log('Calling numbers:', numbers);

    const res = await fetch(`${API_URL}/makecall`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ numbers: numbers.map(Number) }),
    });

    if (!res.ok) throw new Error('Failed to initiate call');
    const data = await res.json();

    console.log('makecall response:', data);

    // Map callId (data.id) to leadId
    const callIdToLeadId: Record<string, string> = {};

    data.results.forEach((result: CallResult) => {
      const callId = result.data?.id;
      const phone = String(result.number);
      const lead = selectedLeads.find(l => formatPhone(l.phone) === phone);
      if (lead && callId) {
        callIdToLeadId[callId] = lead.id;
        setCallStatus(prev => {
          console.log(`Setting callStatus for lead ${lead.id} to 'initiating'`);
          return { ...prev, [lead.id]: 'initiating' };
        });
      }
    });

    console.log('callIdToLeadId mapping:', callIdToLeadId);

    setActiveCallMap(callIdToLeadId);

    // Start polling after 5 seconds
    setTimeout(() => {
      setPolling(true);
    }, 1000);

  } catch (e: any) {
    setError(e.message || 'Unknown error');
    setCallLoading(false);
    setSelected(new Set());
  }
};

  // Poll for call status every second
useEffect(() => {
  if (!polling || Object.keys(activeCallMap).length === 0) return;
  let stopped = false;

  async function poll() {
    if (stopped) return;
    try {
      const callIds = Object.keys(activeCallMap);
      if (callIds.length === 0) return;

      console.log('Polling call status for callIds:', callIds);

      const statusRes = await fetch(`${API_URL}/callstatus`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ callIds }), // send array of call IDs
      });

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        console.log('callstatus response:', statusData);

        const statusMap: Record<string, string> = {};
        let allDone = true;

        statusData.results.forEach((result: any) => {
          const leadId = activeCallMap[result.callId];
          if (leadId) {
            const value = result.status ?? result.state ?? '-';
            console.log(`Lead ${leadId} callId ${result.callId} status:`, value);
            statusMap[leadId] = value;
            if (!isTerminalStatus(value)) {
              allDone = false;
            }
          }
        });

        setCallStatus(prev => {
          console.log('Updating callStatus:', { ...prev, ...statusMap });
          return { ...prev, ...statusMap };
        });

        if (allDone) {
          setPolling(false);
          setCallLoading(false);
          setSelected(new Set());
          setActiveCallMap({});
          return;
        }
      }
    } catch (e) {
      setError('Failed to poll call status.');
      setPolling(false);
      setCallLoading(false);
      setActiveCallMap({});
    }

    // Schedule next poll
    pollingRef.current = setTimeout(poll, 1000);
  }

  poll();

  return () => {
    stopped = true;
    if (pollingRef.current) clearTimeout(pollingRef.current);
  };
}, [polling, activeCallMap]);

function isTerminalStatus(status: string) {
  const val = status?.toLowerCase();
  console.log('Checking terminal status for:', status, '->', val);
  return val === 'hangup' || val === 'down' || val === 'failed' || val === 'completed' || val === 'answered' || val === 'busy';
}

  // Get active lead IDs
  const activeLeadIds = useMemo(() => {
    return new Set(Object.values(activeCallMap));
  }, [activeCallMap]);

  const columns = [
    { key: 'id', label: 'Id', width: 'w-24' },
    { key: 'dateAdded', label: 'Date', width: 'w-40' },
    { key: 'name', label: 'Name', width: 'w-48' },
    { key: 'phone', label: 'Phone', width: 'w-40' },
    { key: 'callStatus', label: 'Call Status', width: 'w-32' },
  ];

  const openUserModal = (lead: Lead) => {
    // Prevent opening modal for active calls
    if (activeLeadIds.has(lead.id)) return;
    setUserModal({ open: true, lead });
  };
  
  const closeUserModal = () => setUserModal({ open: false, lead: null });

  const filteredLeads = useMemo(() => {
    if (!search.trim()) return leads;
    return leads.filter(lead =>
      lead.phone && lead.phone.replace(/\D/g, '').includes(search.replace(/\D/g, ''))
    );
  }, [leads, search]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-8 pt-8 pb-4 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Leads Dashboard</h1>
      </header>
      <main className="flex-1 px-8 pb-8 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-muted-foreground">
              Showing <b>{filteredLeads.length}</b> of <b>{totalLeads}</b> leads
              {selected.size > 0 && (
                <span className="ml-2 text-xs text-primary">
                  | <b>{selected.size}</b> selected
                </span>
              )}
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by phone number"
              className="mt-1 sm:mt-0 px-2 py-1 rounded bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-56"
            />
          </div>
          <Button
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg shadow transition",
              callLoading || selected.size === 0 ? "opacity-60 cursor-not-allowed" : ""
            )}
            disabled={callLoading || selected.size === 0}
            onClick={handleCall}
          >
            {callLoading ? 'Calling...' : 'CALL'}
          </Button>
        </div>
        <div className="rounded-xl overflow-hidden shadow-lg bg-card border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left font-mono text-xs">
              <thead>
                <tr className="bg-muted text-muted-foreground text-xs">
                  <th className="px-2 py-2 w-12"></th>
                  {columns.map(col => (
                    <th key={col.key} className={cn('px-2 py-2 font-semibold text-xs', col.width)}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="px-4 py-3"><Skeleton className="h-5 w-5 rounded" /></td>
                        {columns.map(col => (
                          <td key={col.key} className={cn('px-4 py-3', col.width)}>
                            <Skeleton className="h-5 w-full rounded" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filteredLeads.map(lead => {
                      const isActive = activeLeadIds.has(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          className={cn(
                            'border-b border-border hover:bg-accent transition cursor-pointer group text-xs',
                            selected.has(lead.id) ? 'bg-accent/60' : '',
                            isActive ? 'opacity-50 pointer-events-none' : ''
                          )}
                          tabIndex={0}
                          onClick={() => openUserModal(lead)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') openUserModal(lead);
                          }}
                        >
                          <td className="px-2 py-2">
                            <Checkbox
                              checked={selected.has(lead.id)}
                              onCheckedChange={() => handleSelect(lead.id)}
                              disabled={isCheckboxDisabled(lead.id) || callLoading || isActive}
                              aria-label={`Select lead ${lead.firstNameLowerCase} ${lead.lastNameLowerCase}`}
                              className="border-primary data-[state=checked]:bg-primary"
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                          <td className={cn('px-2 py-2', columns[0].width)}>{lead.id}</td>
                          <td className={cn('px-2 py-2', columns[1].width)}>{formatDate(lead.dateAdded)}</td>
                          <td className={cn('px-2 py-2', columns[2].width)}>
                            <span className="capitalize">{lead.firstNameLowerCase} {lead.lastNameLowerCase}</span>
                          </td>
                          <td className={cn('px-2 py-2', columns[3].width)}>{lead.phone}</td>
                          <td className={cn('px-2 py-2', columns[4].width)}>
                            {(() => {
                              const value = callStatus[lead.id];
                              return value
                                ? <span className={cn(
                                    isTerminalStatus(value)
                                      ? 'text-destructive'
                                      : value === 'Ringing'
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : value === 'Up'
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-muted-foreground'
                                  )}>{value}</span>
                                : <span className="text-muted-foreground">-</span>;
                            })()}
                          </td>
                        </tr>
                      )})}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-muted border-t border-border">
            <div className="text-sm text-muted-foreground">
              Page <b>{page}</b> of <b>{totalPages}</b>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="text-primary"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                className="text-primary"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 text-destructive bg-destructive/10 px-4 py-2 rounded-lg border border-destructive">
            {error}
          </div>
        )}
      </main>
      <Dialog open={userModal.open} onOpenChange={closeUserModal}>
        <DialogContent className="max-w-lg bg-card border border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              User Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed information about the selected user.
            </DialogDescription>
          </DialogHeader>
          {userModal.lead ? (
            <div className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="text-primary font-mono">ID</div>
                <div className="text-foreground">{userModal.lead.id}</div>
                <div className="text-primary font-mono">Date</div>
                <div className="text-foreground">{formatDate(userModal.lead.dateAdded)}</div>
                <div className="text-primary font-mono">Name</div>
                <div className="text-foreground capitalize">{userModal.lead.firstNameLowerCase} {userModal.lead.lastNameLowerCase}</div>
                <div className="text-primary font-mono">Phone</div>
                <div className="text-foreground">{userModal.lead.phone}</div>
                <div className="text-primary font-mono">Email</div>
                <div className="text-foreground">{userModal.lead.email}</div>
                <div className="text-primary font-mono">Address</div>
                <div className="text-foreground">{userModal.lead.address || '-'}</div>
                <div className="text-primary font-mono">State</div>
                <div className="text-foreground">{userModal.lead.state || '-'}</div>
                <div className="text-primary font-mono">Country</div>
                <div className="text-foreground">{userModal.lead.country || '-'}</div>
                <div className="text-primary font-mono">Source</div>
                <div className="text-foreground">{userModal.lead.source || '-'}</div>
                <div className="text-primary font-mono">Custom Fields</div>
                <div className="text-foreground flex flex-col gap-1">
                  {parseCustomFields(userModal.lead.customFields).length === 0
                    ? <span>-</span>
                    : parseCustomFields(userModal.lead.customFields).map(field => (
                        <span key={field.id} className="text-muted-foreground text-xs">{field.value}</span>
                      ))}
                </div>
              </div>
              <Button
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                onClick={closeUserModal}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}