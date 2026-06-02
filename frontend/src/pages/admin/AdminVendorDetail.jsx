import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }); }

const STATUS_MAP = {
  active:    { label: 'Active',    cls: 'bg-green-100 text-green-700 border-green-200' },
  suspended: { label: 'Suspended', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected:  { label: 'Inactive',  cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  pending:   { label: 'Pending',   cls: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const PRODUCT_STATUS_COLORS = {
  active:       'bg-green-100 text-green-700',
  draft:        'bg-gray-100 text-gray-500',
  suspended:    'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-600',
};

export default function AdminVendorDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  function fetchData() {
    setLoading(true);
    api.get(`/admin/vendors/${id}`)
      .then(({ data: res }) => setData(res))
      .catch(() => navigate('/admin/vendors'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { fetchData(); }, [id]);

  async function handleAction(action) {
    if (!window.confirm(`Confirm: ${action} this vendor?`)) return;
    setActing(action);
    setError('');
    try {
      await api.patch(`/admin/vendors/${id}/status`, { action });
      setSuccess(`Vendor ${action}d successfully`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally { setActing(''); }
  }

  if (loading) return (
    <AdminShell title="Vendor Profile">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  const { vendor, products, total_paid_out } = data;
  const status = vendor.status;
  const { label: statusLabel, cls: statusCls } = STATUS_MAP[status] || STATUS_MAP.rejected;

  // Action buttons based on status
  const actions = [];
  if (status === 'active') {
    actions.push({ key: 'deactivate', label: 'Deactivate', cls: 'border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600' });
    actions.push({ key: 'suspend',    label: 'Suspend',    cls: 'border border-amber-400 text-amber-600 hover:bg-amber-50' });
  } else if (status === 'suspended') {
    actions.push({ key: 'deactivate', label: 'Deactivate', cls: 'border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-600' });
    actions.push({ key: 'activate',   label: 'Reactivate', cls: 'border border-green-400 text-green-600 hover:bg-green-50' });
  } else {
    actions.push({ key: 'activate', label: 'Reactivate', cls: 'border border-green-400 text-green-600 hover:bg-green-50' });
  }

  const location = [vendor.city, vendor.country].filter(Boolean).join(', ');
  const fullName = [vendor.first_name, vendor.last_name].filter(Boolean).join(' ');

  return (
    <AdminShell title="Vendor Profile">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-xs text-gray-400">
        <Link to="/admin/vendors" className="hover:text-[#0F1A2B]">Vendors</Link>
        <span>/</span>
        <span className="text-[#0F1A2B] font-medium">{vendor.business_name}</span>
      </div>

      {error   && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
      {success && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>}

      {/* ── Profile Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-5">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          {vendor.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.business_name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#0F1A2B]/10 flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-2xl font-bold text-[#0F1A2B]/50">
                {vendor.business_name?.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-16 gap-y-4 max-w-2xl mx-auto mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Personal Info</p>
            <p className="text-sm font-medium text-[#0F1A2B]">{fullName || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Business Name</p>
            <p className="text-sm font-semibold text-[#0F1A2B]">{vendor.business_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Email</p>
            <p className="text-sm text-[#0F1A2B]">{vendor.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Phone No</p>
            <p className="text-sm text-[#0F1A2B]">{vendor.business_phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Location</p>
            <p className="text-sm text-[#0F1A2B]">{location || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Date Joined</p>
            <p className="text-sm text-[#0F1A2B]">{fmtDate(vendor.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Status</p>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCls}`}>
              {statusLabel}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Vendor's ID</p>
            <p className="text-sm font-mono text-[#0F1A2B]">{vendor.vendor_id_display}</p>
          </div>
        </div>

        {/* Wallet summary */}
        {(vendor.available_balance !== null || vendor.on_hold_balance !== null) && (
          <div className="flex justify-center gap-6 mb-6 py-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Available Balance</p>
              <p className="text-sm font-bold text-green-600">{naira(vendor.available_balance || 0)}</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">On Hold</p>
              <p className="text-sm font-bold text-amber-600">{naira(vendor.on_hold_balance || 0)}</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Total Paid Out</p>
              <p className="text-sm font-bold text-[#0F1A2B]">{naira(total_paid_out)}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center gap-3">
          {actions.map((a) => (
            <button
              key={a.key}
              onClick={() => handleAction(a.key)}
              disabled={!!acting}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${a.cls}`}
            >
              {acting === a.key ? '…' : a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-[#0F1A2B]">Products</h2>
          <Link to={`/admin/payouts?vendor=${id}`}
            className="text-xs text-[#D45B3E] hover:underline font-medium">
            View Vendor's Payouts →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-12">No Products Yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Product Name</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Category</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Price</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3">Total Sold</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#F7F5F0] rounded-lg overflow-hidden flex-shrink-0">
                        {p.primary_image
                          ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                        }
                      </div>
                      <span className="text-xs font-semibold text-[#0F1A2B]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-gray-500">{p.category_name}</td>
                  <td className="px-3 py-3.5 text-right text-xs font-medium text-[#0F1A2B]">{naira(p.price)}</td>
                  <td className="px-3 py-3.5 text-right text-xs text-gray-600">{p.total_sold}</td>
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize
                      ${PRODUCT_STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                      {p.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 pr-6 text-right">
                    <button
                      onClick={() => navigate(`/admin/products/${p.id}`)}
                      className="text-xs text-[#D45B3E] hover:underline font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
