import React, { useState, useEffect, useRef } from 'react';

export function TiltCard3D({
  children,
  className = '',
  maxTilt = 7,
  disabled = false
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [canTilt, setCanTilt] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    // Only disable if user explicitly prefers reduced motion, or if the device has NO hover capability
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noHover = window.matchMedia('(hover: none)').matches;
    setCanTilt(!reduced && !noHover);
  }, []);

  const isEnabled = canTilt && !disabled;

  const handleMouseMove = (e) => {
    if (!isEnabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Smooth normalized angle across [-maxTilt, +maxTilt]
    const rotX = -((y / (rect.height / 2)) * maxTilt);
    const rotY = (x / (rect.width / 2)) * maxTilt;

    setTilt({
      x: Math.max(-maxTilt, Math.min(maxTilt, rotX)),
      y: Math.max(-maxTilt, Math.min(maxTilt, rotY))
    });
  };

  const handleMouseEnter = () => {
    if (isEnabled) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`h-full ${className}`}
      style={{
        perspective: isEnabled ? '1000px' : 'none',
        transformStyle: isEnabled ? 'preserve-3d' : 'flat'
      }}
    >
      <div
        className="h-full w-full transition-transform ease-out"
        style={{
          transform:
            isEnabled && isHovered
              ? `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateZ(8px)`
              : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transitionDuration: isHovered ? '80ms' : '400ms',
          transformStyle: isEnabled ? 'preserve-3d' : 'flat'
        }}
      >
        {children}
      </div>
    </div>
  );
}
