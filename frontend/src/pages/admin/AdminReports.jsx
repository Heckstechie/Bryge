import { useState, useEffect } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

const PERIODS = [
  { key: 'today',    label: 'Today' },
  { key: 'week',     label: 'This Week' },
  { key: 'month',    label: 'This Month' },
  { key: '3months',  label: 'Last 3 Months' },
];

const CATEGORY_COLORS = ['#3D6B4F','#8B3A2A','#0F1A2B','#5C4A1E','#D45B3E','#6B8E7B'];

export default function AdminReports() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [periodOpen, setPeriodOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/reports/sales?period=${period}`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const maxRevenue = data?.monthly_revenue?.length
    ? Math.max(...data.monthly_revenue.map((m) => Number(m.revenue))) : 1;
  const maxSales = data?.sales_by_month?.length
    ? Math.max(...data.sales_by_month.map((m) => Number(m.order_count))) : 1;
  const maxVendor = data?.top_vendors?.length
    ? Math.max(...data.top_vendors.map((v) => Number(v.revenue))) : 1;

  const totalCategoryOrders = data?.by_category?.reduce((s, c) => s + Number(c.order_count), 0) || 1;

  const currentPeriodLabel = PERIODS.find((p) => p.key === period)?.label || 'This Month';

  return (
    <AdminShell title="Reports & Analytics">

      {/* Header controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
          </svg>
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2">
          {/* Period dropdown */}
          <div className="relative">
            <button onClick={() => setPeriodOpen(!periodOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-600 hover:bg-gray-50">
              {currentPeriodLabel}
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
              </svg>
            </button>
            {periodOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
                {PERIODS.map((p) => (
                  <button key={p.key} onClick={() => { setPeriod(p.key); setPeriodOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors
                      ${period === p.key ? 'text-[#0F1A2B] font-semibold bg-gray-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-600 hover:bg-gray-50">
            Export CSV ↓
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? null : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Revenue',    value: naira(data.stats?.total_revenue),     sub: '+2% this month', bg: 'bg-[#0F1A2B]' },
              { label: 'Total Commission', value: naira(data.stats?.total_commission),   sub: '-8% this month', bg: 'bg-[#8B3A2A]' },
              { label: 'Total Orders',     value: Number(data.stats?.total_orders || 0).toLocaleString(), sub: '-4% this month', bg: 'bg-[#5C4A1E]' },
              { label: 'Avg Order Value',  value: naira(data.stats?.avg_order_value),   sub: '+3% this month', bg: 'bg-[#3D6B4F]' },
            ].map(({ label, value, sub, bg }) => (
              <div key={label} className={`${bg} rounded-2xl px-6 py-5`}>
                <p className="text-[11px] text-white/50 mb-1">{label}</p>
                <p className="text-xl font-bold text-white mb-0.5">{value}</p>
                <p className="text-[10px] text-white/40">{sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue Over Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-5">Revenue Over Time</h3>
            <div className="flex items-end gap-1.5 h-40">
              {data.monthly_revenue.map((m) => {
                const pct = maxRevenue > 0 ? (Number(m.revenue) / maxRevenue) * 100 : 0;
                return (
                  <div key={`${m.month}-${m.year}`} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      className="w-full bg-[#3D6B4F]/30 hover:bg-[#3D6B4F]/50 rounded-t transition-colors cursor-pointer"
                      title={`${m.month}: ${naira(m.revenue)}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 mt-1">
              {data.monthly_revenue.map((m) => (
                <div key={`lbl-${m.month}`} className="flex-1 text-center text-[9px] text-gray-400">{m.month}</div>
              ))}
            </div>
          </div>

          {/* Orders by Category + Top Vendors */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Pie Chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#0F1A2B] mb-4">Orders by Category</h3>
              {data.by_category.length > 0 ? (
                <div className="flex items-center gap-6">
                  {/* CSS conic-gradient pie */}
                  <div className="w-36 h-36 rounded-full flex-shrink-0" style={{
                    background: (() => {
                      let cum = 0;
                      const segments = data.by_category.map((c, i) => {
                        const pct = (Number(c.order_count) / totalCategoryOrders) * 100;
                        const seg = `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} ${cum}% ${cum + pct}%`;
                        cum += pct;
                        return seg;
                      });
                      return `conic-gradient(${segments.join(', ')})`;
                    })()
                  }} />
                  <div className="space-y-2">
                    {data.by_category.map((c, i) => {
                      const pct = Math.round((Number(c.order_count) / totalCategoryOrders) * 100);
                      return (
                        <div key={c.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                          <span className="text-xs text-gray-600">{c.name || 'Other'}</span>
                          <span className="text-xs font-semibold text-[#0F1A2B]">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-8">No data</p>
              )}
            </div>

            {/* Top Vendors */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#0F1A2B] mb-4">Top Vendors by Revenue</h3>
              <div className="space-y-3">
                {data.top_vendors.map((v) => {
                  const pct = maxVendor > 0 ? (Number(v.revenue) / maxVendor) * 100 : 0;
                  return (
                    <div key={v.vendor_name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{v.vendor_name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-[#3D6B4F]/60 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-[#0F1A2B] w-24 text-right flex-shrink-0">
                        {naira(v.revenue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sales by Month */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h3 className="text-sm font-bold text-[#0F1A2B] mb-5">Sales by Month</h3>
            <div className="flex items-end gap-1.5 h-36">
              {data.sales_by_month.map((m) => {
                const pct = maxSales > 0 ? (Number(m.order_count) / maxSales) * 100 : 0;
                return (
                  <div key={`sm-${m.month}-${m.year}`} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] text-gray-400">{m.order_count} sales</span>
                    <div
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      className="w-full bg-[#3D6B4F]/25 hover:bg-[#3D6B4F]/45 rounded-t transition-colors"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 mt-1">
              {data.sales_by_month.map((m) => (
                <div key={`slbl-${m.month}`} className="flex-1 text-center text-[9px] text-gray-400">{m.month}</div>
              ))}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="text-sm font-bold text-[#0F1A2B]">Top Selling Products</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Vendor</th>
                  <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Category</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Units Sold</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Revenue</th>
                  <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 pr-6">Commission</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-6 py-3 text-xs font-semibold text-[#0F1A2B]">{p.product_name}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{p.vendor_name}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{p.category || '—'}</td>
                    <td className="px-3 py-3 text-right text-xs text-gray-600">{p.units_sold}</td>
                    <td className="px-3 py-3 text-right text-xs font-medium text-[#0F1A2B]">{naira(p.revenue)}</td>
                    <td className="px-3 py-3 pr-6 text-right text-xs text-gray-500">{naira(p.commission)}</td>
                  </tr>
                ))}
                {data.top_products.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-400 text-sm py-12">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
