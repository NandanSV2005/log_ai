import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { theme, setTheme } = useTheme();
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
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials and try again.');
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
          <span className="font-serif text-text-primary">LOG AI</span>
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'sage' : 'dark')}
          className="px-3 py-1.5 rounded-lg border border-border-muted bg-surface-dim text-xs font-mono font-bold flex items-center gap-2 text-text-primary"
        >
          <span className="material-symbols-outlined text-sm">palette</span>
          <span>{theme === 'dark' ? 'CYBER VOID' : 'SAGE GREEN'}</span>
        </button>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-border-muted shadow-2xl relative space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-dim border border-border-muted font-mono text-[10px] text-text-muted uppercase tracking-widest">
              [ SECURE ACCESS // INTELLIGENCE PLATFORM ]
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Access Intelligence
            </h1>
            <p className="text-xs text-text-muted font-sans">
              Sign in to your security intelligence workspace with authenticated operator credentials.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2">
              <span className="material-symbols-outlined text-sm mt-0.5">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-text-primary mb-1.5" htmlFor="username">
                Operator Username / ID
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
                  autoComplete="username"
                  className="input-cyber w-full rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono bg-surface-dim border-border-muted focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-text-primary mb-1.5" htmlFor="password">
                Password / Access Token
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
                  autoComplete="current-password"
                  className="input-cyber w-full rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono bg-surface-dim border-border-muted focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full rounded-xl py-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 mt-6"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs font-mono text-text-muted">
            Need an operator account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Create Account
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
