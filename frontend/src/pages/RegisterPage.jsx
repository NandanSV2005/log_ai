import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { StitchBrandMark } from '../components/common/StitchBrandMark';

export function RegisterPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleInput, setRoleInput] = useState('ANALYST');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { registerUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!usernameInput || !passwordInput || !confirmPassword) {
      setErrorMsg('Please fill in all required account fields.');
      return;
    }

    if (passwordInput !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (passwordInput.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser({
        username: usernameInput,
        password: passwordInput,
        role: roleInput,
        adminSecretKey: secretKeyInput,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Operator account registered successfully!');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (err) {
      const msg = err && err.message ? err.message : err;
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Brand Header Nav */}
      <header className="w-full h-16 flex items-center justify-between px-6 max-w-7xl mx-auto z-10">
        <Link to="/" className="flex items-center space-x-2 focus:outline-none rounded px-1 py-0.5">
          <StitchBrandMark size={28} />
          <span className="font-mono text-sm tracking-wider font-bold uppercase text-text-primary">
            LOG <span className="text-primary">//</span> AI
          </span>
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
          className="px-3 py-1.5 rounded-lg border border-border-muted bg-surface-dim text-xs font-mono font-bold flex items-center gap-2 text-text-primary"
        >
          <span className="material-symbols-outlined text-sm">palette</span>
          <span>{theme === 'dark' ? 'CYBER VOID' : 'SAGE GREEN'}</span>
        </button>
      </header>

      {/* Main Registration Form Container */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 z-10">
        <div className="glass-panel w-full max-w-md rounded-2xl p-4 sm:p-8 border border-border-muted shadow-2xl relative space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-dim border border-border-muted font-mono text-[10px] text-text-muted uppercase tracking-widest">
              [ ACCOUNT PROVISIONING ]
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-text-muted font-sans">
              Register a new security operator account to access sovereign SOC telemetry.
            </p>
          </div>

          {/* Controlled State 1: Account Created Success Confirmation */}
          {successMsg ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <h2 className="text-lg font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  ACCOUNT CREATED
                </h2>
                <p className="text-xs text-text-muted leading-relaxed font-sans">
                  {successMsg}
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full rounded-xl py-3.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg touch-target"
              >
                <span>Continue to Sign In</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ) : (
            /* Controlled State 2: Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-bold text-text-primary mb-1.5" htmlFor="username">
                  Operator Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="analyst_smith"
                  autoComplete="username"
                  className="input-cyber w-full rounded-xl py-3 px-3.5 text-xs font-mono bg-surface-dim border-border-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-primary mb-1.5" htmlFor="password">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="input-cyber w-full rounded-xl py-3 pl-3.5 pr-10 text-xs font-mono bg-surface-dim border-border-muted focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-primary mb-1.5" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    className="input-cyber w-full rounded-xl py-3 pl-3.5 pr-10 text-xs font-mono bg-surface-dim border-border-muted focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full rounded-xl py-3.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 mt-6 touch-target"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs font-mono text-text-muted">
                Already registered?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>

      <footer className="w-full py-4 text-center text-text-dim text-[10px] font-mono border-t border-border-muted/40">
        © 2026 STITCH Security Engine. Authorized Personnel Only.
      </footer>
    </div>
  );
}
