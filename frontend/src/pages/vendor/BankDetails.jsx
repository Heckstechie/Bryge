import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function BankDetails() {
  const navigate = useNavigate();
  const [banks, setBanks]             = useState([]);
  const [form, setForm]               = useState({ bank_name: '', bank_code: '', account_number: '', account_name: '' });
  const [resolving, setResolving]     = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    api.get('/vendor/banks')
      .then(({ data }) => setBanks(data.banks || []))
      .catch(() => {});
  }, []);

  // Auto-resolve account name when both account_number and bank_code are set
  useEffect(() => {
    if (form.account_number.length !== 10 || !form.bank_code) return;

    setResolving(true);
    setResolveError('');
    setForm((f) => ({ ...f, account_name: '' }));

    const timer = setTimeout(() => {
      api.get('/vendor/resolve-account', {
        params: { account_number: form.account_number, bank_code: form.bank_code },
      })
        .then(({ data }) => {
          setForm((f) => ({ ...f, account_name: data.account_name }));
        })
        .catch((err) => {
          setResolveError(err.response?.data?.message || 'Could not verify account number');
        })
        .finally(() => setResolving(false));
    }, 600); // debounce

    return () => clearTimeout(timer);
  }, [form.account_number, form.bank_code]);

  function onBankChange(e) {
    const option = banks.find((b) => b.code === e.target.value);
    setForm((f) => ({
      ...f,
      bank_code: e.target.value,
      bank_name: option?.name || '',
      account_name: '',
    }));
    setResolveError('');
    setError('');
  }

  function onAccountNumberChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, account_number: val, account_name: '' }));
    setResolveError('');
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.account_name) return setError('Account name could not be verified. Please check your account number and bank.');

    setSaving(true);
    setError('');
    try {
      await api.post('/vendor/bank-details', form);
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bank details. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-navy px-4 py-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-white p-1"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
          </svg>
        </button>
        <h1 className="text-white font-semibold text-base">Bank Details</h1>
      </div>

      <div className="px-4 pt-6 pb-10">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Bank selector */}
          <div className="relative">
            <select
              value={form.bank_code}
              onChange={onBankChange}
              className="input-field appearance-none pr-8"
              required
            >
              <option value="" disabled>Bank Name</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7"/>
              </svg>
            </div>
          </div>

          {/* Account number */}
          <input
            type="text"
            inputMode="numeric"
            placeholder="Account Number"
            value={form.account_number}
            onChange={onAccountNumberChange}
            className="input-field tracking-widest"
            maxLength={10}
            required
          />

          {/* Resolved account name — auto-filled, read-only */}
          <div className="relative">
            <input
              type="text"
              placeholder="Account Name"
              value={resolving ? 'Verifying…' : form.account_name}
              readOnly
              className="input-field bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            {resolving && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {resolveError && (
            <p className="text-red-500 text-sm">{resolveError}</p>
          )}

          {/* Security note */}
          <p className="text-xs text-center text-gray-400 pt-1">
            🔒 Your bank details are encrypted and stored securely
          </p>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="btn-primary mt-2"
            disabled={saving || resolving || !form.account_name}
          >
            {saving ? 'Saving…' : 'Save & Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
