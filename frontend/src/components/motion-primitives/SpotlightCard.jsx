import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import React, { useRef } from 'react';
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
  const cardRef = useRef(null);
  const mouseX = useMotionValue(-spotlightSize);
  const mouseY = useMotionValue(-spotlightSize);

  function handleMouseMove(e) {
    const { currentTarget, clientX, clientY } = e;
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    mouseX.set(x);
    mouseY.set(y);
    currentTarget.style.setProperty('--mouse-x', `${x}px`);
    currentTarget.style.setProperty('--mouse-y', `${y}px`);

    if (!disableTilt && rect.width > 0 && rect.height > 0 && cardRef.current) {
      const normX = (x / rect.width - 0.5) * 2;
      const normY = (y / rect.height - 0.5) * 2;
      const rx = (-normY * maxTilt).toFixed(2);
      const ry = (normX * maxTilt).toFixed(2);
      cardRef.current.style.transition = 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)';
      cardRef.current.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.006, 1.006, 1.006)`;
    }

    if (externalMouseMove) externalMouseMove(e);
  }

  function handleMouseLeave(e) {
    mouseX.set(-spotlightSize);
    mouseY.set(-spotlightSize);
    if (!disableTilt && cardRef.current) {
      cardRef.current.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
      cardRef.current.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (externalMouseLeave) externalMouseLeave(e);
  }

  const Component = motion[as] || motion.div;

  const tiltStyle = !disableTilt
    ? {
        transform: 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        ...externalStyle,
      }
    : externalStyle;

  return (
    <Component
      ref={cardRef}
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
