import React, { useState, useEffect } from 'react';

export function TiltCard3D({ children, className = '', maxTilt = 4, disabled = false }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [canTilt, setCanTilt] = useState(true);

  useEffect(() => {
    // Disable on touch-only devices or if reduced-motion is requested
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCanTilt(!isTouch && !reduced);
  }, []);

  const isEnabled = canTilt && !disabled;

  const handleMouseMove = (e) => {
    if (!isEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Gentle perspective tilt (max ~4 degrees)
    const rotX = -(y / rect.height) * maxTilt;
    const rotY = (x / rect.width) * maxTilt;
    setTilt({ x: rotX, y: rotY });
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
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`h-full transition-transform duration-200 ease-out ${className}`}
      style={{
        perspective: isEnabled ? '1000px' : 'none',
        transform:
          isEnabled && isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(4px)`
            : 'none',
        transformStyle: isEnabled ? 'preserve-3d' : 'flat'
      }}
    >
      {children}
    </div>
  );
}
