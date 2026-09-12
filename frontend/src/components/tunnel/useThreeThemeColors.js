import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../contexts/ThemeContext';

const DEFAULT_CYBERVOID = {
  primary: '#a78bfa',
  secondary: '#7bd0ff',
  tertiary: '#4edea3',
  surfaceLowest: '#090b10',
  surfaceDim: '#0f131c',
  tunnelHull: '#080a10',
  tunnelWire: '#a78bfa',
  borderGlow: '#a78bfa',
  critical: '#d946ef',
  ambient: '#22283a',
  fog: '#07090e'
};

const DEFAULT_SAGE = {
  primary: '#2d6a4f',
  secondary: '#d97706',
  tertiary: '#0f766e',
  surfaceLowest: '#162218',
  surfaceDim: '#1f2e22',
  tunnelHull: '#141d16',
  tunnelWire: '#52b788',
  borderGlow: '#d97706',
  critical: '#be185d',
  ambient: '#2a3a2d',
  fog: '#111813'
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

    const primaryHex = isSage ? '#2d6a4f' : readCssColor('--color-primary', fallback.primary);
    const secondaryHex = isSage ? '#d97706' : readCssColor('--color-secondary', fallback.secondary);
    const tertiaryHex = isSage ? '#0f766e' : readCssColor('--color-tertiary', fallback.tertiary);

    return {
      isSage,
      theme: currentTheme,
      primaryStr: primaryHex,
      secondaryStr: secondaryHex,
      tertiaryStr: tertiaryHex,
      surfaceLowestStr: fallback.surfaceLowest,
      surfaceDimStr: fallback.surfaceDim,
      tunnelHullStr: fallback.tunnelHull,
      tunnelWireStr: fallback.tunnelWire,
      criticalStr: fallback.critical,
      primary: new THREE.Color(primaryHex),
      secondary: new THREE.Color(secondaryHex),
      tertiary: new THREE.Color(tertiaryHex),
      surfaceLowest: new THREE.Color(fallback.surfaceLowest),
      surfaceDim: new THREE.Color(fallback.surfaceDim),
      tunnelHull: new THREE.Color(fallback.tunnelHull),
      tunnelWire: new THREE.Color(fallback.tunnelWire),
      critical: new THREE.Color(fallback.critical),
      ambient: new THREE.Color(fallback.ambient),
      fog: new THREE.Color(fallback.fog)
    };
  };

  const [colors, setColors] = useState(() => getColors(theme));

  useEffect(() => {
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
