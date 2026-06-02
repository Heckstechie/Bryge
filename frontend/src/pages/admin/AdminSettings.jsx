import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200
        ${checked ? 'bg-[#3D6B4F]' : 'bg-gray-200'}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5
        ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ── Settings Sub-Nav ──────────────────────────────────────────────────────────
export function SettingsShell({ children, title }) {
  const links = [
    { to: '/admin/settings',                    label: 'Platform Settings', end: true },
    { to: '/admin/settings/payment-gateways',   label: 'Payment Gateways' },
    { to: '/admin/settings/admin-management',   label: 'Admin Management' },
  ];
  return (
    <AdminShell title={title}>
      {children}
    </AdminShell>
  );
}

// ── Maintenance Mode Modal ────────────────────────────────────────────────────
function MaintenanceModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-5">
          <p className="text-xl mb-3">⚠️</p>
          <h2 className="text-lg font-bold text-[#0F1A2B] mb-3">Enable Maintenance Mode?</h2>
          <p className="text-sm text-gray-500 mb-3">
            This will take your entire platform offline immediately.
          </p>
          <ul className="text-sm text-gray-500 text-left space-y-1 mb-3 mx-4">
            <li>· All customers will see a maintenance page</li>
            <li>· No orders can be placed</li>
            <li>· Vendors cannot access dashboards</li>
          </ul>
          <p className="text-sm font-semibold text-[#0F1A2B]">Are you absolutely sure?</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className="flex-1 bg-[#3D6B4F] text-white font-semibold py-2.5 rounded-xl text-sm
                       hover:bg-green-700 transition-all">
            Yes, Enable
          </button>
          <button onClick={onCancel}
            className="flex-1 bg-[#8B3A2A] text-white font-semibold py-2.5 rounded-xl text-sm
                       hover:opacity-90 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Field Modal ──────────────────────────────────────────────────────────
function EditModal({ field, value, onSave, onCancel }) {
  const [val, setVal] = useState(value);
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
        <h2 className="text-base font-bold text-[#0F1A2B] mb-4">Edit {field}</h2>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl mb-4
                     focus:outline-none focus:border-[#0F1A2B]/30"
        />
        <div className="flex gap-3">
          <button onClick={() => onSave(val)}
            className="flex-1 bg-[#0F1A2B] text-white font-semibold py-2.5 rounded-xl text-sm hover:opacity-90">
            Save
          </button>
          <button onClick={onCancel}
            className="flex-1 bg-gray-100 text-[#0F1A2B] font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-[#0F1A2B] mb-3">{title}</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminSettings() {
  // General settings state
  const [general, setGeneral] = useState({
    platform_name:    'Bryge',
    support_email:    'support@bryge.com',
    support_phone:    '08172070964',
    currency:         'Nigerian Naira (₦)',
  });

  // Feature toggles
  const [features, setFeatures] = useState({
    digital_products:      false,
    vendor_registration:   true,
    customer_reviews:      true,
    maintenance_mode:      false,
  });

  // Security
  const [security, setSecurity] = useState({
    two_factor:     true,
    session_timeout: '30 minutes',
    login_attempts:  '5 attempts',
  });

  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [editModal, setEditModal]   = useState(null); // { field, key, value }
  const [saved, setSaved]           = useState(false);

  function handleFeatureToggle(key) {
    if (key === 'maintenance_mode' && !features.maintenance_mode) {
      setMaintenanceModal(true);
      return;
    }
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function confirmMaintenance() {
    setFeatures((prev) => ({ ...prev, maintenance_mode: true }));
    setMaintenanceModal(false);
  }

  function saveGeneral(key, val) {
    setGeneral((prev) => ({ ...prev, [key]: val }));
    setEditModal(null);
  }

  function saveAll() {
    // In a real app: POST /admin/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const GENERAL_FIELDS = [
    { key: 'platform_name', label: 'Platform Name' },
    { key: 'support_email', label: 'Support Email' },
    { key: 'support_phone', label: 'Support Phone' },
    { key: 'currency',      label: 'Platform Currency (Default)' },
  ];

  const FEATURE_ITEMS = [
    { key: 'digital_products',    label: 'Digital Products',         desc: 'Show digital products on storefront.' },
    { key: 'vendor_registration', label: 'Vendor Self-Registration',  desc: 'Allow new vendors to apply.' },
    { key: 'customer_reviews',    label: 'Customer Reviews',          desc: 'Allow customers to leave reviews' },
    { key: 'maintenance_mode',    label: 'Maintenance Mode',          desc: 'Take the platform offline' },
  ];

  return (
    <AdminShell title="Platform Settings">
      <div className="max-w-lg">

        {/* General Settings */}
        <Section title="General Settings">
          {GENERAL_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-[#0F1A2B]">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{general[key]}</p>
              </div>
              <button
                onClick={() => setEditModal({ field: label, key, value: general[key] })}
                className="flex items-center gap-1 text-xs text-[#3D6B4F] hover:text-[#0F1A2B] font-medium">
                Edit
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            </div>
          ))}
        </Section>

        {/* Feature Controls */}
        <Section title="Feature Controls">
          {FEATURE_ITEMS.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-[#0F1A2B]">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <Toggle
                checked={features[key]}
                onChange={() => handleFeatureToggle(key)}
              />
            </div>
          ))}
        </Section>

        {/* Security */}
        <Section title="Security">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-[#0F1A2B]">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400 mt-0.5">Require 2FA for admin login</p>
            </div>
            <Toggle
              checked={security.two_factor}
              onChange={(v) => setSecurity((p) => ({ ...p, two_factor: v }))}
            />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-[#0F1A2B]">Session Timeout</p>
              <p className="text-xs text-gray-400 mt-0.5">Auto logout after inactivity</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#0F1A2B]">{security.session_timeout}</span>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setEditModal({ field: 'Session Timeout', key: 'session_timeout', value: security.session_timeout })}
                className="text-xs text-[#3D6B4F] hover:text-[#0F1A2B] font-medium">
                Edit
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-[#0F1A2B]">Login Attempt Limit</p>
              <p className="text-xs text-gray-400 mt-0.5">Lock account after failed logins</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#0F1A2B]">{security.login_attempts}</span>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setEditModal({ field: 'Login Attempt Limit', key: 'login_attempts', value: security.login_attempts })}
                className="text-xs text-[#3D6B4F] hover:text-[#0F1A2B] font-medium">
                Edit
              </button>
            </div>
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-[#0F1A2B]">Clear All Test Data</p>
              <p className="text-xs text-gray-400 mt-0.5">Remove all test orders and accounts</p>
            </div>
            <button className="text-xs text-[#D45B3E] hover:text-red-700 font-medium flex items-center gap-1">
              Clear Data
              <span>🗑</span>
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-[#0F1A2B]">Export All Platform Data</p>
              <p className="text-xs text-gray-400 mt-0.5">Download complete database export</p>
            </div>
            <button className="text-xs text-[#3D6B4F] hover:text-green-700 font-medium flex items-center gap-1">
              Export All
              <span>↓</span>
            </button>
          </div>
        </Section>

        {/* Save */}
        <button onClick={saveAll}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all
            ${saved ? 'bg-green-600' : 'bg-[#8B3A2A] hover:opacity-90'}`}>
          {saved ? '✓ Saved!' : 'Save All Changes'}
        </button>
      </div>

      {/* Maintenance Confirmation Modal */}
      {maintenanceModal && (
        <MaintenanceModal
          onConfirm={confirmMaintenance}
          onCancel={() => setMaintenanceModal(false)}
        />
      )}

      {/* Edit Field Modal */}
      {editModal && (
        <EditModal
          field={editModal.field}
          value={editModal.value}
          onSave={(val) => {
            if (['platform_name','support_email','support_phone','currency'].includes(editModal.key)) {
              saveGeneral(editModal.key, val);
            } else {
              setSecurity((p) => ({ ...p, [editModal.key]: val }));
              setEditModal(null);
            }
          }}
          onCancel={() => setEditModal(null)}
        />
      )}
    </AdminShell>
  );
}
