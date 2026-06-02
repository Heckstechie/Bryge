import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TABS = [
  { key: 'all',        label: 'All'         },
  { key: 'sale',       label: 'Sales'       },
  { key: 'withdrawal', label: 'Withdrawals' },
];

function naira(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

function fmtDate(iso) {
  const d  = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  return `${dd}-${mm}-${yr}`;
}

// Derive display info from a wallet_transaction row
function txDisplay(tx) {
  const isSale = ['escrow_credit', 'escrow_release', 'escrow_refund'].includes(tx.type);
  const isWithdrawal = tx.type === 'payout';

  let label;
  if (isSale) {
    label = tx.product_name
      ? `Sale — ${tx.product_name}`
      : (tx.description || 'Sale');
  } else if (isWithdrawal) {
    label = tx.payout_bank_name
      ? `Withdrawal — ${tx.payout_bank_name}`
      : (tx.description || 'Withdrawal');
  } else {
    label = tx.description || tx.type;
  }

  return {
    label,
    isSale,
    isWithdrawal,
    sign:   isSale ? '+' : '-',
    amount: naira(tx.amount),
    amountCls: isSale ? 'text-[#3D6B4F]' : 'text-[#C8603A]',
  };
}

// ── Arrow icons ────────────────────────────────────────────────────────────────
function UpArrow() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M7 7h10v10"/>
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 7 7 17M17 17H7V7"/>
    </svg>
  );
}

export default function VendorTransactions() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.type = activeTab;
      const { data } = await api.get('/vendor/transactions', { params });
      setTransactions(data.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center mb-5">
          <button onClick={() => navigate(-1)}
                  className="p-1 text-navy hover:text-navy/70 transition-colors flex-none">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M15.75 19.5 8.25 12l7.5-7.5"/>
            </svg>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-navy">Transaction History</h1>
          <span className="w-8 flex-none" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-semibold px-5 py-1.5 rounded-full transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#3D6B4F] text-white'
                  : 'bg-[#DDD9D2] text-navy/60 hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="px-4 mt-4 space-y-px">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white h-16 animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-28 text-center px-6">
          <h2 className="text-xl font-bold text-navy mb-3">You're all caught up</h2>
          <p className="text-[#8A9BB0] text-sm">No transactions to show yet</p>
        </div>
      ) : (
        <div className="mt-2">
          {transactions.map((tx, idx) => {
            const d = txDisplay(tx);
            return (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-4 ${
                  idx !== transactions.length - 1 ? 'border-b border-[#EDE8E0]' : ''
                } ${idx % 2 === 0 ? 'bg-cream' : 'bg-[#EDEBE6]'}`}
              >
                {/* Icon circle */}
                <div className="w-10 h-10 rounded-full bg-[#E2DED8] flex items-center
                                justify-center text-navy/60 flex-none">
                  {d.isSale ? <UpArrow /> : <DownArrow />}
                </div>

                {/* Label + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-navy text-sm font-medium leading-snug truncate">
                    {d.label}
                  </p>
                  <p className="text-[#8A9BB0] text-xs mt-0.5">{fmtDate(tx.created_at)}</p>
                </div>

                {/* Amount */}
                <p className={`text-sm font-bold flex-none ${d.amountCls}`}>
                  {d.sign}{d.amount}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
