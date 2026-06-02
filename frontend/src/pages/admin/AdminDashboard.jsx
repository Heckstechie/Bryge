import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) {
  return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

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

function StatCard({ label, value, sub, color = '#0F1A2B', icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '18' }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// Simple bar chart using divs
function RevenueChart({ data }) {
  if (!data?.length) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-gray-400">
        No revenue data yet
      </div>
    );
  }

  const max = Math.max(...data.map((d) => Number(d.revenue)));

  return (
    <div className="h-40 flex items-end gap-2">
      {data.map((d, i) => {
        const pct = max > 0 ? (Number(d.revenue) / max) * 100 : 0;
        const month = new Date(d.month).toLocaleDateString('en-GB', { month: 'short' });
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end" style={{ height: '120px' }}>
              <div
                className="w-full bg-[#0F1A2B] rounded-t-lg transition-all"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{month}</span>
          </div>
        );
      })}
    </div>
  );
}

// Donut-style orders breakdown (simple)
function OrdersBreakdown({ data }) {
  if (!data?.length) return null;
  const total = data.reduce((s, r) => s + Number(r.count), 0);

  const colors = {
    pending:   '#F59E0B',
    confirmed: '#3B82F6',
    shipped:   '#6366F1',
    delivered: '#10B981',
    disputed:  '#EF4444',
    cancelled: '#9CA3AF',
    refunded:  '#F97316',
  };

  return (
    <div className="space-y-2">
      {data.map((row) => {
        const pct = total > 0 ? (Number(row.count) / total) * 100 : 0;
        const color = colors[row.status] || '#9CA3AF';
        return (
          <div key={row.status} className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500 capitalize flex-1">{row.status.replace(/_/g, ' ')}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-xs font-medium text-gray-700 w-6 text-right">{row.count}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminShell title="Overview">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  const stats = data?.stats || {};

  return (
    <AdminShell title="Overview">

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={naira(stats.total_revenue || 0)}
          sub={`${naira(stats.revenue_30d || 0)} this month`}
          color="#0F1A2B"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value={stats.total_orders || 0}
          sub={`${stats.orders_30d || 0} this month`}
          color="#3B82F6"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
            </svg>
          }
        />
        <StatCard
          label="Active Vendors"
          value={stats.approved_vendors || 0}
          sub={`${stats.total_vendors || 0} total registered`}
          color="#10B981"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/>
            </svg>
          }
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pending_vendors || 0}
          sub="Vendor applications"
          color="#F59E0B"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          }
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-[1fr_300px] gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#0F1A2B]">Revenue (Last 6 Months)</h2>
          </div>
          <RevenueChart data={data?.revenue_chart} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-[#0F1A2B] mb-4">Orders by Status</h2>
          <OrdersBreakdown data={data?.orders_by_status} />
          {stats.disputed_orders > 0 && (
            <Link to="/admin/disputes"
              className="mt-4 flex items-center gap-1.5 text-xs text-red-600 font-medium hover:underline">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>
              </svg>
              {stats.disputed_orders} open dispute{stats.disputed_orders !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* ── Bottom Row: Recent Orders + Vendor Applications ── */}
      <div className="grid grid-cols-[1fr_360px] gap-4">

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0F1A2B]">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-[#D45B3E] hover:underline font-medium">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Order #</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Date</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_orders || []).map((order) => (
                  <tr key={order.id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                    <td className="px-6 py-3.5 font-medium text-[#0F1A2B] text-xs">{order.order_number}</td>
                    <td className="px-3 py-3.5 text-gray-600 text-xs">
                      {order.customer_first} {order.customer_last}
                    </td>
                    <td className="px-3 py-3.5 text-gray-400 text-xs">{fmtDate(order.created_at)}</td>
                    <td className="px-3 py-3.5 text-right font-semibold text-[#0F1A2B] text-xs">
                      {naira(order.total_ngn)}
                    </td>
                    <td className="px-3 py-3.5 pr-6">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {!data?.recent_orders?.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 text-sm py-10">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Vendor Applications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-[#0F1A2B]">Vendor Applications</h2>
            <Link to="/admin/vendor-applications" className="text-xs text-[#D45B3E] hover:underline font-medium">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.recent_applications || []).map((app) => (
              <div key={app.id} className="px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-[#0F1A2B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0F1A2B] font-bold text-xs">
                    {app.business_name?.slice(0, 2).toUpperCase() || 'BZ'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F1A2B] truncate">{app.business_name}</p>
                  <p className="text-xs text-gray-400">{app.email}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize
                    ${app.status === 'pending'  ? 'bg-amber-100 text-amber-700' : ''}
                    ${app.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                    ${app.status === 'declined' ? 'bg-red-100 text-red-600'    : ''}`}>
                    {app.status}
                  </span>
                  <p className="text-[10px] text-gray-300 mt-0.5">{fmtDate(app.created_at)}</p>
                </div>
              </div>
            ))}
            {!data?.recent_applications?.length && (
              <div className="text-center text-gray-400 text-sm py-10">No applications yet</div>
            )}
          </div>
        </div>
      </div>

    </AdminShell>
  );
}
