import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  overview: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>,
  orders:   <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/></svg>,
  vendors:  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016 2.993 2.993 0 0 0 2.25-1.016 3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/></svg>,
  products: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/></svg>,
  payouts:  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"/></svg>,
  disputes: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/></svg>,
  reports:  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></svg>,
  settings: <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>,
  profile:  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>,
  logout:   <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"/></svg>,
};

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
         ${isActive ? 'bg-white/12 text-white' : 'text-white/50 hover:text-white hover:bg-white/6'}`
      }>
      {icon}{label}
    </NavLink>
  );
}

export default function AdminShell({ children, title }) {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD';
  const vendorsActive   = location.pathname.startsWith('/admin/vendors');
  const productsActive  = location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/admin/categories');
  const payoutsActive   = location.pathname.startsWith('/admin/payouts') || location.pathname.startsWith('/admin/refunds');
  const disputesActive  = location.pathname.startsWith('/admin/disputes');
  const reportsActive   = location.pathname.startsWith('/admin/reports') || location.pathname.startsWith('/admin/audit-log');
  const settingsActive  = location.pathname.startsWith('/admin/settings');

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-[210px] flex-shrink-0 bg-[#0F1A2B] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/8">
          <div className="flex items-baseline gap-0.5">
            <span className="text-white font-bold text-xl tracking-wide">bryge</span>
            <span className="text-[#D45B3E] font-bold text-xl">.</span>
          </div>
          <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          <NavItem to="/admin/dashboard" icon={Icon.overview} label="Overview" end />
          <NavItem to="/admin/orders"    icon={Icon.orders}   label="Orders" />
          <NavItem to="/admin/customers" icon={Icon.profile}  label="Customers" />

          {/* Vendors group */}
          <div>
            {/* Parent item — always visible, highlight when any /admin/vendors/* route is active */}
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${vendorsActive ? 'bg-white/12 text-white' : 'text-white/50'}`}>
              {Icon.vendors}
              <span>Vendors</span>
            </div>
            {/* Sub-items — always visible (matching design) */}
            <div className="ml-7 mt-0.5 space-y-0.5">
              {[
                { to: '/admin/vendors',              label: 'All Vendors',       end: true },
                { to: '/admin/vendors/applications', label: 'Applications' },
                { to: '/admin/vendors/suspended',    label: 'Suspended Vendors' },
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-colors
                     ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Products group */}
          <div>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${productsActive ? 'bg-white/12 text-white' : 'text-white/50'}`}>
              {Icon.products}
              <span>Products</span>
            </div>
            <div className="ml-7 mt-0.5 space-y-0.5">
              {[
                { to: '/admin/products',    label: 'All Products',           end: true },
                { to: '/admin/categories',  label: 'Categories & Commission' },
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-colors
                     ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Payouts group */}
          <div>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${payoutsActive ? 'bg-white/12 text-white' : 'text-white/50'}`}>
              {Icon.payouts}
              <span>Payouts</span>
            </div>
            <div className="ml-7 mt-0.5 space-y-0.5">
              {[
                { to: '/admin/payouts',            label: 'Payout Queue',        end: true },
                { to: '/admin/payouts/completed',  label: 'Completed Payouts' },
                { to: '/admin/payouts/withdrawals',label: 'Withdrawal Requests' },
                { to: '/admin/refunds',            label: 'Refunds' },
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-colors
                     ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Disputes group */}
          <div>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${disputesActive ? 'bg-white/12 text-white' : 'text-white/50'}`}>
              {Icon.disputes}
              <span>Disputes</span>
            </div>
            <div className="ml-7 mt-0.5 space-y-0.5">
              {[
                { to: '/admin/disputes',              label: 'Open Disputes',  end: true },
                { to: '/admin/disputes/under-review', label: 'Under Review' },
                { to: '/admin/disputes/resolved',     label: 'Resolved' },
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-colors
                     ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
          {/* Reports group */}
          <div>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${reportsActive ? 'bg-white/12 text-white' : 'text-white/50'}`}>
              {Icon.reports}
              <span>Reports</span>
            </div>
            <div className="ml-7 mt-0.5 space-y-0.5">
              {[
                { to: '/admin/reports',                      label: 'Sales Analytics',    end: true },
                { to: '/admin/reports/vendor-performance',   label: 'Vendor Performance' },
                { to: '/admin/reports/transactions',         label: 'Transaction History' },
                { to: '/admin/audit-log',                    label: 'Audit Log' },
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-colors
                     ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Settings group */}
          <div>
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              ${settingsActive ? 'bg-white/12 text-white' : 'text-white/50'}`}>
              {Icon.settings}
              <span>Settings</span>
            </div>
            <div className="ml-7 mt-0.5 space-y-0.5">
              {[
                { to: '/admin/settings',                    label: 'Platform Settings',  end: true },
                { to: '/admin/settings/payment-gateways',   label: 'Payment Gateways' },
                { to: '/admin/settings/admin-management',   label: 'Admin Management' },
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-xs font-medium transition-colors
                     ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="px-2.5 pb-4 border-t border-white/8 pt-3 space-y-0.5">
          <NavItem to="/admin/profile" icon={Icon.profile} label="Profile" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-white/40 hover:text-white hover:bg-white/6 transition-colors"
          >
            {Icon.logout}
            Logout
          </button>
          {/* Admin info */}
          <div className="flex items-center gap-2 px-3 pt-2">
            <div className="w-7 h-7 bg-[#D45B3E] rounded-full flex items-center justify-center
                            text-white text-[10px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-[11px] font-medium truncate">{user?.email}</p>
              <p className="text-white/30 text-[9px] capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <h1 className="text-base font-bold text-[#0F1A2B]">{title}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/notifications')}
              className="relative text-gray-400 hover:text-[#0F1A2B] transition-colors">
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#D45B3E] rounded-full" />
            </button>
            <div className="w-8 h-8 bg-[#0F1A2B] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
