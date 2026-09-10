import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import React from 'react';
import { cn } from '../../lib/utils';

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'var(--color-primary-glow, rgba(167, 139, 250, 0.18))',
  spotlightSize = 350,
  as = 'div',
  ...props
}) {
  const mouseX = useMotionValue(-spotlightSize);
  const mouseY = useMotionValue(-spotlightSize);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  function handleMouseLeave() {
    mouseX.set(-spotlightSize);
    mouseY.set(-spotlightSize);
  }

  const Component = motion[as] || motion.div;

  return (
    <Component
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative overflow-hidden group', className)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10 rounded-[inherit]"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${spotlightSize}px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </Component>
  );
}
