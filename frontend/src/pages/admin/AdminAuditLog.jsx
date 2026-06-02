import { useState, useEffect } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function timeAgo(d) {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return fmtDateTime(d);
}

const ACTION_ICONS = {
  'Dispute resolved': (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-[#8B3A2A]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
    </svg>
  ),
  'Payout released': (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-[#3D6B4F]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25"/>
    </svg>
  ),
  'Payout completed': (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-[#5C4A1E]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
    </svg>
  ),
};

const ACTION_COLORS = {
  'Dispute resolved': 'bg-[#8B3A2A]/8 text-[#8B3A2A]',
  'Payout released':  'bg-[#3D6B4F]/8 text-[#3D6B4F]',
  'Payout completed': 'bg-[#5C4A1E]/8 text-[#5C4A1E]',
};

const ACTION_TYPES = [
  { value: '',          label: 'All Actions' },
  { value: 'dispute',   label: 'Dispute Actions' },
  { value: 'payout',    label: 'Payout Actions' },
];

export default function AdminAuditLog() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [actionType, setActionType] = useState('');
  const [adminFilter, setAdminFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (actionType) params.set('action_type', actionType);
    if (adminFilter) params.set('admin_id', adminFilter);
    api.get(`/admin/audit-log?${params}`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, actionType, adminFilter]);

  const totalPages = data ? Math.ceil((data.total || 0) / 20) : 1;

  return (
    <AdminShell title="Audit Log">

      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <select
            value={actionType}
            onChange={(e) => { setActionType(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#0F1A2B] text-gray-600">
            {ACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
            {data?.total || 0} entries
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-600 hover:bg-gray-50">
          Export CSV ↓
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-[#0F1A2B]/4 border border-[#0F1A2B]/8 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
          className="text-[#0F1A2B]/50 flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
        </svg>
        <p className="text-xs text-[#0F1A2B]/60">
          Audit log tracks dispute resolutions and payout actions. For full activity tracking, a dedicated audit table can be added to capture all admin actions in real time.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-sm font-bold text-[#0F1A2B]">Admin Activity</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Log ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Action</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Admin</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Details</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {(data?.logs || []).map((log, i) => (
                <tr key={`${log.ref_type}-${log.ref_id}-${i}`} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold text-[#D45B3E]">{log.log_number}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0
                        ${ACTION_COLORS[log.action]?.split(' ')[0] || 'bg-gray-100'}`}>
                        {ACTION_ICONS[log.action] || (
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"/>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${ACTION_COLORS[log.action]?.split(' ')[1] || 'text-[#0F1A2B]'}`}>
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-medium text-[#0F1A2B]">
                      {log.admin_name?.trim() || '—'}
                    </p>
                    <p className="text-[10px] text-gray-400">{log.admin_email}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 max-w-[220px]">
                    <span className="truncate block">{log.details}</span>
                  </td>
                  <td className="px-3 py-3 pr-6 text-right">
                    <p className="text-xs text-gray-600">{timeAgo(log.occurred_at)}</p>
                    <p className="text-[10px] text-gray-400">{fmtDateTime(log.occurred_at)}</p>
                  </td>
                </tr>
              ))}
              {(!data?.logs || data.logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <p className="text-sm font-medium text-gray-400 mb-1">No activity logged yet</p>
                    <p className="text-xs text-gray-300">Actions like resolving disputes and releasing payouts will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} · {data?.total || 0} entries</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
