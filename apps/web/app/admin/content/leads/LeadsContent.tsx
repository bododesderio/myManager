'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED_WON' | 'CLOSED_LOST';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: LeadStatus;
  message: string;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  NEW: { label: 'New', bg: 'bg-blue-100', text: 'text-blue-800' },
  CONTACTED: { label: 'Contacted', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  QUALIFIED: { label: 'Qualified', bg: 'bg-purple-100', text: 'text-purple-800' },
  CLOSED_WON: { label: 'Closed Won', bg: 'bg-green-100', text: 'text-green-800' },
  CLOSED_LOST: { label: 'Closed Lost', bg: 'bg-red-100', text: 'text-red-800' },
};

const ALL_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED_WON', 'CLOSED_LOST'];

export function LeadsContent() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/v1/admin/leads${query}`);
      if (!res.ok) throw new Error('Failed to load leads');
      const data = (await res.json()) as { items?: Lead[] };
      setLeads(data.items ?? []);
    } catch {
      toast({ title: 'Could not load leads', variant: 'error' });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? leads : leads.filter((lead) => lead.status === statusFilter)),
    [leads, statusFilter],
  );

  async function updateLead(id: string, updates: Partial<Lead>) {
    try {
      const res = await fetch(`/api/v1/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update lead');
      const updated = (await res.json()) as Lead;
      setLeads((prev) => prev.map((lead) => (lead.id === id ? updated : lead)));
      toast({ title: 'Lead updated', variant: 'success' });
    } catch {
      toast({ title: 'Failed to update lead', variant: 'error' });
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const inputCls =
    'mt-1 block w-full rounded-brand border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-brand bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Contact Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          {leads.length} lead{leads.length !== 1 ? 's' : ''} in the current view
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            statusFilter === 'ALL'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {ALL_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === status
                  ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-brand border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-3">Contact</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((lead) => {
              const cfg = STATUS_CONFIG[lead.status];
              const isExpanded = expandedId === lead.id;
              return (
                <tr key={lead.id} className="group">
                  <td colSpan={5} className="p-0">
                    <div
                      className="flex cursor-pointer items-center hover:bg-gray-50"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    >
                      <div className="flex-1 px-6 py-3">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-gray-400">{lead.email}</p>
                      </div>
                      <div className="w-32 px-4 py-3 text-gray-600">{lead.company || 'Unknown'}</div>
                      <div className="w-32 px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="w-28 px-4 py-3 text-xs text-gray-500">
                        {lead.assigned_to || 'Unassigned'}
                      </div>
                      <div className="w-28 px-4 py-3 text-xs text-gray-500">
                        {formatDate(lead.created_at)}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-gray-400">Message</h4>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                              {lead.message || 'No message.'}
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-semibold uppercase text-gray-400">Notes</label>
                              <textarea
                                rows={3}
                                value={lead.notes ?? ''}
                                onChange={(e) =>
                                  setLeads((prev) =>
                                    prev.map((item) =>
                                      item.id === lead.id ? { ...item, notes: e.target.value } : item,
                                    ),
                                  )
                                }
                                onBlur={(e) => void updateLead(lead.id, { notes: e.target.value })}
                                className={inputCls}
                                placeholder="Internal notes..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-semibold uppercase text-gray-400">Status</label>
                                <select
                                  value={lead.status}
                                  onChange={(e) =>
                                    void updateLead(lead.id, {
                                      status: e.target.value as LeadStatus,
                                    })
                                  }
                                  className={inputCls}
                                >
                                  {ALL_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                      {STATUS_CONFIG[status].label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold uppercase text-gray-400">
                                  Assigned To
                                </label>
                                <input
                                  type="text"
                                  value={lead.assigned_to ?? ''}
                                  onChange={(e) =>
                                    setLeads((prev) =>
                                      prev.map((item) =>
                                        item.id === lead.id
                                          ? { ...item, assigned_to: e.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                  onBlur={(e) =>
                                    void updateLead(lead.id, {
                                      assigned_to: e.target.value || null,
                                    })
                                  }
                                  className={inputCls}
                                  placeholder="Owner name or role"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No leads matching this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
