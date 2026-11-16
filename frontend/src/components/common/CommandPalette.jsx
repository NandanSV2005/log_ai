import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export function CommandPalette({ isOpen, onClose, airGapped, setAirGapped }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        group: 'Navigation',
        label: 'SOC Command Center',
        hint: '/dashboard',
        icon: 'dashboard',
        action: () => navigate('/dashboard'),
      },
      {
        id: 'nav-threat-intel',
        group: 'Navigation',
        label: 'Threat Intelligence & Geo-IP Map',
        hint: '/threat-intel',
        icon: 'security',
        action: () => navigate('/threat-intel'),
      },
      {
        id: 'nav-log-explorer',
        group: 'Navigation',
        label: 'Log Explorer & OCSF Query Studio',
        hint: '/log-explorer',
        icon: 'database',
        action: () => navigate('/log-explorer'),
      },
      {
        id: 'nav-forensics',
        group: 'Navigation',
        label: 'Digital Forensics & Merkle Chain',
        hint: '/forensics',
        icon: 'search_insights',
        action: () => navigate('/forensics'),
      },
      {
        id: 'nav-rule-studio',
        group: 'Navigation',
        label: 'Rule Studio & Detection Sandbox',
        hint: '/rule-studio',
        icon: 'terminal',
        action: () => navigate('/rule-studio'),
      },
      {
        id: 'nav-settings',
        group: 'Navigation',
        label: 'System Settings & Polling',
        hint: '/settings',
        icon: 'settings',
        action: () => navigate('/settings'),
      },
      {
        id: 'act-export-csv',
        group: 'Actions',
        label: 'Export Forensic CSV Audit Report',
        hint: 'CSV',
        icon: 'download',
        action: async () => {
          try {
            await api.exportCsv();
            showToast({
              variant: 'success',
              title: 'Forensic Export Complete',
              message: 'CSV threat report downloaded.',
            });
          } catch (err) {
            showToast({
              variant: 'error',
              title: 'Export Failed',
              message: err.message || 'Could not export CSV.',
            });
          }
        },
      },
      {
        id: 'act-toggle-theme',
        group: 'Preferences',
        label: `Switch Theme to ${theme === 'dark' ? 'Powder (Light)' : 'Mocha (Dark)'}`,
        hint: theme === 'dark' ? 'MOCHA -> POWDER' : 'POWDER -> MOCHA',
        icon: 'palette',
        action: () => setTheme(theme === 'dark' ? 'sage' : 'dark'),
      },
      {
        id: 'act-toggle-airgap',
        group: 'Preferences',
        label: `Switch AI Mode to ${airGapped ? 'Live Gemini AI' : 'Air-Gapped Local'}`,
        hint: airGapped ? 'AIR-GAPPED' : 'LIVE AI',
        icon: airGapped ? 'cloud_done' : 'shield_locked',
        action: () => setAirGapped(!airGapped),
      },
    ],
    [navigate, theme, setTheme, airGapped, setAirGapped, showToast]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.hint.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
        );
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="SOC Command Palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-surface border border-border-muted shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-muted bg-surface-dim">
          <span className="material-symbols-outlined text-primary text-lg">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Jump to SOC view, export forensic CSV, or toggle mode..."
            className="flex-1 bg-transparent text-sm font-mono text-text-primary placeholder:text-text-dim focus:outline-none"
            aria-label="Command search"
          />
          <kbd className="px-2 py-0.5 rounded bg-surface border border-border-muted font-mono text-[10px] text-text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left font-mono text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/15 text-primary border border-primary/35'
                      : 'text-text-primary hover:bg-surface-hover border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-base shrink-0">
                      {cmd.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold truncate">{cmd.label}</div>
                      <div className="text-[10px] text-text-dim">{cmd.group}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-dim border border-border-muted text-text-muted shrink-0">
                    {cmd.hint}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-6 text-center font-mono text-xs text-text-muted">
              No matching SOC commands for &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border-muted bg-surface-dim flex items-center justify-between font-mono text-[10px] text-text-dim">
          <span>↑↓ Navigate • ↵ Execute</span>
          <span>LOG // AI COMMAND PALETTE</span>
        </div>
      </div>
    </div>
  );
}
