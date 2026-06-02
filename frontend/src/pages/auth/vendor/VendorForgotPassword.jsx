import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../../services/api';
import { BrygeLogo, PillInput, NavyButton, LockKeyIllustration } from './VendorShared';

export default function VendorForgotPassword() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="flex-none px-6 pt-8 flex justify-center">
        <BrygeLogo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">

          <LockKeyIllustration />

          {sent ? (
            <>
              <div>
                <h1 className="text-3xl font-bold text-navy mb-3">Email sent!</h1>
                <p className="text-[#8A9BB0] text-sm leading-relaxed">
                  Check your inbox for a password reset link. It expires in 1 hour.
                </p>
              </div>
              <Link
                to="/vendor/login"
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                ← Back to login
              </Link>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-bold text-navy mb-3">Forgot Password</h1>
                <p className="text-[#8A9BB0] text-sm leading-relaxed">
                  Enter your email account to reset password
                </p>
              </div>

              <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
                <PillInput
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  required
                />
                {error && <p className="text-red-500 text-sm -mt-1">{error}</p>}
                <NavyButton type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Reset Password'}
                </NavyButton>
              </form>

              <Link
                to="/vendor/login"
                className="text-[#8A9BB0] text-sm hover:text-navy transition-colors"
              >
                ← Back to login
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
