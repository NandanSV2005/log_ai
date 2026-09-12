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

  // Particle positions for raw ingest cloud
  const rawParticles = useMemo(() => {
    const count = 48;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // Floating bobbing
      groupRef.current.position.y = (position[1] || 0) + Math.sin(t * 2.2) * 0.1;
      groupRef.current.position.x = position[0] || 0;
      groupRef.current.position.z = position[2] || 0;

      // Base rotation
      groupRef.current.rotation.y += delta * 0.6;
      groupRef.current.rotation.x = Math.sin(t * 0.8) * 0.12;
    }

    // Jitter for raw ingest
    if (rawJitterRef.current) {
      const rawFactor = Math.max(0, 1 - progress * 4);
      rawJitterRef.current.position.x = (Math.random() - 0.5) * 0.06 * rawFactor;
      rawJitterRef.current.position.y = (Math.random() - 0.5) * 0.06 * rawFactor;
    }

    // Cryptographic lock rings rotation
    if (lockRing1Ref.current) {
      lockRing1Ref.current.rotation.x += delta * 1.4;
      lockRing1Ref.current.rotation.y += delta * 0.9;
    }
    if (lockRing2Ref.current) {
      lockRing2Ref.current.rotation.y -= delta * 1.6;
      lockRing2Ref.current.rotation.z += delta * 0.7;
    }

    // ML Scanner pulse
    if (scannerRef.current) {
      scannerRef.current.position.y = Math.sin(t * 4.5) * 1.1;
    }
  });

  // Calculate morphing weights based on scroll progress
  const rawWeight = Math.max(0, Math.min(1, 1 - (progress - 0.0) / 0.18));
  const tokenWeight = Math.max(0, 1 - Math.abs(progress - 0.23) / 0.15);
  const ocsfWeight = Math.max(0, Math.min(1, (progress - 0.25) / 0.15));
  const sealWeight = Math.max(0, Math.min(1, (progress - 0.46) / 0.14));
  const mlWeight = Math.max(0, 1 - Math.abs(progress - 0.75) / 0.14);
  const verdictWeight = Math.max(0, Math.min(1, (progress - 0.82) / 0.14));

  return (
    <group ref={groupRef} position={position} scale={[1.3, 1.3, 1.3]}>
      {/* 1. RAW INGESTION REPRESENTATION (Jittery points, wire cage, floating raw text shards) */}
      {rawWeight > 0.02 && (
        <group ref={rawJitterRef}>
          {/* Wireframe chaotic boundary cage */}
          <mesh scale={[1.35, 1.35, 1.35]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.6 * rawWeight}
              wireframe
              transparent
              opacity={rawWeight * 0.85}
            />
          </mesh>

          {/* Inner raw glowing core */}
          <mesh scale={[0.5, 0.5, 0.5]}>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color={colors.critical}
              emissive={colors.critical}
              emissiveIntensity={0.9 * rawWeight}
              transparent
              opacity={rawWeight * 0.75}
            />
          </mesh>

          {/* Floating raw text shards */}
          <group scale={rawWeight}>
            <Text
              position={[-0.9, 0.8, 0.4]}
              fontSize={0.14}
              color={colors.criticalStr}
              anchorX="center"
              anchorY="middle"
            >
              %ASA-4-106023
            </Text>
            <Text
              position={[0.8, -0.7, 0.5]}
              fontSize={0.13}
              color={colors.secondaryStr}
              anchorX="center"
              anchorY="middle"
            >
              src=185.220.101.5
            </Text>
            <Text
              position={[-0.5, -0.85, -0.4]}
              fontSize={0.12}
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
              size={0.08}
              color={colors.primary}
              transparent
              opacity={rawWeight * 0.9}
            />
          </points>
        </group>
      )}

      {/* 2. TOKENIZED BLOCKS (4 discrete data fields aligning) */}
      {tokenWeight > 0.02 && (
        <group scale={tokenWeight}>
          {/* Token 1: Timestamp */}
          <mesh position={[-0.6, 0.4, 0]}>
            <boxGeometry args={[0.55, 0.26, 0.26]} />
            <meshStandardMaterial
              color={colors.secondary}
              emissive={colors.secondary}
              emissiveIntensity={0.7}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
          <Text position={[-0.6, 0.4, 0.18]} fontSize={0.09} color="#ffffff">
            TIME
          </Text>

          {/* Token 2: SRC IP */}
          <mesh position={[0.6, 0.4, 0]}>
            <boxGeometry args={[0.55, 0.26, 0.26]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.7}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
          <Text position={[0.6, 0.4, 0.18]} fontSize={0.09} color="#ffffff">
            SRC_IP
          </Text>

          {/* Token 3: DST PORT */}
          <mesh position={[-0.6, -0.4, 0]}>
            <boxGeometry args={[0.55, 0.26, 0.26]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.7}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
          <Text position={[-0.6, -0.4, 0.18]} fontSize={0.09} color="#ffffff">
            PORT
          </Text>

          {/* Token 4: ACTION */}
          <mesh position={[0.6, -0.4, 0]}>
            <boxGeometry args={[0.55, 0.26, 0.26]} />
            <meshStandardMaterial
              color={colors.critical}
              emissive={colors.critical}
              emissiveIntensity={0.7}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>
          <Text position={[0.6, -0.4, 0.18]} fontSize={0.09} color="#ffffff">
            ACTION
          </Text>
        </group>
      )}

      {/* 3. OCSF NORMALIZED CRYSTALLINE CORE */}
      {ocsfWeight > 0.05 && (
        <group ref={innerRef} scale={Math.min(1.2, ocsfWeight * 1.2)}>
          {/* Faceted Central Prism */}
          <mesh>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.6}
              metalness={0.7}
              roughness={0.15}
              transparent
              opacity={0.92}
            />
          </mesh>

          {/* Inner glowing pulse core */}
          <mesh scale={[0.55, 0.55, 0.55]}>
            <octahedronGeometry args={[0.9, 1]} />
            <meshBasicMaterial
              color={colors.secondary}
              wireframe
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* OCSF Class Tag */}
          <Text
            position={[0, 1.15, 0]}
            fontSize={0.11}
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
          <mesh scale={[1.45, 1.45, 1.45]}>
            <icosahedronGeometry args={[0.85, 1]} />
            <meshStandardMaterial
              color={colors.primary}
              emissive={colors.primary}
              emissiveIntensity={0.5 * sealWeight}
              wireframe
              transparent
              opacity={0.6 * sealWeight}
            />
          </mesh>

          {/* Rotating Lock Ring 1 */}
          <group ref={lockRing1Ref} scale={sealWeight}>
            <mesh>
              <torusGeometry args={[1.35, 0.035, 12, 48]} />
              <meshStandardMaterial
                color={colors.primary}
                emissive={colors.primary}
                emissiveIntensity={0.9 * sealWeight}
              />
            </mesh>
          </group>

          {/* Rotating Lock Ring 2 */}
          <group ref={lockRing2Ref} scale={sealWeight}>
            <mesh>
              <torusGeometry args={[1.45, 0.035, 12, 48]} />
              <meshStandardMaterial
                color={colors.secondary}
                emissive={colors.secondary}
                emissiveIntensity={0.9 * sealWeight}
              />
            </mesh>
          </group>

          {/* SHA-256 Hash Seal Label */}
          <Text
            position={[0, -1.25, 0]}
            fontSize={0.095}
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
              <ringGeometry args={[0.2, 1.6, 32]} />
              <meshBasicMaterial
                color={colors.secondary}
                transparent
                opacity={0.7 * mlWeight}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* ML Score Radar Label */}
          <Text
            position={[0, 1.45, 0]}
            fontSize={0.1}
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
          <mesh scale={[1.6, 1.6, 1.6]}>
            <sphereGeometry args={[0.9, 24, 24]} />
            <meshStandardMaterial
              color={colors.tertiary}
              emissive={colors.tertiary}
              emissiveIntensity={0.6 * verdictWeight}
              transparent
              opacity={0.3 * verdictWeight}
              wireframe
            />
          </mesh>

          {/* Verified Badge Header in 3D */}
          <group position={[0, 1.55, 0]}>
            <mesh>
              <planeGeometry args={[2.2, 0.46]} />
              <meshBasicMaterial
                color={colors.surfaceDim}
                transparent
                opacity={0.92}
              />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[2.24, 0.5]} />
              <meshBasicMaterial
                color={colors.tertiary}
                wireframe
              />
            </mesh>
            <Text
              position={[0, 0.06, 0.02]}
              fontSize={0.095}
              color={colors.tertiaryStr}
              anchorX="center"
              anchorY="middle"
            >
              [VERDICT: CONFIRMED ANOMALY]
            </Text>
            <Text
              position={[0, -0.1, 0.02]}
              fontSize={0.075}
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
