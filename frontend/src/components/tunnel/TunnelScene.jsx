import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TransformingPacket } from './TransformingPacket';
import { TunnelCheckpointGates } from './TunnelCheckpointGates';

export function TunnelScene({ progress = 0, colors, isMobile = false }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  // Camera spline / tunnel bounds
  // Z starts at +7.0 (Hero / Raw Ingest) and travels down to -95 (Stage 06 Verdict)
  const START_Z = 7.0;
  const END_Z = -93.0;

  // Track target vs current camera Z for silky smooth interpolation
  const currentCameraZ = useRef(START_Z);

  // Generate tunnel structural ribs
  const ribCount = isMobile ? 32 : 55;
  const ribs = useMemo(() => {
    const items = [];
    const step = (START_Z + 15 - (END_Z - 10)) / ribCount;
    for (let i = 0; i < ribCount; i++) {
      const z = START_Z + 10 - i * step;
      items.push({ id: i, z });
    }
    return items;
  }, [ribCount]);

  // Data stream particles floating in corridor
  const particleCount = isMobile ? 120 : 380;
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Cylinder distribution around tunnel radius ~3.2
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.4 + Math.random() * 1.5;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.sin(angle) * radius;
      arr[i * 3 + 2] = START_Z + 10 - Math.random() * (START_Z - END_Z + 20);
    }
    return arr;
  }, [particleCount]);

  // Mouse move listener for tactile parallax
  const handlePointerMove = (e) => {
    if (isMobile) return;
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  useFrame((state, delta) => {
    // Target camera Z based on scroll progress
    const targetZ = START_Z + progress * (END_Z - START_Z);

    // Smooth lerp camera position
    currentCameraZ.current = THREE.MathUtils.lerp(
      currentCameraZ.current,
      targetZ,
      delta * 5.0
    );

    // Parallax mouse offsets
    const targetX = mouse.current.x * 0.4;
    const targetY = mouse.current.y * 0.25;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 3.0);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 3.0);
    camera.position.z = currentCameraZ.current;

    // Look slightly ahead along tunnel
    const lookAtZ = currentCameraZ.current - 12;
    camera.lookAt(0, 0, lookAtZ);
  });

  // Log packet travels ~5.2 units in front of the camera
  const packetZ = currentCameraZ.current - 5.2;

  return (
    <group onPointerMove={handlePointerMove}>
      {/* Dynamic Lighting tuned to active theme */}
      <ambientLight color={colors.ambient} intensity={colors.isSage ? 1.4 : 0.9} />
      <directionalLight
        position={[0, 8, currentCameraZ.current + 2]}
        color={colors.primary}
        intensity={colors.isSage ? 1.6 : 1.2}
      />
      <pointLight
        position={[0, 0, packetZ]}
        color={colors.secondary}
        intensity={2.2}
        distance={14}
        decay={2}
      />
      <pointLight
        position={[0, 2, packetZ - 8]}
        color={colors.tertiary}
        intensity={1.8}
        distance={16}
        decay={2}
      />

      {/* Atmospheric Tunnel Fog */}
      <fog attach="fog" args={[colors.fog.getHex(), 8, 48]} />

      {/* Repeating Cybernetic Tunnel Ribs */}
      {ribs.map((rib) => (
        <group key={rib.id} position={[0, 0, rib.z]}>
          {/* Hexagonal Rib Ring */}
          <mesh>
            <ringGeometry args={[3.25, 3.32, 6]} />
            <meshBasicMaterial
              color={colors.primary}
              transparent
              opacity={0.28}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Sub Rib Accent */}
          <mesh position={[0, 0, 0.05]}>
            <ringGeometry args={[3.38, 3.42, 6]} />
            <meshBasicMaterial
              color={colors.secondary}
              transparent
              opacity={0.14}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Lateral Floor Rail Segments */}
          <mesh position={[-1.6, -2.6, 0]}>
            <boxGeometry args={[0.08, 0.08, 1.8]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.3} />
          </mesh>
          <mesh position={[1.6, -2.6, 0]}>
            <boxGeometry args={[0.08, 0.08, 1.8]} />
            <meshBasicMaterial color={colors.secondary} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Long Guide Rails along the corridor */}
      {/* Ceiling Rail */}
      <mesh position={[0, 3.25, -45]}>
        <boxGeometry args={[0.06, 0.06, 120]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={0.4} />
      </mesh>
      {/* Floor Guide Rail Left */}
      <mesh position={[-1.2, -2.65, -45]}>
        <boxGeometry args={[0.04, 0.04, 120]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.35} />
      </mesh>
      {/* Floor Guide Rail Right */}
      <mesh position={[1.2, -2.65, -45]}>
        <boxGeometry args={[0.04, 0.04, 120]} />
        <meshBasicMaterial color={colors.secondary} transparent opacity={0.35} />
      </mesh>

      {/* Checkpoint Architectural Portals */}
      <TunnelCheckpointGates colors={colors} progress={progress} />

      {/* Transforming Log Packet */}
      <TransformingPacket
        progress={progress}
        colors={colors}
        position={[0, 0, packetZ]}
      />

      {/* Ingestion Data Stream Particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={isMobile ? 0.06 : 0.08}
          color={colors.secondary}
          transparent
          opacity={0.5}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
