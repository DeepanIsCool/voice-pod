'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthHeaders } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Phone } from 'lucide-react';
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

  // --- Custom Call (Dialpad) State ---
  const [dialpadOpen, setDialpadOpen] = useState(false);
  const [dialNumber, setDialNumber] = useState('');
  const [customCallId, setCustomCallId] = useState<string | null>(null);
  const [customCallStatus, setCustomCallStatus] = useState<string>('');
  const [customCallLoading, setCustomCallLoading] = useState(false);
  const [customPolling, setCustomPolling] = useState(false);
  const customPollingRef = React.useRef<NodeJS.Timeout | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

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

  // --- Dialpad Logic ---
  const handleDialpadInput = (val: string) => {
    if (customCallLoading || customPolling) return;
    if (val === 'back') setDialNumber(dialNumber.slice(0, -1));
    else if (val === '+') {
      if (!dialNumber.includes('+') && dialNumber.length === 0) setDialNumber('+');
    } else if (/\d/.test(val)) {
      setDialNumber(dialNumber + val);
    }
  };
  const handleDialpadClear = () => setDialNumber('');

  // --- Custom Call API ---
  const handleCustomCall = async () => {
    if (!dialNumber || customCallLoading || customPolling) return;
    setCustomCallLoading(true);
    setCustomError(null);
    setCustomCallStatus('initiating');
    try {
      const formatted = dialNumber.startsWith('+') ? dialNumber.slice(1) : dialNumber;
      const res = await fetch(`${API_URL}/makecall`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ numbers: [Number(formatted)] }),
      });
      if (!res.ok) throw new Error('Failed to initiate call');
      const data = await res.json();
      const callId = data.results?.[0]?.data?.id;
      if (!callId) throw new Error('No call ID returned');
      setCustomCallId(callId);
      setTimeout(() => setCustomPolling(true), 1000);
    } catch (e: any) {
      setCustomError(e.message || 'Unknown error');
      setCustomCallStatus('');
      setCustomCallLoading(false);
    }
  };

  // --- Custom Call Polling ---
  useEffect(() => {
    if (!customPolling || !customCallId) return;
    let stopped = false;
    async function poll() {
      if (stopped) return;
      try {
        const statusRes = await fetch(`${API_URL}/callstatus`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ callIds: [customCallId] }),
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const value = statusData.results?.[0]?.status ?? statusData.results?.[0]?.state ?? '-';
          setCustomCallStatus(value);
          if (isTerminalStatus(value)) {
            setCustomPolling(false);
            setCustomCallLoading(false);
            setCustomCallId(null);
            return;
          }
        }
      } catch {
        setCustomError('Failed to poll call status.');
        setCustomPolling(false);
        setCustomCallLoading(false);
        setCustomCallId(null);
      }
      customPollingRef.current = setTimeout(poll, 1000);
    }
    poll();
    return () => {
      stopped = true;
      if (customPollingRef.current) clearTimeout(customPollingRef.current);
    };
  }, [customPolling, customCallId]);

  // --- Dialpad UI ---
  const dialpadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['+', '0', 'back'],
  ];

  // Get active lead IDs
  const activeLeadIds = useMemo(() => {
    return new Set(Object.values(activeCallMap));
  }, [activeCallMap]);

  const columns = [
    { key: 'date', label: 'Date', width: 'w-32' },
    { key: 'time', label: 'Time', width: 'w-32' },
    { key: 'name', label: 'Name', width: 'w-48' },
    { key: 'phone', label: 'Phone', width: 'w-40' },
    { key: 'customField', label: 'Custom Field', width: 'w-48' },
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
    <div className="flex flex-col h-full min-h-[80vh] w-full px-2 sm:px-4 py-6 space-y-8">
      {/* Page Heading */}
      <h1 className="text-3xl font-bold tracking-tight text-primary mb-2 sm:mb-4">Lead Management</h1>
      {/* User Details Pop Up */}
      <Dialog open={userModal.open} onOpenChange={closeUserModal}>
        <DialogContent className="max-w-2xl w-full bg-card border border-border rounded-2xl shadow-2xl p-8 sm:p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary tracking-tight">
              User Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              Detailed information about the selected user.
            </DialogDescription>
          </DialogHeader>
          {userModal.lead ? (
            <div className="flex flex-col gap-1 mt-6">
              <div className="grid grid-cols-2 gap-x-1 gap-y-4 text-base">
                <div className="text-primary font-mono">ID</div>
                <div className="text-foreground break-all">{userModal.lead.id}</div>
                <div className="text-primary font-mono">Date</div>
                <div className="text-foreground">{formatDate(userModal.lead.dateAdded)}</div>
                <div className="text-primary font-mono">Name</div>
                <div className="text-foreground capitalize">{userModal.lead.firstNameLowerCase} {userModal.lead.lastNameLowerCase}</div>
                <div className="text-primary font-mono">Phone</div>
                <div className="text-foreground">{userModal.lead.phone}</div>
                <div className="text-primary font-mono">Email</div>
                <div className="text-foreground break-all">{userModal.lead.email || '-'}</div>
                <div className="text-primary font-mono">Address</div>
                <div className="text-foreground">{userModal.lead.address || '-'}</div>
                <div className="text-primary font-mono">State</div>
                <div className="text-foreground">{userModal.lead.state || '-'}</div>
                <div className="text-primary font-mono">Country</div>
                <div className="text-foreground">{userModal.lead.country || '-'}</div>
                <div className="text-primary font-mono">Source</div>
                <div className="text-foreground">{userModal.lead.source || '-'}</div>
                <div className="text-primary font-mono">Custom Fields</div>
                <div className="text-foreground flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {parseCustomFields(userModal.lead.customFields).length === 0
                    ? <span>-</span>
                    : parseCustomFields(userModal.lead.customFields).map(field => (
                        <span key={field.id} className="text-muted-foreground text-sm">{field.value}</span>
                      ))}
                </div>
              </div>
              <Button
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-8 py-2 text-base font-semibold shadow"
                onClick={closeUserModal}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mt-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Row */}
      <div className="flex flex-wrap w-full gap-x-6 gap-y-4 justify-between items-stretch">
        {/* Total Leads */}
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Total Leads
          </span>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">{totalLeads}</span>
          )}
        </div>
        {/* Selected Leads */}
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Selected Leads
          </span>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">{selected.size}</span>
          )}
        </div>
        {/* Active Calls */}
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Active Calls
          </span>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">{activeLeadIds.size}</span>
          )}
        </div>
        {/* Last Updated */}
        <div className="rounded-lg bg-muted shadow p-4 flex flex-col justify-center flex-1 min-w-[170px]">
          <span className="text-sm font-medium text-muted-foreground">
            Last Updated
          </span>
          {loading ? (
            <Skeleton className="h-7 w-20 mt-2" />
          ) : (
            <span className="text-2xl font-bold mt-1">
              {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
        <div className="flex gap-2">
          {/* Custom Call Button (left) */}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
            onClick={() => setDialpadOpen(true)}
            disabled={customCallLoading || customPolling}
          >
            <Phone className="w-4 h-4" />
            Custom Call
          </Button>
          {/* Main CALL Button (right) */}
          <Button
            size="sm"
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow transition px-4 py-2",
              callLoading || selected.size === 0 ? "opacity-60 cursor-not-allowed" : ""
            )}
            disabled={callLoading || selected.size === 0}
            onClick={handleCall}
          >
            {callLoading ? 'Calling...' : 'CALL'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 w-full max-w-12xl overflow-x-auto mt-2 rounded-xl bg-muted shadow p-2 sm:p-4">
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
                        <td className={cn('px-2 py-2', columns[0].width)}>
                          {(() => {
                            try {
                              const d = new Date(lead.dateAdded);
                              return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            } catch {
                              return '-';
                            }
                          })()}
                        </td>
                        <td className={cn('px-2 py-2', columns[1].width)}>
                          {(() => {
                            try {
                              const d = new Date(lead.dateAdded);
                              return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                            } catch {
                              return '-';
                            }
                          })()}
                        </td>
                        <td className={cn('px-2 py-2', columns[2].width)}>
                          <span className="capitalize">{lead.firstNameLowerCase} {lead.lastNameLowerCase}</span>
                        </td>
                        <td className={cn('px-2 py-2', columns[3].width)}>{lead.phone}</td>
                        <td className={cn('px-2 py-2', columns[4].width)}>
                          {(() => {
                            const fields = parseCustomFields(lead.customFields);
                            if (!fields.length) return <span className="text-muted-foreground">-</span>;
                            const words = fields[0].value.split(' ').slice(0, 3).join(' ');
                            return <span>{words}{fields[0].value.split(' ').length > 3 ? '...' : ''}</span>;
                          })()}
                        </td>
                        <td className={cn('px-2 py-2', columns[5].width)}>
                          {(() => {
                            const value = callStatus[lead.id];
                            return value
                              ? <span className={cn(
                                  'dark:text-white',
                                  'not-dark:' + (
                                    isTerminalStatus(value)
                                      ? 'text-destructive'
                                      : value === 'Ringing'
                                      ? 'text-yellow-600'
                                      : value === 'Up'
                                      ? 'text-green-600'
                                      : 'text-muted-foreground'
                                  )
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

      {/* Dialpad Modal */}
      <Dialog open={dialpadOpen} onOpenChange={open => {
        setDialpadOpen(open);
        if (!open) {
          setDialNumber('');
          setCustomCallId(null);
          setCustomCallStatus('');
          setCustomCallLoading(false);
          setCustomPolling(false);
          setCustomError(null);
        }
      }}>
        <DialogContent className="max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 flex flex-col items-center">
          <DialogHeader className="w-full">
            <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Custom Dialpad
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Enter a number to call directly. Only one custom call at a time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 w-full mt-2">
            {/* Number Display */}
            <div className="w-full flex justify-center">
              <Input
                value={dialNumber}
                onChange={e => setDialNumber(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder="Enter number"
                className="w-[260px] bg-muted rounded-lg px-3 py-2 text-center font-mono text-xl tracking-widest text-foreground border border-border select-all transition-colors"
                disabled={customCallLoading || customPolling}
                maxLength={15}
              />
            </div>
            {/* Dialpad */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-4 mt-2 w-[220px]">
              {dialpadButtons.flat().map((btn, i) => (
                <Button
                  key={btn + i}
                  variant="ghost"
                  className={cn(
                    'rounded-full h-11 w-11 text-lg font-mono flex items-center justify-center border border-border shadow-sm',
                    'transition-all duration-150',
                    btn === 'back' ? 'text-destructive' : 'text-foreground',
                    'hover:bg-accent hover:text-accent-foreground active:bg-primary/10',
                    customCallLoading || customPolling ? 'opacity-50 cursor-not-allowed' : ''
                  )}
                  onClick={() => handleDialpadInput(btn)}
                  disabled={customCallLoading || customPolling || (btn === '+' && dialNumber.length > 0)}
                >
                  {btn === 'back' ? <span>&larr;</span> : btn}
                </Button>
              ))}
            </div>
            {/* Actions */}
            <div className="flex gap-2 mt-1 w-full justify-center">
              <Button
                variant="ghost"
                className="text-muted-foreground border border-border rounded-lg px-4"
                onClick={handleDialpadClear}
                disabled={customCallLoading || customPolling || !dialNumber}
              >
                Clear
              </Button>
              <Button
                className="bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-lg shadow-sm"
                onClick={handleCustomCall}
                disabled={!dialNumber || customCallLoading || customPolling}
              >
                {customCallLoading ? 'Calling...' : 'Call'}
              </Button>
            </div>
            {/* Live Call Status */}
            {(customCallStatus || customCallLoading) && (
              <div className="mt-2 w-full flex flex-col items-center">
                <span className="text-xs text-muted-foreground mb-1">Live Call Status</span>
                <span className={cn(
                  'font-mono text-xl font-bold px-4 py-2 rounded-lg',
                  'transition-colors duration-300',
                  customCallStatus === 'Up'
                    ? 'text-green-600 dark:text-green-400'
                    : customCallStatus === 'Ringing'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : isTerminalStatus(customCallStatus)
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                )}>
                  {customCallStatus || 'initiating'}
                </span>
              </div>
            )}
            {customError && (
              <div className="mt-2 text-destructive bg-destructive/10 px-4 py-2 rounded-lg border border-destructive text-center w-full">
                {customError}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="mt-4 text-destructive bg-destructive/10 px-4 py-2 rounded-lg border border-destructive">
          {error}
        </div>
      )}
    </div>
  );
}