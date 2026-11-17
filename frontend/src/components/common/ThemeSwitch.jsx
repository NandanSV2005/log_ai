import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Tactile sliding theme toggle between MOCHA (dark) and POWDER (light).
 */
export function ThemeSwitch({ compact = false, className = '' }) {
  const { theme, setTheme } = useTheme();
  const isSage = theme === 'sage';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isSage}
      aria-label={`Switch theme (currently ${isSage ? 'Powder light' : 'Mocha dark'})`}
      onClick={() => setTheme(isSage ? 'dark' : 'sage')}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-border-muted bg-surface-lowest/95 p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-primary/60 active:scale-[0.96] cursor-pointer focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${className}`}
    >
      {/* Sliding Track Background */}
      <div className="relative flex items-center w-[76px] h-7 rounded-full bg-surface-dim/90 px-1.5 justify-between border border-border-muted/60">
        <span
          className={`material-symbols-outlined text-[13px] z-10 transition-colors duration-200 ${
            !isSage ? 'text-surface-lowest' : 'text-text-dim'
          }`}
          aria-hidden="true"
        >
          dark_mode
        </span>
        <span
          className={`material-symbols-outlined text-[13px] z-10 transition-colors duration-200 ${
            isSage ? 'text-surface-lowest' : 'text-text-dim'
          }`}
          aria-hidden="true"
        >
          light_mode
        </span>

        {/* Animated Sliding Thumb */}
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          className={`absolute top-0.5 bottom-0.5 w-[34px] rounded-full bg-gradient-to-b from-primary-fixed to-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_var(--color-border-glow)] ${
            isSage ? 'right-0.5' : 'left-0.5'
          }`}
        />
      </div>

      {!compact && (
        <span className="pr-2 font-mono text-[10px] font-bold tracking-wider uppercase text-text-primary group-hover:text-primary transition-colors">
          {isSage ? 'POWDER' : 'MOCHA'}
        </span>
      )}
    </button>
  );
}
