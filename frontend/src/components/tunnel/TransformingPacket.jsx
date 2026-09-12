import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Smooth bell curve weighting for continuous cross-fading between stages.
 * Peak at center, falls off to 0 within radius with cosine easing.
 */
function smoothWeight(progress, center, radius) {
  const dist = Math.abs(progress - center);
  if (dist >= radius) return 0;
  return 0.5 * (1 + Math.cos((Math.PI * dist) / radius));
}

export function TransformingPacket({ progress = 0, colors, position = [0, 0, 0] }) {
  const groupRef = useRef();
  const ringRef = useRef();
  const scanRingRef = useRef();

  // Calculate smooth cross-fade weights for the 6 checkpoint stages
  // Stages centered at: 0.05, 0.22, 0.41, 0.60, 0.79, 0.96
  const w1 = progress < 0.12 ? Math.max(0, 1 - progress / 0.14) : smoothWeight(progress, 0.05, 0.16);
  const w2 = smoothWeight(progress, 0.22, 0.16);
  const w3 = smoothWeight(progress, 0.41, 0.16);
  const w4 = smoothWeight(progress, 0.60, 0.16);
  const w5 = smoothWeight(progress, 0.79, 0.16);
  const w6 = progress > 0.88 ? Math.min(1, (progress - 0.88) / 0.10) : smoothWeight(progress, 0.96, 0.16);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Gentle, calm levitation bobbing (no jitter or shake)
      groupRef.current.position.y = (position[1] || 0) + Math.sin(t * 1.5) * 0.06;
      groupRef.current.position.x = position[0] || 0;
      groupRef.current.position.z = position[2] || 0;

      // Smooth continuous rotational drift
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.08;
    }

    // Graceful orbital ring rotation for Stage 4+
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.8;
      ringRef.current.rotation.y += delta * 0.5;
    }

    // ML Scanner scanline pulse for Stage 5
    if (scanRingRef.current) {
      scanRingRef.current.position.y = Math.sin(t * 2.5) * 0.7;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={[1.25, 1.25, 1.25]}>
      {/* ===================================================================== */}
      {/* STAGE 01: RAW UNSTRUCTURED INGESTION (Glowing faceted wireframe prism) */}
      {/* ===================================================================== */}
      {w1 > 0.01 && (
        <group scale={0.9 + w1 * 0.1}>
          <mesh>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.5 * w1}
              wireframe
              transparent
              opacity={0.85 * w1}
            />
          </mesh>
          <mesh scale={[0.55, 0.55, 0.55]}>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color={colors.critical}
              emissive={colors.critical}
              emissiveIntensity={0.8 * w1}
              transparent
              opacity={0.7 * w1}
            />
          </mesh>
        </group>
      )}

      {/* ===================================================================== */}
      {/* STAGE 02: TOKENIZED KEY-VALUE DATA FACETS (4 clean modular blocks)     */}
      {/* ===================================================================== */}
      {w2 > 0.01 && (
        <group scale={0.85 + w2 * 0.15}>
          {/* Top-Left Token */}
          <mesh position={[-0.45, 0.35, 0]}>
            <boxGeometry args={[0.42, 0.28, 0.28]} />
            <meshStandardMaterial
              color={colors.secondary}
              emissive={colors.secondary}
              emissiveIntensity={0.6 * w2}
              metalness={0.4}
              roughness={0.2}
              transparent
              opacity={0.9 * w2}
            />
          </mesh>
          {/* Top-Right Token */}
          <mesh position={[0.45, 0.35, 0]}>
            <boxGeometry args={[0.42, 0.28, 0.28]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.6 * w2}
              metalness={0.4}
              roughness={0.2}
              transparent
              opacity={0.9 * w2}
            />
          </mesh>
          {/* Bottom-Left Token */}
          <mesh position={[-0.45, -0.35, 0]}>
            <boxGeometry args={[0.42, 0.28, 0.28]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.6 * w2}
              metalness={0.4}
              roughness={0.2}
              transparent
              opacity={0.9 * w2}
            />
          </mesh>
          {/* Bottom-Right Token */}
          <mesh position={[0.45, -0.35, 0]}>
            <boxGeometry args={[0.42, 0.28, 0.28]} />
            <meshStandardMaterial
              color={colors.critical}
              emissive={colors.critical}
              emissiveIntensity={0.6 * w2}
              metalness={0.4}
              roughness={0.2}
              transparent
              opacity={0.9 * w2}
            />
          </mesh>
        </group>
      )}

      {/* ===================================================================== */}
      {/* STAGE 03: OCSF CANONICAL SCHEMA CORE (Luminous unified gemstone)       */}
      {/* ===================================================================== */}
      {w3 > 0.01 && (
        <group scale={0.9 + w3 * 0.1}>
          <mesh>
            <octahedronGeometry args={[0.92, 0]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.65 * w3}
              metalness={0.6}
              roughness={0.15}
              transparent
              opacity={0.92 * w3}
            />
          </mesh>
          {/* Internal lattice wireframe */}
          <mesh scale={[0.6, 0.6, 0.6]}>
            <octahedronGeometry args={[0.92, 1]} />
            <meshBasicMaterial
              color={colors.secondary}
              wireframe
              transparent
              opacity={0.7 * w3}
            />
          </mesh>
        </group>
      )}

      {/* ===================================================================== */}
      {/* STAGE 04: SHA-256 SEALED CRYPTOGRAPHIC VAULT (Locked shell + Orbit ring)*/}
      {/* ===================================================================== */}
      {w4 > 0.01 && (
        <group scale={0.92 + w4 * 0.08}>
          <mesh>
            <icosahedronGeometry args={[0.88, 1]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.7 * w4}
              metalness={0.7}
              roughness={0.2}
              transparent
              opacity={0.88 * w4}
            />
          </mesh>
          {/* Single elegant orbital seal ring */}
          <group ref={ringRef}>
            <mesh>
              <torusGeometry args={[1.25, 0.025, 12, 48]} />
              <meshStandardMaterial
                color={colors.secondary}
                emissive={colors.secondary}
                emissiveIntensity={0.9 * w4}
                transparent
                opacity={0.85 * w4}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* ===================================================================== */}
      {/* STAGE 05: MACHINE LEARNING ANOMALY CORE (Scanline inspection plane)   */}
      {/* ===================================================================== */}
      {w5 > 0.01 && (
        <group scale={0.92 + w5 * 0.08}>
          <mesh>
            <octahedronGeometry args={[0.88, 1]} />
            <meshStandardMaterial
              color={colors.secondary}
              emissive={colors.secondary}
              emissiveIntensity={0.75 * w5}
              metalness={0.5}
              roughness={0.2}
              transparent
              opacity={0.9 * w5}
            />
          </mesh>
          {/* Gentle vertical scan ring */}
          <group ref={scanRingRef}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 1.2, 32]} />
              <meshBasicMaterial
                color={colors.secondary}
                transparent
                opacity={0.45 * w5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* ===================================================================== */}
      {/* STAGE 06: EXPLAINABLE THREAT VERDICT (Radiant, high-confidence apex)  */}
      {/* ===================================================================== */}
      {w6 > 0.01 && (
        <group scale={0.95 + w6 * 0.1}>
          {/* Apex Core Gemstone */}
          <mesh>
            <octahedronGeometry args={[0.95, 0]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.9 * w6}
              metalness={0.7}
              roughness={0.1}
              transparent
              opacity={0.95 * w6}
            />
          </mesh>
          {/* Outer Protective Halo Wireframe */}
          <mesh scale={[1.22, 1.22, 1.22]}>
            <icosahedronGeometry args={[0.95, 0]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.6 * w6}
              wireframe
              transparent
              opacity={0.4 * w6}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
