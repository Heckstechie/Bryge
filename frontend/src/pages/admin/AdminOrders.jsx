import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) {
  return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped',   label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'disputed',  label: 'Disputed' },
  { key: 'refunded',  label: 'Refunded' },
];

const STATUS_COLORS = {
  pending:          'bg-amber-100 text-amber-700',
  confirmed:        'bg-blue-100 text-blue-700',
  processing:       'bg-blue-100 text-blue-700',
  shipped:          'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-gray-100 text-gray-500',
  disputed:         'bg-red-100 text-red-700',
  refunded:         'bg-orange-100 text-orange-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
      ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-500'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState('all');
  const [search, setSearch]   = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]       = useState(1);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    api.get(`/admin/orders?${params}`)
      .then(({ data }) => {
        setOrders(data.orders);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function handleStatusChange(s) {
    setStatus(s);
    setPage(1);
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <AdminShell title="Orders">

      {/* ── Filter tabs + Search ── */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusChange(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${status === tab.key
                  ? 'bg-[#0F1A2B] text-white'
                  : 'text-gray-500 hover:text-[#0F1A2B]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order # or customer…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none
                         focus:border-[#0F1A2B]/40 w-64"
            />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
          </div>
          <button type="submit"
            className="px-4 py-2 bg-[#0F1A2B] text-white text-xs font-semibold rounded-xl hover:opacity-90">
            Search
          </button>
          {search && (
            <button type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 text-xs text-gray-400 hover:text-gray-700 border border-gray-200
                         rounded-xl bg-white">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3.5">Order #</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Customer</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Date</th>
              <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3.5">Items</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Total</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Payment</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5 pr-6"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent
                                  rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 text-sm py-16">
                  No orders found
                </td>
              </tr>
            ) : orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0F1A2B]">{order.order_number}</span>
                    {order.has_open_dispute && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="Open dispute" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-4">
                  <p className="text-xs font-medium text-[#0F1A2B]">
                    {order.customer_first} {order.customer_last}
                  </p>
                  <p className="text-[10px] text-gray-400">{order.customer_email}</p>
                </td>
                <td className="px-3 py-4 text-xs text-gray-500">{fmtDate(order.created_at)}</td>
                <td className="px-3 py-4 text-center text-xs text-gray-600">
                  {order.item_count} item{order.item_count !== '1' ? 's' : ''}
                </td>
                <td className="px-3 py-4 text-right">
                  <span className="text-xs font-bold text-[#0F1A2B]">{naira(order.total_ngn)}</span>
                </td>
                <td className="px-3 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-3 py-4">
                  <span className="text-xs text-gray-500 capitalize">{order.gateway}</span>
                </td>
                <td className="px-3 py-4 pr-6 text-right">
                  <svg className="text-gray-300 ml-auto" width="16" height="16" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Showing {orders.length} of {pagination.total} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white
                         disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white
                         disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}

    </AdminShell>
  );
}
