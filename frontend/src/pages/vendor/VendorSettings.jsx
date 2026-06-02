import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Setting row ────────────────────────────────────────────────────────────────
function SettingRow({ icon, label, subtitle, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 text-left
                 hover:bg-[#F5F2EC] active:bg-[#EDE8DF] transition-colors"
    >
      {/* Icon circle */}
      <div className="w-10 h-10 rounded-full bg-[#3D6B4F]/15 flex items-center
                      justify-center flex-none">
        <span className="text-[#3D6B4F]">{icon}</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${danger ? 'text-[#C8603A]' : 'text-navy'}`}>
          {label}
        </p>
        {subtitle && (
          <p className="text-[#8A9BB0] text-xs mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>

      {/* Chevron */}
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
           stroke={danger ? '#C8603A' : '#8A9BB0'} strokeWidth={2.5} strokeLinecap="round">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </button>
  );
}

// ── Divider between rows ───────────────────────────────────────────────────────
function Divider() {
  return <div className="h-px bg-[#F0EBE3] mx-4" />;
}

export default function VendorSettings() {
  const navigate        = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/vendor/login', { replace: true });
  }

  const businessName = user?.business_name || user?.name || 'My Store';
  const email        = user?.email || '';

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4 flex items-center">
        <button onClick={() => navigate(-1)}
                className="p-1 text-navy hover:text-navy/70 transition-colors flex-none">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-navy">Store Settings</h1>
        <span className="w-8 flex-none" />
      </div>

      <div className="px-4 space-y-4 pb-12">

        {/* ── Profile card ── */}
        <div className="bg-[#4E7D5B] rounded-2xl px-5 py-5 flex items-center gap-4">
          {/* Avatar */}
          <div className="relative w-14 h-14 flex-none">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center
                            justify-center overflow-hidden">
              {user?.logo_url ? (
                <img src={user.logo_url} alt="logo"
                     className="w-full h-full object-cover" />
              ) : (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24"
                     stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0
                           2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              )}
            </div>
            {/* Camera badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full
                            bg-white/30 flex items-center justify-center">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24"
                   stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0
                         2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
          </div>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight truncate">
              {businessName}
            </p>
            <p className="text-white/70 text-sm mt-0.5 truncate">{email}</p>
          </div>

          {/* Edit pencil */}
          <button onClick={() => navigate('/vendor/settings/business')}
                  className="text-white/80 hover:text-white transition-colors flex-none p-1">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/>
            </svg>
          </button>
        </div>

        {/* ── Main settings group ── */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <SettingRow
            icon={<InfoIcon />}
            label="Business Information"
            subtitle="Make changes to your business information"
            onClick={() => navigate('/vendor/settings/business')}
          />
          <Divider />
          <SettingRow
            icon={<BankIcon />}
            label="Bank Details"
            subtitle="Update your bank details"
            onClick={() => navigate('/vendor/bank-details')}
          />
          <Divider />
          <SettingRow
            icon={<LockIcon />}
            label="Change Password"
            subtitle="Update your password"
            onClick={() => navigate('/vendor/settings/password')}
          />
          <Divider />
          <SettingRow
            icon={<BellIcon />}
            label="Notification Preferences"
            subtitle="Make changes to your notification"
            onClick={() => navigate('/vendor/settings/notifications')}
          />
        </div>

        {/* "More" label */}
        <p className="text-sm font-semibold text-navy/50 px-1">More</p>

        {/* ── More group ── */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <SettingRow
            icon={<PhoneIcon />}
            label="Help & Support"
            onClick={() => navigate('/vendor/settings/support')}
          />
          <Divider />
          <SettingRow
            icon={<ShieldIcon />}
            label="Terms & Privacy"
            onClick={() => navigate('/vendor/settings/terms')}
          />
          <Divider />
          <SettingRow
            icon={<LogoutIcon />}
            label="Sign Out"
            onClick={handleLogout}
          />
        </div>

      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22h18M3 7h18M3 7l9-4 9 4M4 7v15M20 7v15M8 11v8M12 11v8M16 11v8"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0
               1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2
               1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0
               6.72 6.72l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1
               22 16.92Z"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>
      <line x1="12" y1="11" x2="12" y2="11.01"/>
      <line x1="12" y1="15" x2="12" y2="11"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
