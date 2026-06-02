import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

const REASON_LABELS = {
  not_received:     'Item not received',
  wrong_item:       'Wrong item sent',
  damaged:          'Item damaged',
  not_as_described: 'Not as described',
  other:            'Other',
};

// Tab config — keyed by URL suffix
const TABS = [
  { key: 'open',         label: 'Open',         path: '/admin/disputes',              status: 'open' },
  { key: 'under_review', label: 'Under Review',  path: '/admin/disputes/under-review', status: 'under_review' },
  { key: 'resolved',     label: 'Resolved',      path: '/admin/disputes/resolved',     status: 'resolved' },
];

function activeTabFromPath(pathname) {
  if (pathname.endsWith('/under-review')) return TABS[1];
  if (pathname.endsWith('/resolved'))    return TABS[2];
  return TABS[0];
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  const bg = { navy: 'bg-[#0F1A2B]', terra: 'bg-[#8B3A2A]', olive: 'bg-[#5C4A1E]' };
  return (
    <div className={`${bg[accent]} rounded-2xl px-8 py-6 text-center`}>
      <p className="text-xs text-white/60 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
    </div>
  );
}

export default function AdminDisputes() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const activeTab = activeTabFromPath(location.pathname);

  const [disputes, setDisputes]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [startingId, setStartingId] = useState(null);  // ID being "Start Review"d

  const fetchDisputes = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ status: activeTab.status, page, limit: 20 });
    if (search) params.append('search', search);

    api.get(`/admin/disputes?${params}`)
      .then(({ data }) => {
        setDisputes(data.disputes);
        setStats(data.stats);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab.status, page, search]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  // Reset page when tab changes
  useEffect(() => { setPage(1); }, [location.pathname]);

  async function handleStartReview(d, e) {
    e.stopPropagation();
    setStartingId(d.id);
    try {
      await api.patch(`/admin/disputes/${d.id}/review`);
      setDisputes((prev) => prev.filter((x) => x.id !== d.id));
      // Update open_count stat
      setStats((prev) => prev ? { ...prev, open_count: Math.max(0, prev.open_count - 1), under_review_count: Number(prev.under_review_count) + 1 } : prev);
    } catch {}
    setStartingId(null);
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  const STATUS_BADGE = {
    open:             'bg-[#8B3A2A]/10 text-[#8B3A2A]',
    under_review:     'bg-amber-100 text-amber-700',
    resolved_customer:'bg-green-100 text-green-700',
    resolved_vendor:  'bg-green-100 text-green-700',
    closed:           'bg-gray-100 text-gray-500',
  };

  function badgeLabel(status) {
    if (status === 'open')              return 'Open';
    if (status === 'under_review')      return 'Under Review';
    if (status === 'resolved_customer' || status === 'resolved_vendor') return 'Resolved';
    return status;
  }

  return (
    <AdminShell title="Disputes Center">

      {/* Search + Date Filter in top area */}
      <div className="flex items-center justify-between mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by dispute ID, order ID, customer or vendor…"
              className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-white
                         focus:outline-none focus:border-[#0F1A2B]/30 w-80" />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="13" height="13"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
          </div>
          {search && (
            <button type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="text-xs text-gray-400 hover:text-gray-700 px-2">✕</button>
          )}
        </form>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Date Filter</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg
                             bg-white text-xs text-gray-600 hover:bg-gray-50">
            This Month
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Open Disputes"      value={stats?.open_count}           accent="navy" />
        <StatCard label="Under Review"       value={stats?.under_review_count}   accent="terra" />
        <StatCard label="Resolved This Month" value={stats?.resolved_this_month} accent="olive" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-5 w-fit">
        {TABS.map((tab) => (
          <button key={tab.key}
            onClick={() => { setSearch(''); setSearchInput(''); navigate(tab.path); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${activeTab.key === tab.key ? 'bg-[#0F1A2B] text-white' : 'text-gray-500 hover:text-[#0F1A2B]'}`}>
            {tab.label}
            {tab.key === 'open' && stats?.open_count > 0 && (
              <span className="ml-1.5 bg-[#8B3A2A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {stats.open_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3.5">Dispute ID</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Order</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Customer</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Vendor</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Reason</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Amount</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Opened</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5 pr-6">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-16">
                <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : disputes.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-gray-400 text-sm py-16">
                No {activeTab.label.toLowerCase()} disputes
              </td></tr>
            ) : disputes.map((d) => (
              <tr key={d.id}
                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-200 rounded-full flex-shrink-0" />
                    <span className="text-xs font-semibold text-[#D45B3E]">{d.dispute_number}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-600">{d.order_number}</td>
                <td className="px-3 py-3.5 text-xs text-[#0F1A2B]">
                  {[d.first_name, d.last_name].filter(Boolean).join(' ') || d.customer_email}
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-600">{d.vendor_name}</td>
                <td className="px-3 py-3.5 text-xs text-gray-500">
                  {REASON_LABELS[d.reason] || d.reason}
                </td>
                <td className="px-3 py-3.5 text-right text-xs font-medium text-[#0F1A2B]">
                  {naira(d.total_ngn)}
                </td>
                <td className="px-3 py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium
                    ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500'}`}>
                    {badgeLabel(d.status)}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-400">{fmtDate(d.created_at)}</td>
                <td className="px-3 py-3.5 pr-6 text-right">
                  {activeTab.key === 'open' && (
                    <button
                      onClick={(e) => handleStartReview(d, e)}
                      disabled={startingId === d.id}
                      className="px-3 py-1.5 bg-[#3D6B4F] text-white text-xs font-semibold rounded-lg
                                 hover:bg-green-700 disabled:opacity-50 transition-colors">
                      {startingId === d.id ? '…' : 'Start Review'}
                    </button>
                  )}
                  {activeTab.key === 'under_review' && (
                    <button
                      onClick={() => navigate(`/admin/disputes/${d.id}`)}
                      className="px-3 py-1.5 bg-[#3D6B4F] text-white text-xs font-semibold rounded-lg
                                 hover:bg-green-700 transition-colors">
                      Resolve
                    </button>
                  )}
                  {activeTab.key === 'resolved' && (
                    <button
                      onClick={() => navigate(`/admin/disputes/${d.id}`)}
                      className="px-3 py-1.5 bg-[#3D6B4F] text-white text-xs font-semibold rounded-lg
                                 hover:bg-green-700 transition-colors">
                      View
                    </button>
                  )}
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
    </AdminShell>
  );
}
