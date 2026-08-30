import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await loginUser(usernameInput.trim(), passwordInput);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Brand Header Nav */}
      <header className="w-full h-16 flex items-center justify-between px-6 max-w-7xl mx-auto z-10">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-primary tracking-tight">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            security
          </span>
          <span>LOG AI</span>
        </Link>
        <div className="text-text-muted text-xs font-mono">SOC Access Only</div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-border-muted shadow-2xl relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-container border border-border-muted mb-4 text-primary shadow-sm">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Command Center Login</h1>
            <p className="text-xs text-text-muted">Authenticate with JWT credentials to access SOC telemetry.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-2" htmlFor="username">
                Operator ID / Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-lg">
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="admin"
                  className="input-cyber w-full rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono bg-surface-dim border-border-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-2" htmlFor="password">
                Access Token / Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-lg">
                  key
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-cyber w-full rounded-lg py-2.5 pl-10 pr-4 text-xs font-mono bg-surface-dim border-border-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full rounded-lg py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Secure Login</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted">
            Don't have an operator account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Register New Operator
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
