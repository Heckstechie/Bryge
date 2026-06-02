import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../../services/api';
import { BrygeLogo, PillInput, NavyButton, ToggleEye, LockKeyIllustration } from './VendorShared';

export default function VendorResetPassword() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') || '';

  const [form, setForm] = useState({ password: '', password_confirm: '' });
  const [show, setShow] = useState({ pw: false, confirm: false });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  function onChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8)          { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(form.password))      { setError('Password must contain an uppercase letter.'); return; }
    if (!/[0-9]/.test(form.password))      { setError('Password must contain a number.'); return; }
    if (form.password !== form.password_confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({
        token,
        password:         form.password,
        password_confirm: form.password_confirm,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
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

          {done ? (
            <>
              <div>
                <h1 className="text-3xl font-bold text-navy mb-3">Password reset!</h1>
                <p className="text-[#8A9BB0] text-sm">
                  Your password has been updated. You can now log in.
                </p>
              </div>
              <NavyButton type="button" onClick={() => navigate('/vendor/login')}>
                Back to Login
              </NavyButton>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-bold text-navy mb-3">Reset Password</h1>
                <p className="text-[#8A9BB0] text-sm">Enter your new password</p>
              </div>

              <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
                <div className="relative">
                  <PillInput
                    type={show.pw ? 'text' : 'password'}
                    name="password"
                    placeholder="New Password"
                    value={form.password}
                    onChange={onChange}
                    autoComplete="new-password"
                    extraClass="pr-12"
                  />
                  <ToggleEye show={show.pw} onToggle={() => setShow(s => ({ ...s, pw: !s.pw }))} />
                </div>

                <div className="relative">
                  <PillInput
                    type={show.confirm ? 'text' : 'password'}
                    name="password_confirm"
                    placeholder="Confirm Password"
                    value={form.password_confirm}
                    onChange={onChange}
                    autoComplete="new-password"
                    extraClass="pr-12"
                  />
                  <ToggleEye show={show.confirm} onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))} />
                </div>

                {error && <p className="text-red-500 text-sm -mt-1">{error}</p>}

                <NavyButton type="submit" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </NavyButton>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
