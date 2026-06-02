import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TABS = [
  { key: 'sales',      label: 'Sales',       type: 'sales' },
  { key: 'payouts',    label: 'Payouts',      type: 'payouts' },
  { key: 'refunds',    label: 'Refunds',      type: 'refunds' },
  { key: 'commission', label: 'Commission',   type: 'commission' },
];

function StatusBadge({ status }) {
  const map = {
    completed:  'bg-green-50 text-green-700',
    pending:    'bg-yellow-50 text-yellow-700',
    processing: 'bg-blue-50 text-blue-700',
    failed:     'bg-red-50 text-red-600',
    reversed:   'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize
      ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status || '—'}
    </span>
  );
}

function TypeBadge({ type }) {
  const labels = {
    escrow_credit:    { label: 'Escrow Credit',    color: 'bg-blue-50 text-blue-700' },
    escrow_release:   { label: 'Escrow Release',   color: 'bg-green-50 text-green-700' },
    escrow_refund:    { label: 'Escrow Refund',     color: 'bg-orange-50 text-orange-700' },
    payout:           { label: 'Payout',            color: 'bg-[#3D6B4F]/10 text-[#3D6B4F]' },
    commission_debit: { label: 'Commission',         color: 'bg-[#8B3A2A]/10 text-[#8B3A2A]' },
    adjustment:       { label: 'Adjustment',         color: 'bg-gray-100 text-gray-600' },
  };
  const t = labels[type] || { label: type || '—', color: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.color}`}>
      {t.label}
    </span>
  );
}

export default function AdminTransactionHistory() {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab from query param or default to 'sales'
  const params  = new URLSearchParams(location.search);
  const tabKey  = params.get('tab') || 'sales';
  const activeTab = TABS.find((t) => t.key === tabKey) || TABS[0];

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [q, setQ]             = useState('');

  useEffect(() => {
    setPage(1);
    setQ('');
    setSearch('');
  }, [tabKey]);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/reports/transactions?type=${activeTab.type}&page=${page}&search=${encodeURIComponent(q)}`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab.type, page, q]);

  function doSearch(e) {
    e.preventDefault();
    setPage(1);
    setQ(search);
  }

  function switchTab(key) {
    navigate(`/admin/reports/transactions?tab=${key}`, { replace: true });
  }

  const totalPages = data ? Math.ceil((data.total || 0) / 20) : 1;

  return (
    <AdminShell title="Transaction History">

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors
              ${activeTab.key === t.key ? 'bg-[#0F1A2B] text-white' : 'text-gray-500 hover:text-[#0F1A2B] hover:bg-gray-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Transactions', value: (data.summary?.count || 0).toLocaleString(),  bg: 'bg-[#0F1A2B]' },
            { label: 'Total Amount',       value: naira(data.summary?.total_amount),             bg: 'bg-[#3D6B4F]' },
            { label: 'This Month',         value: naira(data.summary?.this_month_amount),        bg: 'bg-[#5C4A1E]' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-5 py-4`}>
              <p className="text-[11px] text-white/50 mb-1">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F1A2B]">{activeTab.label} Transactions</h3>
          <div className="flex items-center gap-2">
            <form onSubmit={doSearch} className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions…"
                  className="pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#0F1A2B] w-48"
                />
              </div>
              <button type="submit"
                className="px-3 py-2 bg-[#0F1A2B] text-white text-xs rounded-lg hover:bg-[#0F1A2B]/90">
                Search
              </button>
            </form>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-600 hover:bg-gray-50">
              Export CSV ↓
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">TXN ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Order</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Vendor</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Amount</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.transactions || []).map((tx) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold text-[#D45B3E]">{tx.txn_number || '—'}</span>
                  </td>
                  <td className="px-3 py-3">
                    <TypeBadge type={tx.tx_type} />
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{tx.order_number || '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{tx.vendor_name || '—'}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-xs font-medium ${Number(tx.amount) < 0 ? 'text-red-600' : 'text-[#0F1A2B]'}`}>
                      {Number(tx.amount) < 0 ? `−${naira(Math.abs(tx.amount))}` : naira(tx.amount)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <StatusBadge status={tx.status || 'completed'} />
                    </div>
                  </td>
                  <td className="px-3 py-3 pr-6 text-right text-xs text-gray-400">{fmtDate(tx.created_at)}</td>
                </tr>
              ))}
              {(!data?.transactions || data.transactions.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 text-sm py-12">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages} · {data?.total || 0} transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
