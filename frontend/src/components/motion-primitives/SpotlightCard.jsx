import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'var(--color-border-glow)',
  spotlightSize = 350,
  disableTilt = false,
  maxTilt = 4.5,
  as = 'div',
  onMouseMove: externalMouseMove,
  onMouseLeave: externalMouseLeave,
  style: externalStyle,
  ...props
}) {
  const mouseX = useMotionValue(-spotlightSize);
  const mouseY = useMotionValue(-spotlightSize);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, active: false });

  function handleMouseMove(e) {
    const { currentTarget, clientX, clientY } = e;
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);
    currentTarget.style.setProperty('--mouse-x', `${x}px`);
    currentTarget.style.setProperty('--mouse-y', `${y}px`);

    if (!disableTilt && rect.width > 0 && rect.height > 0) {
      const normX = (x / rect.width - 0.5) * 2; // -1 to 1
      const normY = (y / rect.height - 0.5) * 2; // -1 to 1
      setTilt({
        rotateX: Number((-normY * maxTilt).toFixed(2)),
        rotateY: Number((normX * maxTilt).toFixed(2)),
        active: true,
      });
    }

    if (externalMouseMove) externalMouseMove(e);
  }

  function handleMouseLeave(e) {
    mouseX.set(-spotlightSize);
    mouseY.set(-spotlightSize);
    setTilt({ rotateX: 0, rotateY: 0, active: false });
    if (externalMouseLeave) externalMouseLeave(e);
  }

  const Component = motion[as] || motion.div;

  const tiltStyle = !disableTilt
    ? {
        transform: tilt.active
          ? `perspective(1100px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.006, 1.006, 1.006)`
          : 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: tilt.active
          ? 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)'
          : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
        ...externalStyle,
      }
    : externalStyle;

  return (
    <Component
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className={cn('relative overflow-hidden group', className)}
      {...props}
    >
      {/* 1px Radial Border Spotlight Ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-20 rounded-[inherit]"
        style={{
          padding: '1.25px',
          background:
            'radial-gradient(350px circle at var(--mouse-x, -350px) var(--mouse-y, -350px), var(--color-primary), transparent 100%)',
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Ambient Surface Glow Spotlight */}
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
