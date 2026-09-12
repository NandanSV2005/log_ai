import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../contexts/ThemeContext';

const DEFAULT_CYBERVOID = {
  primary: '#a78bfa',
  secondary: '#7bd0ff',
  tertiary: '#4edea3',
  surfaceLowest: '#0d1017',
  surfaceDim: '#131722',
  borderGlow: '#a78bfa',
  critical: '#d946ef',
  ambient: '#181b2a',
  fog: '#0a0d14'
};

const DEFAULT_SAGE = {
  primary: '#386641',
  secondary: '#c86a28',
  tertiary: '#196f7c',
  surfaceLowest: '#f2f5ee',
  surfaceDim: '#d3ded0',
  borderGlow: '#c86a28',
  critical: '#be185d',
  ambient: '#e2eadb',
  fog: '#e8efe4'
};

function readCssColor(varName, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (val && (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl'))) {
      return val;
    }
  } catch {
    // fallback
  }
  return fallback;
}

export function useThreeThemeColors() {
  const { theme } = useTheme();

  const getColors = (currentTheme) => {
    const isSage = currentTheme === 'sage';
    const fallback = isSage ? DEFAULT_SAGE : DEFAULT_CYBERVOID;

    const primaryHex = readCssColor('--color-primary', fallback.primary);
    const secondaryHex = readCssColor('--color-secondary', fallback.secondary);
    const tertiaryHex = readCssColor('--color-tertiary', fallback.tertiary);
    const surfaceLowestHex = readCssColor('--color-surface-lowest', fallback.surfaceLowest);
    const surfaceDimHex = readCssColor('--color-surface-dim', fallback.surfaceDim);
    const criticalHex = readCssColor('--color-severity-critical', fallback.critical);

    return {
      isSage,
      theme: currentTheme,
      primaryStr: primaryHex,
      secondaryStr: secondaryHex,
      tertiaryStr: tertiaryHex,
      surfaceLowestStr: surfaceLowestHex,
      surfaceDimStr: surfaceDimHex,
      criticalStr: criticalHex,
      primary: new THREE.Color(primaryHex),
      secondary: new THREE.Color(secondaryHex),
      tertiary: new THREE.Color(tertiaryHex),
      surfaceLowest: new THREE.Color(surfaceLowestHex),
      surfaceDim: new THREE.Color(surfaceDimHex),
      critical: new THREE.Color(criticalHex),
      ambient: new THREE.Color(fallback.ambient),
      fog: new THREE.Color(fallback.fog)
    };
  };

  const [colors, setColors] = useState(() => getColors(theme));

  useEffect(() => {
    // Refresh colors whenever theme changes or data-theme changes
    setColors(getColors(theme));

    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || theme;
      setColors(getColors(currentTheme));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });

    return () => observer.disconnect();
  }, [theme]);

  return colors;
}
