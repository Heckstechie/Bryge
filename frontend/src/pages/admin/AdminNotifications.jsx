import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function timeAgo(d) {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const TYPE_META = {
  vendor_application: {
    label: 'Vendor',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72"/>
      </svg>
    ),
    bg: 'bg-[#5C4A1E]/10', text: 'text-[#5C4A1E]',
    dot: 'bg-[#5C4A1E]',
  },
  dispute: {
    label: 'Dispute',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
      </svg>
    ),
    bg: 'bg-[#8B3A2A]/10', text: 'text-[#8B3A2A]',
    dot: 'bg-[#8B3A2A]',
  },
  payout: {
    label: 'Payout',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75"/>
      </svg>
    ),
    bg: 'bg-[#3D6B4F]/10', text: 'text-[#3D6B4F]',
    dot: 'bg-[#3D6B4F]',
  },
  order: {
    label: 'Order',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"/>
      </svg>
    ),
    bg: 'bg-[#0F1A2B]/8', text: 'text-[#0F1A2B]',
    dot: 'bg-[#0F1A2B]',
  },
};

const TABS = [
  { key: 'all',                label: 'All' },
  { key: 'dispute',            label: 'Disputes' },
  { key: 'vendor_application', label: 'Vendors' },
  { key: 'payout',             label: 'Payouts' },
  { key: 'order',              label: 'Orders' },
];

export default function AdminNotifications() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  // Track locally-dismissed notifications (stored in state — resets on refresh)
  const [dismissed, setDismissed] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get('/admin/notifications')
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function dismiss(id) { setDismissed((prev) => new Set([...prev, id])); }
  function dismissAll() { setDismissed(new Set(data?.notifications?.map((n) => n.id) || [])); }

  const visible = (data?.notifications || [])
    .filter((n) => !dismissed.has(n.id))
    .filter((n) => tab === 'all' || n.type === tab);

  const counts = data?.counts || {};

  return (
    <AdminShell title="Notifications">

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {TABS.map((t) => {
            const count = t.key === 'all'
              ? (data?.notifications?.filter((n) => !dismissed.has(n.id)).length || 0)
              : (data?.notifications?.filter((n) => n.type === t.key && !dismissed.has(n.id)).length || 0);
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors
                  ${tab === t.key ? 'bg-[#0F1A2B] text-white' : 'text-gray-500 hover:text-[#0F1A2B] hover:bg-gray-50'}`}>
                {t.label}
                {count > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    ${tab === t.key ? 'bg-white/20 text-white' : 'bg-[#D45B3E]/10 text-[#D45B3E]'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={dismissAll}
          className="text-xs text-gray-400 hover:text-[#0F1A2B] font-medium transition-colors">
          Mark all as read
        </button>
      </div>

      {/* Stat chips */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Open Disputes',       value: counts.disputes     || 0, bg: 'bg-[#8B3A2A]' },
            { label: 'Vendor Applications', value: counts.applications || 0, bg: 'bg-[#5C4A1E]' },
            { label: 'Pending Payouts',     value: counts.payouts      || 0, bg: 'bg-[#3D6B4F]' },
            { label: 'New Orders (24h)',    value: counts.orders       || 0, bg: 'bg-[#0F1A2B]' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-5 py-4`}>
              <p className="text-[11px] text-white/50 mb-0.5">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notification list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-[#0F1A2B]/5 rounded-2xl flex items-center justify-center mb-4">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-[#0F1A2B]/25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#0F1A2B]/50">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No pending notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visible.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.order;
              return (
                <div key={n.id}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg} ${meta.text}`}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-300">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs font-semibold text-[#0F1A2B]">{n.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{n.body}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(n.link)}
                      className="px-3 py-1.5 bg-[#0F1A2B] text-white text-[10px] font-semibold rounded-lg hover:bg-[#0F1A2B]/90">
                      View
                    </button>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="px-3 py-1.5 border border-gray-200 text-gray-500 text-[10px] font-semibold rounded-lg hover:bg-gray-50">
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
