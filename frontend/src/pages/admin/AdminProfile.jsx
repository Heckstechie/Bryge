import { useState, useEffect } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import api from '../../services/api';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function timeAgo(d) {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return fmtDate(d);
}

// ── Change Password Modal ─────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }) {
  const [form, setForm]   = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr]     = useState('');

  const rules = [
    { label: 'At least 8 characters',   ok: form.next.length >= 8 },
    { label: 'One uppercase letter',     ok: /[A-Z]/.test(form.next) },
    { label: 'One number',               ok: /[0-9]/.test(form.next) },
    { label: 'One special character',    ok: /[^A-Za-z0-9]/.test(form.next) },
  ];

  async function handleSave() {
    if (!rules.every((r) => r.ok)) { setErr('Password does not meet all requirements'); return; }
    if (form.next !== form.confirm)  { setErr('Passwords do not match'); return; }
    setSaving(true); setErr('');
    try {
      await api.patch('/admin/profile', { current_password: form.current, new_password: form.next });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to update password');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8">
        <h3 className="text-lg font-bold text-[#0F1A2B] mb-6 text-center">Change Password</h3>

        <div className="space-y-3 mb-5">
          {[
            { placeholder: 'Current Password', key: 'current' },
            { placeholder: 'New Password',     key: 'next' },
            { placeholder: 'Confirm New Password', key: 'confirm' },
          ].map(({ placeholder, key }) => (
            <input key={key} type="password" placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm bg-gray-50 focus:outline-none focus:border-[#0F1A2B] placeholder-gray-400"
            />
          ))}
        </div>

        {/* Requirements */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#0F1A2B] mb-2">Password requirements:</p>
          <ul className="space-y-1">
            {rules.map((r) => (
              <li key={r.label} className="flex items-center gap-2 text-xs text-gray-400">
                <span className={r.ok ? 'text-[#3D6B4F]' : 'text-gray-300'}>✓</span>
                {r.label}
              </li>
            ))}
          </ul>
        </div>

        {err && <p className="text-xs text-red-500 mb-3">{err}</p>}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 bg-[#3D6B4F] text-white text-sm font-semibold rounded-full hover:bg-[#3D6B4F]/90 disabled:opacity-60">
            {saving ? 'Saving…' : 'Update Password'}
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

// ── Active Sessions Modal ─────────────────────────────────────────────────────

function ActiveSessionsModal({ sessions, onClose }) {
  const [signingOut, setSigningOut] = useState(false);

  async function signOutOthers() {
    setSigningOut(true);
    try { await api.post('/admin/profile/signout-others'); } catch {}
    finally { setSigningOut(false); onClose(); }
  }

  const DeviceIcon = ({ type }) => {
    if (type === 'mobile') return (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3"/>
      </svg>
    );
    return (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"/>
      </svg>
    );
  };

  const mockSessions = sessions?.length ? sessions : [
    { device: 'Windows PC — Chrome', location: 'Lagos, Nigeria', last_active: new Date().toISOString(), is_current: true, type: 'desktop' },
    { device: 'iPhone — Safari',     location: 'Lagos, Nigeria', last_active: new Date().toISOString(), is_current: false, type: 'mobile' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8">
        <h3 className="text-lg font-bold text-[#0F1A2B] mb-6 text-center">Active Sessions</h3>

        <div className="space-y-5 mb-8">
          {mockSessions.map((s, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-0.5 flex-shrink-0">
                <DeviceIcon type={s.type || 'desktop'} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1A2B]">{s.device}</p>
                <p className="text-xs text-gray-400">{s.location || 'Unknown location'}</p>
                <p className="text-xs text-gray-400">Last active: {timeAgo(s.last_active)}</p>
                {s.is_current && (
                  <p className="text-xs text-[#3D6B4F] font-medium">[This device]</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={signOutOthers} disabled={signingOut}
          className="w-full py-3 bg-[#8B3A2A] text-white text-sm font-semibold rounded-full hover:bg-[#8B3A2A]/90 disabled:opacity-60">
          {signingOut ? 'Signing out…' : 'Sign Out All Other Devices'}
        </button>
      </div>
    </div>
  );
}

// ── Edit Field Modal ──────────────────────────────────────────────────────────

function EditModal({ label, value, onSave, onClose }) {
  const [val, setVal] = useState(value || '');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-sm font-bold text-[#0F1A2B] mb-4">Edit {label}</h3>
        <input value={val} onChange={(e) => setVal(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F1A2B]"
          autoFocus />
        <div className="flex gap-2 mt-4">
          <button onClick={() => onSave(val)}
            className="flex-1 py-2.5 bg-[#0F1A2B] text-white text-xs font-semibold rounded-xl">Save Changes</button>
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative flex items-center rounded-full transition-colors flex-shrink-0
        ${on ? 'bg-[#3D6B4F]' : 'bg-gray-200'}`}
      style={{ width: 40, height: 22 }}>
      <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform
        ${on ? 'translate-x-[19px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminProfile() {
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');
  const [editModal, setEditModal] = useState(null);
  const [pwdModal, setPwdModal]   = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [twoFA, setTwoFA]         = useState(false);

  useEffect(() => {
    api.get('/admin/profile')
      .then(({ data: d }) => { setProfile(d); setTwoFA(d.two_fa_enabled || false); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveField(field, value) {
    setSaving(true);
    try {
      await api.patch('/admin/profile', { [field]: value });
      setProfile((p) => ({ ...p, [field]: value }));
      showToast('Profile updated');
    } catch { showToast('Failed to save'); }
    finally { setSaving(false); setEditModal(null); }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  if (loading) return (
    <AdminShell title="Admin Profile">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0F1A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  const initials = profile
    ? `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase() || 'AD'
    : 'AD';
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—';

  return (
    <AdminShell title="Admin Profile">

      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#0F1A2B] text-white text-xs px-4 py-3 rounded-xl shadow-lg">{toast}</div>
      )}
      {editModal && (
        <EditModal label={editModal.label} value={editModal.value}
          onSave={(v) => saveField(editModal.field, v)}
          onClose={() => setEditModal(null)} />
      )}
      {pwdModal && <ChangePasswordModal onClose={() => setPwdModal(false)} />}
      {sessionModal && <ActiveSessionsModal sessions={profile?.sessions} onClose={() => setSessionModal(false)} />}

      <div className="max-w-2xl mx-auto">

        {/* Page title + avatar */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold text-[#0F1A2B] mb-5">Admin Profile</h2>
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-[#0F1A2B] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0F1A2B]/80 rounded-full flex items-center justify-center shadow">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Profile info rows */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 mb-6">
          {[
            {
              icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                </svg>
              ),
              label: 'Full Name', value: fullName,
              editAction: () => setEditModal({ label: 'Full Name', field: 'first_name', value: profile?.first_name }),
            },
            {
              icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
                </svg>
              ),
              label: 'Email Address', value: profile?.email || '—',
              editAction: () => setEditModal({ label: 'Email Address', field: 'email', value: profile?.email }),
            },
            {
              icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"/>
                </svg>
              ),
              label: 'Phone Number', value: profile?.phone || '—',
              editAction: () => setEditModal({ label: 'Phone Number', field: 'phone', value: profile?.phone }),
            },
            {
              icon: (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
                </svg>
              ),
              label: 'Role', value: profile?.role?.replace('_', ' ') || '—',
              locked: true,
            },
          ].map(({ icon, label, value, editAction, locked }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-[#0F1A2B] capitalize">{value}</p>
                </div>
              </div>
              {locked ? (
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
                </svg>
              ) : (
                <button onClick={editAction}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#0F1A2B]">
                  Edit
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Security section */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#0F1A2B] mb-3">Security</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">

            {/* Password */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F1A2B]">Password</p>
                  <p className="text-[11px] text-gray-400">Last changed {profile?.password_updated_at ? fmtDate(profile.password_updated_at) : '—'}</p>
                </div>
              </div>
              <button onClick={() => setPwdModal(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#0F1A2B]">
                Change
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            </div>

            {/* 2FA */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F1A2B]">Two-Factor Auth</p>
                  <p className="text-[11px] text-gray-400">Add an extra layer of security</p>
                </div>
              </div>
              <Toggle on={twoFA} onChange={setTwoFA} />
            </div>

            {/* Active Sessions */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0F1A2B]">Active Sessions</p>
                  <p className="text-[11px] text-gray-400">{profile?.active_sessions || 2} devices currently signed in</p>
                </div>
              </div>
              <button onClick={() => setSessionModal(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#0F1A2B]">
                View
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Sessions table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F1A2B]">Recent Sessions</h3>
            <button className="text-xs text-[#D45B3E] hover:underline font-medium">
              View Full Activity Log →
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 px-6 py-3">Action</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-3 py-3">Date</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-3 py-3 pr-6">IP</th>
              </tr>
            </thead>
            <tbody>
              {(profile?.recent_sessions?.length ? profile.recent_sessions : [
                { action: 'Approved vendor application', created_at: new Date(Date.now()-86400000).toISOString(), ip_address: '102.x.x' },
                { action: 'Released payout ₦40,000',     created_at: new Date(Date.now()-86400000).toISOString(), ip_address: '102.x.x' },
                { action: 'Resolved dispute DIS-001',    created_at: new Date(Date.now()-2*86400000).toISOString(), ip_address: '102.x.x' },
                { action: 'Logged in',                   created_at: new Date(Date.now()-2*86400000).toISOString(), ip_address: '102.x.x' },
                { action: 'Updated commission rate',     created_at: new Date(Date.now()-3*86400000).toISOString(), ip_address: '102.x.x' },
              ]).slice(0, 5).map((s, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-6 py-3 text-xs font-medium text-[#0F1A2B]">{s.action}</td>
                  <td className="px-3 py-3 text-xs text-gray-400">{timeAgo(s.created_at)}</td>
                  <td className="px-3 py-3 pr-6 text-right text-xs text-gray-400">{s.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sign Out of All Devices */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F1A2B]">Sign Out of All Devices</p>
              <p className="text-[11px] text-gray-400">End all active sessions immediately</p>
            </div>
          </div>
          <button
            onClick={() => { if (window.confirm('Sign out of all devices?')) api.post('/admin/profile/signout-all').catch(() => {}); }}
            className="flex items-center gap-1 text-xs text-[#D45B3E] hover:underline font-medium">
            Sign Out All
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
            </svg>
          </button>
        </div>

        {/* Save button */}
        <div>
          <button onClick={() => showToast('Changes saved')} disabled={saving}
            className="px-6 py-2.5 bg-[#8B3A2A] text-white text-sm font-semibold rounded-xl hover:bg-[#8B3A2A]/90 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
