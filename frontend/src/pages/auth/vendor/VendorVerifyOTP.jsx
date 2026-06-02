import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/api';
import { BrygeLogo, NavyButton, OTPBoxes, EnvelopeIllustration } from './VendorShared';

export default function VendorVerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';

  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resent, setResent]     = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.verifyEmail({ email, code });
      // Don't attempt auto-login here — just redirect to vendor login
      // with a success notice. VendorLogin handles status-based routing.
      navigate('/vendor/login', {
        replace: true,
        state: { notice: '✓ Email verified! Please log in to continue.', email },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setResent(false);
    setError('');
    try {
      await authApi.resendCode({ email });
      setResent(true);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="flex-none px-6 pt-8 flex justify-center">
        <BrygeLogo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">

          <EnvelopeIllustration />

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-navy mb-3">
              Check your email
            </h1>
            <p className="text-[#8A9BB0] text-sm leading-relaxed">
              Enter the 6-digit code we just sent to{' '}
              <span className="font-semibold text-navy">{email || 'your email'}</span>
              {' '}to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
            <OTPBoxes value={code} onChange={setCode} />

            {error && (
              <p className="text-red-500 text-sm -mt-2">{error}</p>
            )}
            {resent && (
              <p className="text-[#3D6B4F] text-sm -mt-2 font-medium">
                ✓ New code sent!
              </p>
            )}

            <div className="w-full">
              <NavyButton type="submit" disabled={loading || code.length < 6}>
                {loading ? 'Verifying…' : 'Continue'}
              </NavyButton>
            </div>
          </form>

          <p className="text-[#8A9BB0] text-sm">
            Didn't get code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-blue-600 font-medium hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Tap to resend'}
            </button>
          </p>

        </div>
      </main>
    </div>
  );
}
