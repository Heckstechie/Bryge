import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminRefunds() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [q, setQ]             = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/refunds?page=${page}&search=${encodeURIComponent(q)}`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, q]);

  function doSearch(e) { e.preventDefault(); setPage(1); setQ(search); }

  const totalPages = data ? Math.ceil((data.total || 0) / 20) : 1;

  return (
    <AdminShell title="Refund Management">

      {/* Stat cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Refunds',    value: Number(data.summary?.total_refunds || 0).toLocaleString(), bg: 'bg-[#0F1A2B]' },
            { label: 'Total Refunded',   value: naira(data.summary?.total_amount),                        bg: 'bg-[#8B3A2A]' },
            { label: 'This Month',       value: naira(data.summary?.this_month),                          bg: 'bg-[#5C4A1E]' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-6 py-5`}>
              <p className="text-[11px] text-white/50 mb-1">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F1A2B]">All Refunds</h3>
          <div className="flex items-center gap-2">
            <form onSubmit={doSearch} className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
                </svg>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search refunds…"
                  className="pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#0F1A2B] w-48"/>
              </div>
              <button type="submit"
                className="px-3 py-2 bg-[#0F1A2B] text-white text-xs rounded-lg">Search</button>
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
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Refund ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Order</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Reason</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Amount</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.refunds || []).map((r) => (
                <tr key={r.id}
                  onClick={() => r.dispute_id && navigate(`/admin/disputes/${r.dispute_id}`)}
                  className={`border-b border-gray-50 ${r.dispute_id ? 'hover:bg-gray-50/60 cursor-pointer' : ''}`}>
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold text-[#D45B3E]">{r.refund_number}</span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs font-medium text-[#0F1A2B]">{r.customer_name}</p>
                    <p className="text-[10px] text-gray-400">{r.customer_email}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{r.vendor_name || '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{r.order_number || '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-500 max-w-[160px]">
                    <span className="truncate block">{r.dispute_reason || r.description || '—'}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-xs font-medium text-[#8B3A2A]">{naira(r.amount)}</span>
                  </td>
                  <td className="px-3 py-3 pr-6 text-right text-xs text-gray-400">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
              {(!data?.refunds || data.refunds.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 text-sm py-12">No refunds found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} · {data?.total || 0} refunds</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/>
        </svg>
        <span>Refunds are processed through dispute resolution. Click any refund row to view the associated dispute.</span>
      </div>
    </AdminShell>
  );
}
