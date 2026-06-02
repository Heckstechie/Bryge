import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const map = {
    active:      'bg-green-50 text-green-700',
    suspended:   'bg-red-50 text-red-600',
    deactivated: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize
      ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

function Avatar({ name, size = 'sm' }) {
  const initials = name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-[#0F1A2B]/10 text-[#0F1A2B] font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function AdminCustomers() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [q, setQ]             = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    api.get(`/admin/customers?page=${page}&search=${encodeURIComponent(q)}${status ? `&status=${status}` : ''}`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, q, status]);

  function doSearch(e) {
    e.preventDefault();
    setPage(1);
    setQ(search);
  }

  const totalPages = data ? Math.ceil((data.total || 0) / 20) : 1;

  return (
    <AdminShell title="Customer Management">

      {/* Stat cards */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Customers',    value: Number(data.summary?.total_customers || 0).toLocaleString(),    bg: 'bg-[#0F1A2B]' },
            { label: 'Active Customers',   value: Number(data.summary?.active_customers || 0).toLocaleString(),   bg: 'bg-[#3D6B4F]' },
            { label: 'Suspended',          value: Number(data.summary?.suspended_customers || 0).toLocaleString(), bg: 'bg-[#8B3A2A]' },
            { label: 'Total Revenue',      value: naira(data.summary?.total_revenue),                             bg: 'bg-[#5C4A1E]' },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl px-6 py-5`}>
              <p className="text-[11px] text-white/50 mb-1">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between gap-4">
          <form onSubmit={doSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
              </svg>
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#0F1A2B]"
              />
            </div>
            <button type="submit"
              className="px-4 py-2 bg-[#0F1A2B] text-white text-xs rounded-lg hover:bg-[#0F1A2B]/90">
              Search
            </button>
          </form>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#0F1A2B] text-gray-600">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-600 hover:bg-gray-50">
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
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Phone</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Orders</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Total Spent</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3">Joined</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3">Status</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.customers || []).map((c) => {
                const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;
                return (
                  <tr key={c.id}
                    onClick={() => navigate(`/admin/customers/${c.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={name} />
                        <div>
                          <p className="text-xs font-semibold text-[#0F1A2B]">{name}</p>
                          <p className="text-[10px] text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{c.phone || '—'}</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-600">{c.order_count || 0}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium text-[#0F1A2B]">{naira(c.total_spent)}</td>
                    <td className="px-3 py-3 text-center text-xs text-gray-400">{fmtDate(c.created_at)}</td>
                    <td className="px-3 py-3 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-3 pr-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/admin/customers/${c.id}`)}
                        className="px-3 py-1.5 bg-[#0F1A2B] text-white text-xs font-semibold rounded-lg hover:bg-[#0F1A2B]/90">
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(!data?.customers || data.customers.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 text-sm py-12">No customers found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages} · {data?.total || 0} customers
            </p>
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
