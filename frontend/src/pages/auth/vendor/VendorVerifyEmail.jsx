import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/api';
import { BrygeLogo, NavyButton, EnvelopeIllustration } from './VendorShared';

export default function VendorVerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [resent, setResent]     = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState('');

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    setResendError('');
    setResent(false);
    try {
      await authApi.resendCode({ email });
      setResent(true);
    } catch (err) {
      setResendError(err.response?.data?.message || 'Could not resend. Please try again.');
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

          {/* Illustration */}
          <EnvelopeIllustration verified={false} />

          {/* Heading */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-4">
              Verify your email
            </h1>
            <p className="text-[#8A9BB0] text-base leading-relaxed">
              We sent a 6-digit verification code to{' '}
              <span className="font-semibold text-navy">{email || 'your email'}</span>.
              {' '}Click below to enter it.
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-[#E2DED8]" />

          {/* Resend */}
          <div className="text-sm">
            {resent ? (
              <p className="text-[#3D6B4F] font-medium">
                ✓ Verification email resent!
              </p>
            ) : (
              <>
                <p className="text-[#8A9BB0] mb-1">Did not receive the email?</p>
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-blue-600 hover:underline font-medium disabled:opacity-50"
                >
                  {resending ? 'Resending…' : 'Click here to resend'}
                </button>
              </>
            )}
            {resendError && (
              <p className="text-red-500 text-xs mt-2">{resendError}</p>
            )}
          </div>

          {/* Continue — navigates to OTP entry screen */}
          <div className="w-full pt-2">
            <NavyButton
              type="button"
              onClick={() => navigate('/vendor/verify-otp', { state: { email } })}
            >
              Continue
            </NavyButton>
          </div>

        </div>
      </main>
    </div>
  );
}
