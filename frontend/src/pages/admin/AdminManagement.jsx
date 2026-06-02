import { useState, useEffect } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}

const PERMISSION_LIST = [
  { key: 'view_manage_orders',       label: 'View & Manage Orders' },
  { key: 'update_delivery_status',   label: 'Update Delivery Status' },
  { key: 'manage_vendors',           label: 'Manage Vendors & Applications' },
  { key: 'process_payouts',          label: 'Process Payouts' },
  { key: 'manage_disputes',          label: 'Manage Disputes' },
  { key: 'view_reports',             label: 'View Reports & Analytics' },
  { key: 'manage_products',          label: 'Manage Products' },
  { key: 'platform_settings',        label: 'Platform Settings' },
];

// ── Add / Edit Sub Admin Modal ────────────────────────────────────────────────

function AdminFormModal({ admin, onSave, onClose }) {
  const isEdit = !!admin;
  const [form, setForm] = useState({
    full_name: admin ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() : '',
    email: admin?.email || '',
    permissions: admin?.permissions || {},
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  function togglePerm(key) {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  }

  async function handleSubmit() {
    if (!form.full_name.trim()) { setErr('Full name is required'); return; }
    if (!isEdit && !form.email.trim()) { setErr('Email is required'); return; }
    setSaving(true); setErr('');
    try {
      if (isEdit) {
        await api.patch(`/admin/admins/${admin.id}`, {
          full_name: form.full_name,
          permissions: form.permissions,
        });
      } else {
        await api.post('/admin/admins', {
          full_name:   form.full_name,
          email:       form.email,
          permissions: form.permissions,
        });
      }
      onSave();
    } catch (e) {
      setErr(e.response?.data?.error || `Failed to ${isEdit ? 'update' : 'invite'} admin`);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8">
        <h3 className="text-lg font-bold text-[#0F1A2B] mb-6 text-center">
          {isEdit ? 'Edit Admin' : 'Add Sub Admin'}
        </h3>

        <div className="space-y-3 mb-5">
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Full Name"
            className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm bg-gray-50 focus:outline-none focus:border-[#0F1A2B] placeholder-gray-400"
          />
          {!isEdit && (
            <div>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email Address"
                type="email"
                className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm bg-gray-50 focus:outline-none focus:border-[#0F1A2B] placeholder-gray-400"
              />
              <p className="text-[11px] text-gray-400 mt-1.5 px-2">An invite will be sent to this email</p>
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <p className="text-sm font-bold text-[#0F1A2B] mb-3">Permissions</p>
          <div className="space-y-2">
            {PERMISSION_LIST.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!form.permissions[key]}
                  onChange={() => togglePerm(key)}
                  className="w-4 h-4 accent-[#3D6B4F] rounded"
                />
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {err && <p className="text-xs text-red-500 mb-3">{err}</p>}

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 bg-[#3D6B4F] text-white text-sm font-semibold rounded-full hover:bg-[#3D6B4F]/90 disabled:opacity-60">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Send Invite'}
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 bg-[#8B3A2A] text-white text-sm font-semibold rounded-full hover:bg-[#8B3A2A]/90">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Deactivate Confirm Modal ──────────────────────────────────────────────────

function ConfirmModal({ admin, action, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#D45B3E" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
          </svg>
        </div>
        <h3 className="text-sm font-bold text-[#0F1A2B] mb-2">
          {action === 'deactivate' ? 'Deactivate Admin?' : 'Activate Admin?'}
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          {action === 'deactivate'
            ? `${admin?.name || 'This admin'} will lose access to the dashboard immediately.`
            : `${admin?.name || 'This admin'} will regain access to the dashboard.`}
        </p>
        <div className="flex gap-2">
          <button onClick={go} disabled={loading}
            className={`flex-1 py-2.5 text-white text-xs font-semibold rounded-xl disabled:opacity-60
              ${action === 'deactivate' ? 'bg-[#D45B3E] hover:bg-[#D45B3E]/90' : 'bg-[#3D6B4F] hover:bg-[#3D6B4F]/90'}`}>
            {loading ? 'Processing…' : action === 'deactivate' ? 'Yes, Deactivate' : 'Yes, Activate'}
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminManagement() {
  const [admins, setAdmins]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [q, setQ]             = useState('');
  const [addModal, setAddModal]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { admin, action }
  const [toast, setToast]     = useState('');

  function load() {
    setLoading(true);
    api.get(`/admin/admins?search=${encodeURIComponent(q)}`)
      .then(({ data: d }) => { setAdmins(d.admins || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [q]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function toggleStatus(admin, action) {
    try {
      await api.patch(`/admin/admins/${admin.id}/status`, { action });
      showToast(`Admin ${action}d successfully`);
      load();
    } catch (e) { showToast(e.response?.data?.error || 'Action failed'); }
    finally { setConfirmTarget(null); }
  }

  function permissionSummary(perms) {
    if (!perms || typeof perms !== 'object') return 'No permissions';
    const enabled = Object.values(perms).filter(Boolean).length;
    const total   = PERMISSION_LIST.length;
    if (enabled === total) return 'Full Access';
    return `${enabled} of ${total} modules`;
  }

  return (
    <AdminShell title="Admin Management">

      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0F1A2B] text-white text-xs px-4 py-3 rounded-xl shadow-lg">{toast}</div>
      )}

      {addModal && (
        <AdminFormModal
          onSave={() => { setAddModal(false); showToast('Invite sent'); load(); }}
          onClose={() => setAddModal(false)}
        />
      )}
      {editTarget && (
        <AdminFormModal
          admin={editTarget}
          onSave={() => { setEditTarget(null); showToast('Admin updated'); load(); }}
          onClose={() => setEditTarget(null)}
        />
      )}
      {confirmTarget && (
        <ConfirmModal
          admin={confirmTarget.admin}
          action={confirmTarget.action}
          onConfirm={() => toggleStatus(confirmTarget.admin, confirmTarget.action)}
          onClose={() => setConfirmTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Search */}
        <div className="relative w-full max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="14" height="14"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setQ(search); }}
            placeholder="Search by name, email or role…"
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#0F1A2B]"
          />
        </div>
        <button onClick={() => setAddModal(true)}
          className="ml-4 flex items-center gap-1.5 px-4 py-2.5 bg-[#8B3A2A] text-white text-xs font-semibold rounded-xl hover:bg-[#8B3A2A]/90 flex-shrink-0">
          + Add New Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-4">Name</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-4">Email</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-4">Role</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-4">Permissions</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-4">Status</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-4">Added</th>
                <th className="text-center text-xs font-semibold text-gray-400 px-3 py-4 pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isActive = a.status === 'active';
                const isSuperAdmin = a.role === 'admin';
                return (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#0F1A2B]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#0F1A2B" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-[#0F1A2B]">
                          {[a.first_name, a.last_name].filter(Boolean).join(' ') || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-gray-400">{a.email}</td>
                    <td className="px-3 py-4 text-xs text-gray-600 capitalize">
                      {a.role === 'admin' ? 'Super Admin' : 'Sub Admin'}
                    </td>
                    <td className="px-3 py-4 text-xs text-gray-500">
                      {permissionSummary(a.permissions)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold
                        ${isActive ? 'bg-[#E8F0EB] text-[#3D6B4F]' : 'bg-gray-100 text-gray-400'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center text-xs text-gray-400">{fmtDate(a.created_at)}</td>
                    <td className="px-3 py-4 pr-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditTarget(a)}
                          disabled={isSuperAdmin}
                          className="px-3 py-1.5 bg-[#0F1A2B] text-white text-xs font-semibold rounded-lg hover:bg-[#0F1A2B]/90 disabled:opacity-40 disabled:cursor-not-allowed">
                          Edit
                        </button>
                        {isActive ? (
                          <button
                            onClick={() => setConfirmTarget({ admin: { ...a, name: [a.first_name, a.last_name].filter(Boolean).join(' ') }, action: 'deactivate' })}
                            disabled={isSuperAdmin}
                            className="px-3 py-1.5 bg-[#8B3A2A] text-white text-xs font-semibold rounded-lg hover:bg-[#8B3A2A]/90 disabled:opacity-40 disabled:cursor-not-allowed">
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmTarget({ admin: { ...a, name: [a.first_name, a.last_name].filter(Boolean).join(' ') }, action: 'activate' })}
                            className="px-3 py-1.5 bg-[#3D6B4F] text-white text-xs font-semibold rounded-lg hover:bg-[#3D6B4F]/90">
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 text-sm py-12">No admins found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
