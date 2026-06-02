import { useState, useEffect, useCallback } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function naira(n) { return `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`; }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  const ACCENT = {
    orange:  'bg-orange-50 text-orange-600',
    red:     'bg-red-50 text-[#8B3A2A]',
    navy:    'bg-[#0F1A2B]/5 text-[#0F1A2B]',
    green:   'bg-green-50 text-[#3D6B4F]',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${ACCENT[accent]?.split(' ')[1] || 'text-[#0F1A2B]'}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Deactivate Confirm Modal ──────────────────────────────────────────────────
function DeactivateModal({ category, onConfirm, onCancel, loading }) {
  if (!category) return null;
  const isActive = category.active;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 className="text-lg font-bold text-[#0F1A2B] text-center mb-3">
          {isActive ? 'Deactivate Category?' : 'Activate Category?'}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-7 leading-relaxed">
          {isActive
            ? <>Products in <strong>{category.name}</strong> will be hidden from the storefront.</>
            : <>Products in <strong>{category.name}</strong> will become visible on the storefront.</>
          }
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 text-white font-semibold py-3 rounded-xl text-sm
              disabled:opacity-50 transition-all
              ${isActive ? 'bg-[#8B3A2A] hover:opacity-90' : 'bg-[#3D6B4F] hover:bg-green-700'}`}>
            {loading ? '…' : isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
          </button>
          <button onClick={onCancel} disabled={loading}
            className="flex-1 bg-gray-100 text-[#0F1A2B] font-semibold py-3 rounded-xl text-sm
                       hover:bg-gray-200 disabled:opacity-50 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Category Form Modal (Add / Edit) ─────────────────────────────────────────
function CategoryFormModal({ initial, onSave, onCancel, saving }) {
  const isEdit = !!initial;
  const [name, setName]                 = useState(initial?.name || '');
  const [commissionRate, setCommRate]   = useState(initial?.commission_rate ?? '');
  const [err, setErr]                   = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr('Category name is required.'); return; }
    if (commissionRate === '' || isNaN(commissionRate) || Number(commissionRate) < 0 || Number(commissionRate) > 100) {
      setErr('Enter a valid commission rate (0–100).'); return;
    }
    setErr('');
    onSave({ name: name.trim(), commission_rate: Number(commissionRate) });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-lg font-bold text-[#0F1A2B] mb-6">
          {isEdit ? 'Edit Category' : 'Add New Category'}
        </h2>
        {err && <p className="mb-4 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electronics"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl
                         focus:outline-none focus:border-[#0F1A2B]/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Commission Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commissionRate}
              onChange={(e) => setCommRate(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl
                         focus:outline-none focus:border-[#0F1A2B]/30"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#0F1A2B] text-white font-semibold py-3 rounded-xl text-sm
                         hover:opacity-90 disabled:opacity-50 transition-all">
              {saving ? '…' : isEdit ? 'Save Changes' : 'Add Category'}
            </button>
            <button type="button" onClick={onCancel} disabled={saving}
              className="flex-1 bg-gray-100 text-[#0F1A2B] font-semibold py-3 rounded-xl text-sm
                         hover:bg-gray-200 disabled:opacity-50 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const [stats, setStats]             = useState(null);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);

  // Modals
  const [formModal, setFormModal]       = useState(null);   // null | { mode:'add'|'edit', category?: {} }
  const [toggleModal, setToggleModal]   = useState(null);   // category object or null
  const [saving, setSaving]             = useState(false);
  const [toggling, setToggling]         = useState(false);
  const [error, setError]               = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/categories')
      .then(({ data }) => {
        setStats(data.stats);
        setCategories(data.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSave(payload) {
    setSaving(true);
    setError('');
    try {
      if (formModal.mode === 'add') {
        const { data } = await api.post('/admin/categories', payload);
        setCategories((prev) => [data.category, ...prev]);
      } else {
        const { data } = await api.put(`/admin/categories/${formModal.category.id}`, payload);
        setCategories((prev) => prev.map((c) => c.id === data.category.id ? data.category : c));
      }
      setFormModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally { setSaving(false); }
  }

  async function handleToggle() {
    if (!toggleModal) return;
    setToggling(true);
    try {
      const { data } = await api.patch(`/admin/categories/${toggleModal.id}/status`);
      setCategories((prev) => prev.map((c) => c.id === data.category.id ? data.category : c));
      setToggleModal(null);
    } catch {}
    setToggling(false);
  }

  return (
    <AdminShell title="Categories & Commission">

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Categories"   value={stats?.total_categories ?? '—'}          accent="navy" />
        <StatCard label="Active Categories"  value={stats?.active_categories ?? '—'}          accent="green" />
        <StatCard label="Total Products"     value={stats?.total_products ?? '—'}             accent="orange" />
        <StatCard label="Avg. Commission"    value={stats ? `${Number(stats.avg_commission).toFixed(1)}%` : '—'} accent="red" />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[#0F1A2B]">All Categories</h2>
        <button
          onClick={() => { setError(''); setFormModal({ mode: 'add' }); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F1A2B] text-white text-xs font-semibold
                     rounded-xl hover:opacity-90 transition-colors">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3.5">Category Name</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Commission</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Products</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5">Est. Revenue</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Status</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3.5">Date Created</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3.5 pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-16">
                <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-400 text-sm py-16">No categories yet</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-3.5">
                  <span className="text-xs font-semibold text-[#0F1A2B]">{cat.name}</span>
                </td>
                <td className="px-3 py-3.5 text-right text-xs font-medium text-[#0F1A2B]">
                  {Number(cat.commission_rate).toFixed(1)}%
                </td>
                <td className="px-3 py-3.5 text-right text-xs text-gray-600">{cat.product_count}</td>
                <td className="px-3 py-3.5 text-right text-xs text-gray-600">{naira(cat.estimated_revenue)}</td>
                <td className="px-3 py-3.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
                    ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-400">{fmtDate(cat.created_at)}</td>
                <td className="px-3 py-3.5 pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setError(''); setFormModal({ mode: 'edit', category: cat }); }}
                      className="text-xs font-medium px-3 py-1 rounded-lg border border-gray-200
                                 text-[#0F1A2B] hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => setToggleModal(cat)}
                      className={`text-xs font-medium px-3 py-1 rounded-lg border transition-colors
                        ${cat.active
                          ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                          : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                      {cat.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deactivate/Activate Modal */}
      {toggleModal && (
        <DeactivateModal
          category={toggleModal}
          loading={toggling}
          onConfirm={handleToggle}
          onCancel={() => setToggleModal(null)}
        />
      )}

      {/* Add / Edit Form Modal */}
      {formModal && (
        <CategoryFormModal
          initial={formModal.mode === 'edit' ? formModal.category : null}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setFormModal(null)}
        />
      )}
    </AdminShell>
  );
}
