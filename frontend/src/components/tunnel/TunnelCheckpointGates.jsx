import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export const CHECKPOINTS = [
  {
    id: 1,
    number: '01',
    title: 'RAW INGEST',
    subtitle: 'ASYNC INGESTION ENGINE',
    z: 0,
    colorKey: 'primary',
    targetProgress: 0.05
  },
  {
    id: 2,
    number: '02',
    title: 'TOKENIZE',
    subtitle: 'LEXICAL FIELD PARSER',
    z: -18,
    colorKey: 'secondary',
    targetProgress: 0.22
  },
  {
    id: 3,
    number: '03',
    title: 'OCSF NORM',
    subtitle: 'SCHEMA NORMALIZATION',
    z: -36,
    colorKey: 'tertiary',
    targetProgress: 0.41
  },
  {
    id: 4,
    number: '04',
    title: 'SHA-256 SEAL',
    subtitle: 'CRYPTO LEDGER HASHING',
    z: -54,
    colorKey: 'primary',
    targetProgress: 0.60
  },
  {
    id: 5,
    number: '05',
    title: 'ANOMALY ML',
    subtitle: 'ISOLATION FOREST CORE',
    z: -72,
    colorKey: 'secondary',
    targetProgress: 0.79
  },
  {
    id: 6,
    number: '06',
    title: 'XAI VERDICT',
    subtitle: 'EXPLAINABLE MITRE VERDICT',
    z: -90,
    colorKey: 'tertiary',
    targetProgress: 0.96
  }
];

export function TunnelCheckpointGates({ colors, progress }) {
  return (
    <group>
      {CHECKPOINTS.map((cp) => {
        const stageColor = colors[cp.colorKey] || colors.primary;
        const stageColorStr = colors[`${cp.colorKey}Str`] || colors.primaryStr;

        // Is this gate currently active or passed?
        const diff = Math.abs(progress - cp.targetProgress);
        const isNear = diff < 0.12;
        const gateOpacity = isNear ? 0.95 : 0.45;
        const glowScale = isNear ? 1.05 : 1.0;

        return (
          <group key={cp.id} position={[0, 0, cp.z]}>
            {/* Outer Hexagonal Portal Frame */}
            <mesh scale={[glowScale, glowScale, 1]}>
              <ringGeometry args={[3.2, 3.4, 6]} />
              <meshStandardMaterial
                color={stageColor}
                emissive={stageColor}
                emissiveIntensity={isNear ? 0.8 : 0.25}
                transparent
                opacity={gateOpacity}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Inner Accent Ring */}
            <mesh scale={[glowScale, glowScale, 1]}>
              <ringGeometry args={[3.0, 3.08, 6]} />
              <meshBasicMaterial
                color={colors.surfaceLowest}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Top Overhead Signboard Frame (Solid Backing + Clean Architectural Borders) */}
            <group position={[0, 2.75, 0]}>
              {/* Solid High-Contrast Background Backing Panel */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[3.1, 0.78]} />
                <meshBasicMaterial
                  color={colors.isSage ? '#ffffff' : '#07090e'}
                  transparent
                  opacity={0.96}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Clean Outer Perimeter Border Frame (No diagonal wireframe crossing text) */}
              <mesh position={[0, 0.38, 0.01]}>
                <planeGeometry args={[3.12, 0.02]} />
                <meshBasicMaterial color={stageColor} transparent opacity={gateOpacity} />
              </mesh>
              <mesh position={[0, -0.38, 0.01]}>
                <planeGeometry args={[3.12, 0.02]} />
                <meshBasicMaterial color={stageColor} transparent opacity={gateOpacity} />
              </mesh>
              <mesh position={[-1.55, 0, 0.01]}>
                <planeGeometry args={[0.02, 0.78]} />
                <meshBasicMaterial color={stageColor} transparent opacity={gateOpacity} />
              </mesh>
              <mesh position={[1.55, 0, 0.01]}>
                <planeGeometry args={[0.02, 0.78]} />
                <meshBasicMaterial color={stageColor} transparent opacity={gateOpacity} />
              </mesh>

              {/* Architectural Vertical Partition Divider */}
              <mesh position={[-0.68, 0, 0.02]}>
                <planeGeometry args={[0.02, 0.54]} />
                <meshBasicMaterial color={stageColor} transparent opacity={gateOpacity * 0.75} />
              </mesh>

              {/* Stage Number (Dedicated Left Column) */}
              <Text
                position={[-1.12, 0.02, 0.03]}
                fontSize={0.24}
                letterSpacing={0.04}
                color={stageColorStr}
                anchorX="center"
                anchorY="middle"
              >
                {cp.number}
              </Text>

              {/* Stage Title (Dedicated Right Column - Distinct Gap from Number) */}
              <Text
                position={[-0.48, 0.11, 0.03]}
                fontSize={0.16}
                letterSpacing={0.08}
                color={colors.isSage ? '#121f14' : '#ffffff'}
                anchorX="left"
                anchorY="middle"
              >
                {cp.title}
              </Text>

              {/* Stage Subtitle */}
              <Text
                position={[-0.48, -0.11, 0.03]}
                fontSize={0.085}
                letterSpacing={0.05}
                color={stageColorStr}
                anchorX="left"
                anchorY="middle"
              >
                {cp.subtitle}
              </Text>
            </group>

            {/* Vertical Left and Right Beacon Pylons */}
            <mesh position={[-3.1, -0.5, 0]}>
              <boxGeometry args={[0.08, 4.2, 0.08]} />
              <meshStandardMaterial
                color={stageColor}
                emissive={stageColor}
                emissiveIntensity={isNear ? 0.6 : 0.2}
                transparent
                opacity={gateOpacity}
              />
            </mesh>
            <mesh position={[3.1, -0.5, 0]}>
              <boxGeometry args={[0.08, 4.2, 0.08]} />
              <meshStandardMaterial
                color={stageColor}
                emissive={stageColor}
                emissiveIntensity={isNear ? 0.6 : 0.2}
                transparent
                opacity={gateOpacity}
              />
            </mesh>

            {/* Floor Guide Line Strip */}
            <mesh position={[0, -2.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.5, 3.5]} />
              <meshBasicMaterial
                color={stageColor}
                transparent
                opacity={isNear ? 0.35 : 0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
