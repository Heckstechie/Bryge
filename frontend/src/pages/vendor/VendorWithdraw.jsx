import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function naira(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

export default function VendorWithdraw() {
  const navigate = useNavigate();

  const [wallet, setWallet]   = useState(null);
  const [bank, setBank]       = useState(null);
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/vendor/wallet')
      .then(({ data }) => {
        setWallet(data.wallet);
        setBank(data.bank);
      })
      .catch(() => setError('Failed to load wallet details'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (wallet && amt > wallet.available_balance) {
      setError(`Amount exceeds your available balance of ${naira(wallet.available_balance)}`);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/vendor/withdraw', { amount: amt });
      setSuccess(data.message || 'Withdrawal request submitted successfully!');
      setAmount('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-6 flex items-center">
        <button onClick={() => navigate(-1)}
                className="p-1 text-navy hover:text-navy/70 transition-colors flex-none">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-navy">Withdraw Funds</h1>
        <span className="w-8 flex-none" />
      </div>

      <form onSubmit={handleSubmit} className="px-5 space-y-5">

        {/* Available balance hint */}
        {wallet && (
          <p className="text-center text-sm text-[#8A9BB0]">
            Available: <span className="font-semibold text-navy">{naira(wallet.available_balance)}</span>
          </p>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-navy mb-2">Amount</label>
          <input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); setSuccess(''); }}
            min="1"
            step="0.01"
            required
            className="w-full bg-white border border-[#E2DED8] rounded-xl
                       px-4 py-3.5 text-navy text-sm placeholder-[#C0BAB2]
                       focus:outline-none focus:ring-2 focus:ring-navy/15
                       focus:border-navy/30 transition-all"
          />
        </div>

        {/* Withdraw to */}
        <div>
          <label className="block text-sm font-medium text-navy mb-2">Withdraw to</label>
          {bank ? (
            <div className="bg-white border border-[#E2DED8] rounded-xl px-4 py-3.5">
              <p className="text-navy text-sm font-medium">
                {bank.bank_name} · {bank.account_number} · {bank.account_name}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E2DED8] rounded-xl px-4 py-3.5">
              <p className="text-[#C0BAB2] text-sm">No bank account linked</p>
            </div>
          )}

          {/* Arrival notice */}
          <p className="text-center text-xs text-[#C8603A] mt-2.5 font-medium">
            Funds arrive within 1–3 business days
          </p>
        </div>

        {/* Error / Success */}
        {error   && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && (
          <div className="bg-[#3D6B4F]/10 border border-[#3D6B4F]/30 rounded-xl px-4 py-3 text-center">
            <p className="text-[#3D6B4F] text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !bank}
          className="w-full bg-[#8B3A1E] text-white font-bold py-4 rounded-xl
                     hover:bg-[#7a3219] active:scale-[0.98] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed text-base mt-2"
        >
          {submitting ? 'Submitting…' : 'Confirm Withdrawal'}
        </button>

        {!bank && (
          <p className="text-center text-xs text-[#8A9BB0]">
            <button type="button" onClick={() => navigate('/vendor/bank-details')}
                    className="text-[#C8603A] font-medium underline">
              Add bank details
            </button>{' '}
            to enable withdrawals
          </p>
        )}
      </form>
    </div>
  );
}
