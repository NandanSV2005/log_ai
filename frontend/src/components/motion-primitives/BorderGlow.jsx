import { motion } from 'motion/react';
import React from 'react';
import { cn } from '../../lib/utils';

export function BorderGlow({
  children,
  className,
  glowColor = 'var(--color-primary)',
  borderRadius = '1rem',
}) {
  return (
    <div className={cn('relative p-[1px] group overflow-hidden', className)} style={{ borderRadius }}>
      <motion.div
        className="absolute inset-0 opacity-30 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 70%)`,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className="relative z-10 w-full h-full rounded-[inherit]">
        {children}
      </div>
    </div>
  );
}
