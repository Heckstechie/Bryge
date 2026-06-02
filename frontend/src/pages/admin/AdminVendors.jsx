import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }

const STATUS_MAP = {
  active:    { label: 'Active',    cls: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspended', cls: 'bg-amber-100 text-amber-700' },
  rejected:  { label: 'Inactive',  cls: 'bg-gray-100 text-gray-500'  },
  pending:   { label: 'Pending',   cls: 'bg-blue-100 text-blue-700'  },
};

function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

// Which API tab maps to which route
const TABS = [
  { key: 'all',         label: 'All Vendors',       path: '/admin/vendors' },
  { key: 'applications',label: 'Applications',       path: '/admin/vendors/applications' },
  { key: 'suspended',   label: 'Suspended Vendors',  path: '/admin/vendors/suspended' },
];

export default function AdminVendors() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Derive active tab from current URL
  const activeTab = location.pathname.includes('applications') ? 'applications'
    : location.pathname.includes('suspended') ? 'suspended'
    : 'all';

  const [vendors, setVendors]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]           = useState(1);

  const fetchVendors = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ tab: activeTab, page, limit: 20 });
    if (search) params.append('search', search);

    api.get(`/admin/vendors?${params}`)
      .then(({ data }) => {
        setVendors(data.vendors);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab, page, search]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { setPage(1); setSearch(''); setSearchInput(''); }, [activeTab]);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <AdminShell title="Vendors">
      {/* Tab navigation is in the sidebar; search + table here */}
      <div className="flex items-center justify-between mb-5 gap-4">
        {/* Sub-tab labels (for reference / breadcrumb feel) */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => navigate(t.path)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${activeTab === t.key ? 'bg-[#0F1A2B] text-white' : 'text-gray-500 hover:text-[#0F1A2B]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white
                         focus:outline-none focus:border-[#0F1A2B]/30 w-64" />
            <svg className="absolute left-3 top-2.5 text-gray-400" width="14" height="14"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
          </div>
          <button type="submit"
            className="px-4 py-2 bg-[#0F1A2B] text-white text-xs font-semibold rounded-xl hover:opacity-90">
            Search
          </button>
          {search && (
            <button type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl bg-white">
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3.5">Business Name</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Vendor ID</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Email</th>
              <th className="text-center text-xs font-semibold text-gray-400 px-3 py-3.5">Products</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Total Sales</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Date Joined</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5 pr-6">Profile</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-400 text-sm py-16">No vendors found</td></tr>
            ) : vendors.map((v) => (
              <tr key={v.id}
                onClick={() => navigate(
                  activeTab === 'applications'
                    ? `/admin/vendors/applications/${v.id}`
                    : `/admin/vendors/${v.id}`
                )}
                className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-[#0F1A2B]">{v.business_name}</p>
                  {(v.first_name || v.last_name) && (
                    <p className="text-[10px] text-gray-400">{v.first_name} {v.last_name}</p>
                  )}
                </td>
                <td className="px-3 py-4 text-xs font-mono text-gray-500">{v.vendor_id_display}</td>
                <td className="px-3 py-4 text-xs text-gray-500">{v.email}</td>
                <td className="px-3 py-4 text-center text-xs text-gray-600">{v.product_count}</td>
                <td className="px-3 py-4 text-right text-xs font-semibold text-[#0F1A2B]">
                  {naira(v.total_sales)}
                </td>
                <td className="px-3 py-4"><StatusBadge status={v.status} /></td>
                <td className="px-3 py-4 text-xs text-gray-400">{fmtDate(v.created_at)}</td>
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

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">Showing {vendors.length} of {pagination.total} vendors</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50">
              ← Prev
            </button>
            <span className="text-xs text-gray-500">Page {page} of {pagination.pages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white disabled:opacity-40 hover:bg-gray-50">
              Next →
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
