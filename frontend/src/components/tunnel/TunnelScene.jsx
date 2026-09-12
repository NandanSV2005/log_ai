import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TransformingPacket } from './TransformingPacket';
import { TunnelCheckpointGates } from './TunnelCheckpointGates';

export function TunnelScene({ progress = 0, colors, isMobile = false }) {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const pulseRef = useRef(0);

  // Camera spline / tunnel bounds
  // Z starts at +7.0 (Hero / Raw Ingest) and travels down to -95 (Stage 06 Verdict)
  const START_Z = 7.0;
  const END_Z = -93.0;

  // Track target vs current camera Z for silky smooth interpolation
  const currentCameraZ = useRef(START_Z);

  // Generate tunnel structural ribs
  const ribCount = isMobile ? 28 : 46;
  const ribs = useMemo(() => {
    const items = [];
    const totalDist = START_Z + 12 - (END_Z - 10);
    const step = totalDist / ribCount;
    for (let i = 0; i < ribCount; i++) {
      const z = START_Z + 8 - i * step;
      items.push({ id: i, z });
    }
    return items;
  }, [ribCount]);

  // Data stream particles floating in corridor
  const particleCount = isMobile ? 100 : 260;
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.6 + Math.random() * 1.5;
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
    const t = state.clock.getElapsedTime();
    pulseRef.current = t;

    // Target camera Z based on scroll progress
    const targetZ = START_Z + progress * (END_Z - START_Z);

    // Smooth lerp camera position
    currentCameraZ.current = THREE.MathUtils.lerp(
      currentCameraZ.current,
      targetZ,
      delta * 5.0
    );

    // Camera offset: shift slightly right when at Hero (progress < 0.15) to leave room for text
    const heroShiftX = Math.max(0, 1 - progress * 6) * -0.65;
    const targetX = heroShiftX + (mouse.current.x * 0.35);
    const targetY = (mouse.current.y * 0.22);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 3.0);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 3.0);
    camera.position.z = currentCameraZ.current;

    // Look slightly ahead along tunnel
    const lookAtX = heroShiftX * 0.4;
    const lookAtZ = currentCameraZ.current - 12;
    camera.lookAt(lookAtX, 0, lookAtZ);
  });

  // Log packet travels ~5.0 units in front of the camera
  const packetZ = currentCameraZ.current - 5.0;

  return (
    <group onPointerMove={handlePointerMove}>
      {/* Dynamic Lighting */}
      <ambientLight color={colors.ambient} intensity={colors.isSage ? 1.8 : 1.2} />
      <directionalLight
        position={[4, 10, currentCameraZ.current + 4]}
        color={colors.primary}
        intensity={2.0}
      />
      <directionalLight
        position={[-4, -6, currentCameraZ.current]}
        color={colors.secondary}
        intensity={1.2}
      />
      <pointLight
        position={[0, 0, packetZ]}
        color={colors.secondary}
        intensity={3.0}
        distance={15}
        decay={2}
      />
      <pointLight
        position={[0, 2, packetZ - 10]}
        color={colors.tertiary}
        intensity={2.5}
        distance={18}
        decay={2}
      />

      {/* Atmospheric Tunnel Fog */}
      <fog attach="fog" args={[colors.fog.getHex(), 10, 55]} />

      {/* ========================================================================= */}
      {/* 1. SOLID CYBERNETIC TUNNEL HULL (Guarantees visible corridor in all themes)*/}
      {/* ========================================================================= */}
      <group position={[0, 0, -45]} rotation={[0, 0, Math.PI / 6]}>
        {/* Outer Conduit Shell */}
        <mesh>
          <cylinderGeometry args={[3.8, 3.8, 120, 6, 30, true]} />
          <meshStandardMaterial
            color={colors.tunnelHull}
            roughness={0.6}
            metalness={0.4}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Cybernetic Wireframe Grid Over Conduit Walls */}
        <mesh scale={[0.995, 1, 0.995]}>
          <cylinderGeometry args={[3.8, 3.8, 120, 12, 60, true]} />
          <meshBasicMaterial
            color={colors.tunnelWire}
            wireframe
            transparent
            opacity={colors.isSage ? 0.28 : 0.22}
            side={THREE.BackSide}
          />
        </mesh>
      </group>

      {/* ========================================================================= */}
      {/* 2. VOLUMETRIC HEXAGONAL STRUCTURAL RIBS                                    */}
      {/* ========================================================================= */}
      {ribs.map((rib, idx) => {
        const isAccent = idx % 3 === 0;
        const ribColor = isAccent ? colors.secondary : colors.primary;

        return (
          <group key={rib.id} position={[0, 0, rib.z]}>
            {/* Volumetric Hexagonal Torus Arch */}
            <mesh rotation={[0, 0, Math.PI / 6]}>
              <torusGeometry args={[3.6, 0.05, 8, 6]} />
              <meshStandardMaterial
                color={ribColor}
                emissive={ribColor}
                emissiveIntensity={isAccent ? 0.7 : 0.3}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>

            {/* Glowing Floor Support Brackets */}
            <mesh position={[-1.7, -2.8, 0]}>
              <boxGeometry args={[0.1, 0.35, 0.2]} />
              <meshStandardMaterial
                color={ribColor}
                emissive={ribColor}
                emissiveIntensity={0.5}
              />
            </mesh>
            <mesh position={[1.7, -2.8, 0]}>
              <boxGeometry args={[0.1, 0.35, 0.2]} />
              <meshStandardMaterial
                color={ribColor}
                emissive={ribColor}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        );
      })}

      {/* ========================================================================= */}
      {/* 3. CONTINUOUS LONGITUDINAL GUIDE RAILS (Floor & Ceiling Power Tracks)      */}
      {/* ========================================================================= */}
      {/* Ceiling Neon Track */}
      <mesh position={[0, 3.3, -45]}>
        <boxGeometry args={[0.08, 0.08, 120]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.primary}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Left Floor Guide Beam */}
      <mesh position={[-1.4, -2.8, -45]}>
        <boxGeometry args={[0.07, 0.07, 120]} />
        <meshStandardMaterial
          color={colors.secondary}
          emissive={colors.secondary}
          emissiveIntensity={0.9}
        />
      </mesh>
      {/* Right Floor Guide Beam */}
      <mesh position={[1.4, -2.8, -45]}>
        <boxGeometry args={[0.07, 0.07, 120]} />
        <meshStandardMaterial
          color={colors.secondary}
          emissive={colors.secondary}
          emissiveIntensity={0.9}
        />
      </mesh>
      {/* Center Floor Laser Runway Line */}
      <mesh position={[0, -2.82, -45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 120]} />
        <meshBasicMaterial
          color={colors.tertiary}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
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
          size={isMobile ? 0.07 : 0.09}
          color={colors.secondary}
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
