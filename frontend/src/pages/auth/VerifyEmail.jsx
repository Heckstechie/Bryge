import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OTP_LENGTH = 6;

export default function VerifyEmail({ vendorFlow = false }) {
  const location   = useLocation();
  const navigate   = useNavigate();
  const { afterVerify } = useAuth();

  const email      = location.state?.email || '';
  const [digits, setDigits]     = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resendCd, setResendCd] = useState(0);  // countdown seconds
  const inputs = useRef([]);

  // Redirect if arrived without email
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setTimeout(() => setResendCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCd]);

  function onDigitChange(index, value) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = clean;
    setDigits(next);
    setError('');
    if (clean && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function onPaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function onSubmit(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < OTP_LENGTH) return setError('Enter the complete 6-digit code');

    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.verifyEmail({ email, code });
      afterVerify(data.user, data.access_token, data.refresh_token);
      navigate(vendorFlow ? '/vendor/dashboard' : '/shop');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    try {
      await authApi.resendCode({ email });
      setResendCd(60);
    } catch { /* no-op */ }
  }

  return (
    <AuthLayout>
      <div className="bg-white rounded-3xl px-6 py-8 shadow-sm text-center">
        {/* Envelope illustration */}
        <div className="text-6xl mb-4">✉️</div>

        <h1 className="text-2xl font-bold text-navy mb-1">Check your email</h1>
        <p className="text-sm text-gray-500 mb-1">
          Enter the 6-digit code we just sent to
        </p>
        <p className="text-sm font-semibold text-navy mb-8">{email}</p>

        <form onSubmit={onSubmit}>
          {/* OTP boxes */}
          <div className="flex justify-center gap-2 mb-6" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => onDigitChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                className="otp-input"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>

        <div className="mt-5">
          {resendCd > 0 ? (
            <p className="text-sm text-gray-400">Resend code in {resendCd}s</p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="text-sm text-navy underline underline-offset-2"
            >
              Didn&apos;t get code? <span className="font-semibold">Tap to resend</span>
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
