import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function TransformingPacket({ progress, colors, position }) {
  const groupRef = useRef();
  const innerRef = useRef();
  const lockRing1Ref = useRef();
  const lockRing2Ref = useRef();
  const scannerRef = useRef();
  const rawJitterRef = useRef();

  // Progress is clamped [0, 1]
  // 6 checkpoints correspond roughly to:
  // 0: [0.00, 0.15] - Raw Ingest
  // 1: [0.15, 0.32] - Tokenize
  // 2: [0.32, 0.50] - OCSF Normalization
  // 3: [0.50, 0.68] - SHA-256 Seal
  // 4: [0.68, 0.85] - Anomaly ML
  // 5: [0.85, 1.00] - XAI Verdict

  // Particle positions for raw ingest cloud
  const rawParticles = useMemo(() => {
    const count = 36;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Gentle floating bob
      groupRef.current.position.y = (position[1] || 0) + Math.sin(t * 2) * 0.08;
      groupRef.current.position.x = position[0] || 0;
      groupRef.current.position.z = position[2] || 0;

      // Base gentle rotation
      groupRef.current.rotation.y += delta * 0.5;
    }

    // Jitter for raw ingest
    if (rawJitterRef.current) {
      const rawFactor = Math.max(0, 1 - progress * 4);
      rawJitterRef.current.position.x = (Math.random() - 0.5) * 0.04 * rawFactor;
      rawJitterRef.current.position.y = (Math.random() - 0.5) * 0.04 * rawFactor;
    }

    // Cryptographic lock rings rotation
    if (lockRing1Ref.current) {
      lockRing1Ref.current.rotation.x += delta * 1.2;
      lockRing1Ref.current.rotation.y += delta * 0.8;
    }
    if (lockRing2Ref.current) {
      lockRing2Ref.current.rotation.y -= delta * 1.4;
      lockRing2Ref.current.rotation.z += delta * 0.6;
    }

    // ML Scanner pulse
    if (scannerRef.current) {
      scannerRef.current.position.y = Math.sin(t * 4) * 0.9;
    }
  });

  // Calculate morphing weights based on scroll progress
  // Stage 1 (Raw): 0.0 -> 0.18
  const rawWeight = Math.max(0, Math.min(1, 1 - (progress - 0.0) / 0.18));
  // Stage 2 (Tokenize): 0.12 -> 0.35
  const tokenWeight = Math.max(0, 1 - Math.abs(progress - 0.23) / 0.15);
  // Stage 3 (OCSF Core): starts ramping from 0.25, full at 0.40+
  const ocsfWeight = Math.max(0, Math.min(1, (progress - 0.25) / 0.15));
  // Stage 4 (Sealed): 0.48 -> 1.0
  const sealWeight = Math.max(0, Math.min(1, (progress - 0.46) / 0.14));
  // Stage 5 (ML Scanner): 0.64 -> 0.86
  const mlWeight = Math.max(0, 1 - Math.abs(progress - 0.75) / 0.14);
  // Stage 6 (Verdict): 0.82 -> 1.0
  const verdictWeight = Math.max(0, Math.min(1, (progress - 0.82) / 0.14));

  return (
    <group ref={groupRef} position={position}>
      {/* 1. RAW INGESTION REPRESENTATION (Jittery points & raw text shards) */}
      {rawWeight > 0.02 && (
        <group ref={rawJitterRef}>
          {/* Wireframe chaotic boundary */}
          <mesh scale={[1.2, 1.2, 1.2]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              color={colors.primary}
              wireframe
              transparent
              opacity={rawWeight * 0.65}
            />
          </mesh>

          {/* Random floating raw text shards */}
          <group scale={rawWeight}>
            <Text
              position={[-0.7, 0.6, 0.4]}
              fontSize={0.12}
              color={colors.criticalStr}
              anchorX="center"
              anchorY="middle"
            >
              %ASA-4-106023
            </Text>
            <Text
              position={[0.6, -0.5, 0.5]}
              fontSize={0.11}
              color={colors.secondaryStr}
              anchorX="center"
              anchorY="middle"
            >
              src=185.220.101.5
            </Text>
            <Text
              position={[-0.4, -0.6, -0.4]}
              fontSize={0.1}
              color={colors.primaryStr}
              anchorX="center"
              anchorY="middle"
            >
              [RAW_STREAM_INGEST]
            </Text>
          </group>

          {/* Point cloud cloudlets */}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[rawParticles, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.06}
              color={colors.primary}
              transparent
              opacity={rawWeight * 0.8}
            />
          </points>
        </group>
      )}

      {/* 2. TOKENIZED BLOCKS (4 discrete data fields aligning) */}
      {tokenWeight > 0.02 && (
        <group scale={tokenWeight}>
          {/* Token 1: Timestamp */}
          <mesh position={[-0.5, 0.35, 0]}>
            <boxGeometry args={[0.5, 0.22, 0.22]} />
            <meshStandardMaterial
              color={colors.secondary}
              emissive={colors.secondary}
              emissiveIntensity={0.5}
              wireframe={false}
              transparent
              opacity={0.85}
            />
          </mesh>
          <Text position={[-0.5, 0.35, 0.15]} fontSize={0.07} color="#ffffff">
            TIME
          </Text>

          {/* Token 2: SRC IP */}
          <mesh position={[0.5, 0.35, 0]}>
            <boxGeometry args={[0.5, 0.22, 0.22]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          <Text position={[0.5, 0.35, 0.15]} fontSize={0.07} color="#ffffff">
            SRC_IP
          </Text>

          {/* Token 3: DST PORT */}
          <mesh position={[-0.5, -0.35, 0]}>
            <boxGeometry args={[0.5, 0.22, 0.22]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          <Text position={[-0.5, -0.35, 0.15]} fontSize={0.07} color="#ffffff">
            PORT
          </Text>

          {/* Token 4: ACTION */}
          <mesh position={[0.5, -0.35, 0]}>
            <boxGeometry args={[0.5, 0.22, 0.22]} />
            <meshStandardMaterial
              color={colors.critical}
              emissive={colors.critical}
              emissiveIntensity={0.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          <Text position={[0.5, -0.35, 0.15]} fontSize={0.07} color="#ffffff">
            ACTION
          </Text>
        </group>
      )}

      {/* 3. OCSF NORMALIZED CRYSTALLINE CORE */}
      {ocsfWeight > 0.05 && (
        <group ref={innerRef} scale={Math.min(1, ocsfWeight * 1.1)}>
          {/* Faceted Central Prism */}
          <mesh>
            <octahedronGeometry args={[0.75, 0]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.4}
              metalness={0.6}
              roughness={0.2}
              transparent
              opacity={0.88}
            />
          </mesh>

          {/* Inner glowing pulse core */}
          <mesh scale={[0.45, 0.45, 0.45]}>
            <octahedronGeometry args={[0.75, 1]} />
            <meshBasicMaterial
              color={colors.secondary}
              wireframe
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* OCSF Class Tag */}
          <Text
            position={[0, 0.95, 0]}
            fontSize={0.09}
            color={colors.tertiaryStr}
            anchorX="center"
          >
            OCSF // CLASS 4001
          </Text>
        </group>
      )}

      {/* 4. SHA-256 SEAL (Hexagonal Shell + Dual Rotating Lock Rings) */}
      {sealWeight > 0.05 && (
        <group>
          {/* Luminous Cryptographic Hex Shell */}
          <mesh scale={[1.25, 1.25, 1.25]}>
            <icosahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.3 * sealWeight}
              wireframe
              transparent
              opacity={0.45 * sealWeight}
            />
          </mesh>

          {/* Rotating Lock Ring 1 */}
          <group ref={lockRing1Ref} scale={sealWeight}>
            <mesh>
              <torusGeometry args={[1.15, 0.02, 12, 48]} />
              <meshBasicMaterial
                color={colors.primary}
                transparent
                opacity={0.75 * sealWeight}
              />
            </mesh>
          </group>

          {/* Rotating Lock Ring 2 */}
          <group ref={lockRing2Ref} scale={sealWeight}>
            <mesh>
              <torusGeometry args={[1.22, 0.02, 12, 48]} />
              <meshBasicMaterial
                color={colors.secondary}
                transparent
                opacity={0.75 * sealWeight}
              />
            </mesh>
          </group>

          {/* SHA-256 Hash Seal Label */}
          <Text
            position={[0, -1.05, 0]}
            fontSize={0.08}
            color={colors.primaryStr}
            anchorX="center"
          >
            SHA-256 // SEALED 0x7F4A...e9b9
          </Text>
        </group>
      )}

      {/* 5. ANOMALY ML SCANNER (Sweeping Radar Plane + Decision Metric) */}
      {mlWeight > 0.05 && (
        <group>
          {/* Sweeping Laser Scan Disc */}
          <group ref={scannerRef}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 1.35, 32]} />
              <meshBasicMaterial
                color={colors.secondary}
                transparent
                opacity={0.55 * mlWeight}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* ML Score Radar Label */}
          <Text
            position={[0, 1.25, 0]}
            fontSize={0.085}
            color={colors.secondaryStr}
            anchorX="center"
          >
            ISOLATION FOREST // EVAL: 0.94
          </Text>
        </group>
      )}

      {/* 6. XAI VERDICT STAGE (Prismatic Aura & Confirmed Verdict Badge) */}
      {verdictWeight > 0.05 && (
        <group scale={verdictWeight}>
          {/* Outer Prismatic Aura Rings */}
          <mesh scale={[1.4, 1.4, 1.4]}>
            <sphereGeometry args={[0.85, 24, 24]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.5 * verdictWeight}
              transparent
              opacity={0.25 * verdictWeight}
              wireframe
            />
          </mesh>

          {/* Verified Badge Header in 3D */}
          <group position={[0, 1.35, 0]}>
            <mesh>
              <planeGeometry args={[1.8, 0.38]} />
              <meshBasicMaterial
                color={colors.surfaceDim}
                transparent
                opacity={0.85}
              />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[1.82, 0.4]} />
              <meshBasicMaterial
                color={colors.tertiary}
                wireframe
              />
            </mesh>
            <Text
              position={[0, 0.04, 0.02]}
              fontSize={0.08}
              color={colors.tertiaryStr}
              anchorX="center"
              anchorY="middle"
            >
              [VERDICT: CONFIRMED ANOMALY]
            </Text>
            <Text
              position={[0, -0.09, 0.02]}
              fontSize={0.065}
              color={colors.secondaryStr}
              anchorX="center"
              anchorY="middle"
            >
              MITRE ATT&CK: T1046 NETWORK SCAN
            </Text>
          </group>
        </group>
      )}
    </group>
  );
}
