import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }

function StarRating({ rating }) {
  const r = Number(rating) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="11" height="11" viewBox="0 0 24 24"
          fill={s <= Math.round(r) ? '#F59E0B' : 'none'}
          stroke={s <= Math.round(r) ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/>
        </svg>
      ))}
      <span className="text-[10px] text-gray-400 ml-1">{r > 0 ? r.toFixed(1) : '—'}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:    'bg-green-50 text-green-700',
    suspended: 'bg-red-50 text-red-600',
    pending:   'bg-yellow-50 text-yellow-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

export default function AdminVendorPerformance() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [q, setQ]             = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/reports/vendors?page=${page}&search=${encodeURIComponent(q)}`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, q]);

  function doSearch(e) {
    e.preventDefault();
    setPage(1);
    setQ(search);
  }

  const totalPages = data ? Math.ceil((data.total || 0) / 20) : 1;

  return (
    <AdminShell title="Vendor Performance">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mt-0.5">
            {data ? `${data.total || 0} vendors` : ''}
          </p>
        </div>
        <form onSubmit={doSearch} className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors…"
              className="pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#0F1A2B] w-52"
            />
          </div>
          <button type="submit"
            className="px-4 py-2 bg-[#0F1A2B] text-white text-xs rounded-lg hover:bg-[#0F1A2B]/90">
            Search
          </button>
          <button type="button"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-600 hover:bg-gray-50">
            Export CSV ↓
          </button>
        </form>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Vendors',     value: data.summary?.total_vendors     || 0,         bg: 'bg-[#0F1A2B]' },
            { label: 'Active Vendors',    value: data.summary?.active_vendors    || 0,         bg: 'bg-[#3D6B4F]' },
            { label: 'Total Revenue',     value: naira(data.summary?.total_revenue),            bg: 'bg-[#8B3A2A]' },
            { label: 'Total Commission',  value: naira(data.summary?.total_commission),         bg: 'bg-[#5C4A1E]' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-5 py-4`}>
              <p className="text-[11px] text-white/50 mb-1">{label}</p>
              <p className="text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F1A2B]">Vendor Performance</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Category</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Products</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Orders</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Revenue</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Commission</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3">Rating</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.vendors || []).map((v) => (
                <tr key={v.id}
                  onClick={() => navigate(`/admin/vendors/${v.id}`)}
                  className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer">
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-xs font-semibold text-[#0F1A2B]">{v.business_name}</p>
                      <p className="text-[10px] text-gray-400">{v.email}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{v.category || '—'}</td>
                  <td className="px-3 py-3 text-right text-xs text-gray-600">{v.product_count || 0}</td>
                  <td className="px-3 py-3 text-right text-xs text-gray-600">{v.order_count || 0}</td>
                  <td className="px-3 py-3 text-right text-xs font-medium text-[#0F1A2B]">{naira(v.revenue)}</td>
                  <td className="px-3 py-3 text-right text-xs text-gray-500">{naira(v.commission)}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <StarRating rating={v.avg_rating} />
                    </div>
                  </td>
                  <td className="px-3 py-3 pr-6">
                    <div className="flex justify-center">
                      <StatusBadge status={v.status} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.vendors || data.vendors.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 text-sm py-12">No vendors found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages} · {data?.total || 0} vendors
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
