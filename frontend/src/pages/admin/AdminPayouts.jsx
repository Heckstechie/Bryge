import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

// Tab config
const TABS = [
  { key: 'pending',    label: 'Pending',    status: 'pending' },
  { key: 'processing', label: 'Processing', status: 'processing' },
  { key: 'completed',  label: 'Completed',  status: 'completed' },
];

function activeTabFromPath(pathname) {
  if (pathname.endsWith('/completed'))   return TABS[2];
  if (pathname.endsWith('/withdrawals')) return null;
  return TABS[0];
}

// ── Release Confirm Modal ─────────────────────────────────────────────────────
function ReleaseModal({ payout, onConfirm, onCancel, loading }) {
  if (!payout) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 className="text-lg font-bold text-[#0F1A2B] text-center mb-3">Release Payment?</h2>
        <p className="text-sm text-gray-500 text-center mb-1 leading-relaxed">
          You are about to release {naira(payout.amount)} to
        </p>
        <p className="text-base font-bold text-[#0F1A2B] text-center mb-3">{payout.vendor_name}</p>
        <p className="text-xs text-gray-400 text-center mb-7">
          Bank details: {payout.bank_name} · {payout.bank_account_number}
        </p>
        <div className="flex gap-3 mb-3">
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-[#3D6B4F] text-white font-semibold py-3 rounded-xl text-sm
                       hover:bg-green-700 disabled:opacity-50 transition-all">
            {loading ? '…' : 'Confirm Release'}
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 bg-[#8B3A2A] text-white font-semibold py-3 rounded-xl text-sm
                       hover:opacity-90 disabled:opacity-50 transition-all">
            Cancel
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center">This action cannot be undone</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPayouts() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = activeTabFromPath(location.pathname) || TABS[0];

  const [stats, setStats]         = useState(null);
  const [payouts, setPayouts]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState(activeTab.key);
  const [page, setPage]           = useState(1);

  const [releaseModal, setReleaseModal] = useState(null);
  const [releasing, setReleasing]       = useState(false);
  const [error, setError]               = useState('');

  const fetchPayouts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: tab, page, limit: 20 });
    api.get(`/admin/payouts?${params}`)
      .then(({ data }) => {
        setStats(data.stats);
        setPayouts(data.payouts);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  async function handleRelease() {
    if (!releaseModal) return;
    setReleasing(true);
    setError('');
    try {
      await api.post(`/admin/payouts/${releaseModal.id}/release`);
      setReleaseModal(null);
      fetchPayouts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release payout.');
      setReleaseModal(null);
    } finally { setReleasing(false); }
  }

  return (
    <AdminShell title="Payout Queue">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#0F1A2B] rounded-2xl px-6 py-5">
          <p className="text-xs text-white/50 mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-white">{naira(stats?.total_pending_amount)}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{stats?.total_pending_count ?? 0} requests</p>
        </div>
        <div className="bg-[#8B3A2A] rounded-2xl px-6 py-5">
          <p className="text-xs text-white/50 mb-1">Released Today</p>
          <p className="text-2xl font-bold text-white">{naira(stats?.released_today_amount)}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{stats?.released_today_count ?? 0} payouts</p>
        </div>
        <div className="bg-[#5C4A1E] rounded-2xl px-6 py-5">
          <p className="text-xs text-white/50 mb-1">Total Released</p>
          <p className="text-2xl font-bold text-white">{naira(stats?.total_released_amount)}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{stats?.total_released_count ?? 0} completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-5 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${tab === t.key ? 'bg-[#0F1A2B] text-white' : 'text-gray-500 hover:text-[#0F1A2B]'}`}>
            {t.label}
            {t.key === 'pending' && stats?.total_pending_count > 0 && (
              <span className="ml-1.5 bg-[#8B3A2A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.total_pending_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3.5">Vendor</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Sale Amount</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Payout</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Date Requested</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Status</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5 pr-6">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16">
                <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : payouts.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-400 text-sm py-16">
                No {tab} payouts
              </td></tr>
            ) : payouts.map((p) => (
              <tr key={p.id}
                onClick={() => navigate(`/admin/payouts/${p.id}`)}
                className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-200 rounded-full flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#0F1A2B]">{p.vendor_name}</p>
                      <p className="text-[10px] text-gray-400">{p.bank_name} · {p.bank_account_number}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-right text-xs text-gray-500">
                  {naira(p.amount)}
                </td>
                <td className="px-3 py-3.5 text-right text-xs font-bold text-[#0F1A2B]">
                  {naira(p.amount)}
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-400">{fmtDate(p.created_at)}</td>
                <td className="px-3 py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize
                    ${p.status === 'pending'    ? 'bg-amber-100 text-amber-700'
                    : p.status === 'processing' ? 'bg-blue-100 text-blue-700'
                    : p.status === 'completed'  ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'processing' ? 'In Progress' : p.status}
                  </span>
                </td>
                <td className="px-3 py-3.5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigate(`/admin/payouts/${p.id}`)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#0F1A2B]">
                      View
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                      </svg>
                    </button>
                    {p.status === 'pending' && (
                      <button
                        onClick={() => { setError(''); setReleaseModal(p); }}
                        className="px-3 py-1.5 bg-[#3D6B4F] text-white text-xs font-semibold rounded-lg
                                   hover:bg-green-700 transition-colors">
                        Release
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="text-xs text-gray-500 hover:text-[#0F1A2B] disabled:opacity-40">
            &lt; Back
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.pages, 4) }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-7 h-7 rounded-full text-xs font-semibold transition-colors
                  ${page === n ? 'bg-[#0F1A2B] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {n}
              </button>
            ))}
          </div>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
            className="text-xs text-gray-500 hover:text-[#0F1A2B] disabled:opacity-40">
            Next &gt;
          </button>
        </div>
      )}

      <ReleaseModal
        payout={releaseModal}
        loading={releasing}
        onConfirm={handleRelease}
        onCancel={() => setReleaseModal(null)}
      />
    </AdminShell>
  );
}
