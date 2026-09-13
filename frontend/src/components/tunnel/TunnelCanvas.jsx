import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { TunnelScene } from './TunnelScene';
import { useThreeThemeColors } from './useThreeThemeColors';

function CanvasLoader() {
  return null;
}

export function TunnelCanvas({ progress = 0, isMobile = false }) {
  const colors = useThreeThemeColors();

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ width: '100%', height: '100%', minHeight: '100vh' }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 58, near: 0.1, far: 110 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: 'default'
        }}
        onCreated={({ gl }) => {
          if (gl?.domElement) {
            gl.domElement.addEventListener(
              'webglcontextlost',
              (event) => {
                event.preventDefault();
              },
              false
            );
          }
        }}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <TunnelScene
            progress={progress}
            colors={colors}
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
