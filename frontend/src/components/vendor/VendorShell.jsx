// Shared vendor dashboard shell — header + stat cards.
import { useNavigate } from 'react-router-dom';

function naira(amount) {
  return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function VendorShell({ vendor, wallet, children }) {
  const navigate = useNavigate();

  const initials = vendor?.business_name
    ? vendor.business_name.slice(0, 2).toUpperCase()
    : 'VN';

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Header ── */}
      <div className="bg-cream px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          {/* Avatar + greeting */}
          <div className="flex items-center gap-3">
            {vendor?.logo_url ? (
              <img src={vendor.logo_url} alt="logo"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center
                              text-white text-sm font-bold shadow-sm">
                {initials}
              </div>
            )}
            <span className="text-base font-semibold text-navy">
              Hey {vendor?.business_name || 'Vendor'}
            </span>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-3">
            {/* Bell with red notification dot */}
            <button className="relative text-navy hover:text-navy/70 transition-colors"
                    onClick={() => navigate('/vendor/notifications')}>
              <BellIcon />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500
                               rounded-full border-2 border-cream" />
            </button>
            <button className="text-navy hover:text-navy/70 transition-colors"
                    onClick={() => navigate('/vendor/settings')}>
              <GearIcon />
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {/* Total Sales — terracotta */}
          <div className="bg-[#C8603A] rounded-2xl p-4 text-white">
            <p className="text-xs font-medium opacity-80">Total Sales</p>
            <p className="text-xl font-bold mt-1 leading-tight">{naira(wallet?.month_sales)}</p>
            <p className="text-[10px] opacity-70 mt-0.5">This Month</p>
          </div>
          {/* On Hold — sage green */}
          <div className="bg-[#4E7D5B] rounded-2xl p-4 text-white">
            <p className="text-xs font-medium opacity-80">On Hold</p>
            <p className="text-xl font-bold mt-1 leading-tight">{naira(wallet?.on_hold_balance)}</p>
            <p className="text-[10px] opacity-70 mt-0.5">Awaiting delivery</p>
          </div>
        </div>

        {/* ── Available Balance card ── */}
        <div className="bg-navy rounded-2xl px-4 py-4 mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 font-medium">Available Balance</p>
            <p className="text-2xl font-bold text-white mt-0.5">{naira(wallet?.available_balance)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={() => navigate('/vendor/transactions')}
                    className="text-[11px] text-white/60 font-medium hover:text-white transition-colors">
              Transactions &gt;
            </button>
            <button onClick={() => navigate('/vendor/withdraw')}
                    className="bg-white text-navy text-xs font-bold px-5 py-1.5
                               rounded-full hover:bg-white/90 transition-colors shadow-sm">
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="px-4 pb-24">
        {children}
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18
           9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64
           3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714
           0a3 3 0 1 1-5.714 0"/>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213
           1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257
           1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296
           2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723
           7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26
           1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47
           6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55
           0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0
           1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0
           1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932
           6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0
           1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072
           1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
    </svg>
  );
}
