import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function RegisterPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (passwordInput !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.register(usernameInput.trim(), passwordInput);
      setSuccessMsg('Operator registered successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Username may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between font-sans relative overflow-hidden">
      <header className="w-full h-16 flex items-center justify-between px-6 max-w-7xl mx-auto z-10">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-primary tracking-tight">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            security
          </span>
          <span>LOG AI</span>
        </Link>
        <div className="text-text-muted text-xs font-mono">SOC Operator Provisioning</div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-border-muted shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container border border-border-muted mb-4 text-primary shadow-sm">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                person_add
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Operator Registration</h1>
            <p className="text-xs text-text-muted">Create a new SOC Operator account.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-2" htmlFor="username">
                New Operator Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="operator_name"
                className="input-cyber w-full rounded-lg py-2.5 px-3 text-xs font-mono bg-surface-dim border-border-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="input-cyber w-full rounded-lg py-2.5 px-3 text-xs font-mono bg-surface-dim border-border-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-2" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-cyber w-full rounded-lg py-2.5 px-3 text-xs font-mono bg-surface-dim border-border-muted"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full rounded-lg py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 mt-6"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-text-dim text-[10px] font-mono border-t border-border-muted/40">
        © 2026 LOG AI Security Engine. Authorized Personnel Only.
      </footer>
    </div>
  );
}
