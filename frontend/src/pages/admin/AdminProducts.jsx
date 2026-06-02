import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }

const STATUS_COLORS = {
  active:       'bg-green-100 text-green-700',
  draft:        'bg-gray-100 text-gray-500',
  suspended:    'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-600',
};

const STATUS_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'draft',     label: 'Draft' },
];

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts]   = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState('all');
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]           = useState(1);
  const [togglingId, setTogglingId] = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    api.get(`/admin/products?${params}`)
      .then(({ data }) => {
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function toggleStatus(product, e) {
    e.stopPropagation();
    const newStatus = product.status === 'active' ? 'suspended' : 'active';
    setTogglingId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/status`, { status: newStatus });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, status: newStatus } : p));
    } catch {}
    setTogglingId(null);
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <AdminShell title="Products">
      <div className="flex items-center justify-between mb-5 gap-4">
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {STATUS_TABS.map((tab) => (
            <button key={tab.key} onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${status === tab.key ? 'bg-[#0F1A2B] text-white' : 'text-gray-500 hover:text-[#0F1A2B]'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <input type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search product or vendor…"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white
                         focus:outline-none focus:border-[#0F1A2B]/30 w-60" />
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
              <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3.5">Product Name</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Category</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Vendor</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Price</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Total Sold</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Date Added</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5 pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-400 text-sm py-16">No products found</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}
                onClick={() => navigate(`/admin/products/${p.id}`)}
                className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F7F5F0] rounded-lg overflow-hidden flex-shrink-0">
                      {p.primary_image
                        ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                      }
                    </div>
                    <span className="text-xs font-semibold text-[#0F1A2B] truncate max-w-[140px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-500">{p.category_name}</td>
                <td className="px-3 py-3.5">
                  <Link
                    to={`/admin/vendors/${p.vendor_profile_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-[#0F1A2B] hover:text-[#D45B3E] hover:underline truncate block max-w-[120px]">
                    {p.vendor_name}
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-right text-xs font-medium text-[#0F1A2B]">{naira(p.price)}</td>
                <td className="px-3 py-3.5 text-right text-xs text-gray-600">{p.total_sold}</td>
                <td className="px-3 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize
                    ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                    {p.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-400">{fmtDate(p.created_at)}</td>
                <td className="px-3 py-3.5 pr-6 text-right">
                  <button
                    onClick={(e) => toggleStatus(p, e)}
                    disabled={togglingId === p.id}
                    className={`text-xs font-medium px-3 py-1 rounded-lg border transition-colors disabled:opacity-40
                      ${p.status === 'active'
                        ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                        : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                  >
                    {togglingId === p.id ? '…' : p.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">Showing {products.length} of {pagination.total} products</p>
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
