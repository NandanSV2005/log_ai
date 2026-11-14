import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../contexts/ThemeContext';

const DEFAULT_MOCHA = {
  primary: '#E3C98F',
  secondary: '#B85C28',
  secondaryText: '#DC7D43',
  tertiary: '#CDB8A0',
  surfaceLowest: '#130D0A',
  surfaceDim: '#1B130F',
  textMain: '#F1E9DD',
  tunnelHull: '#160F0C',
  tunnelWire: '#E3C98F',
  borderGlow: '#E3C98F',
  critical: '#FF4D94',
  ambient: '#3A2A22',
  fog: '#130D0A'
};

const DEFAULT_POWDER = {
  primary: '#376D8C',
  secondary: '#715F9F',
  secondaryText: '#715F9F',
  tertiary: '#F4A988',
  surfaceLowest: '#FFFFFF',
  surfaceDim: '#EFEAF6',
  textMain: '#2B2A3A',
  tunnelHull: '#EAE3F5',
  tunnelWire: '#376D8C',
  borderGlow: '#376D8C',
  critical: '#BE185D',
  ambient: '#EFEAF6',
  fog: '#F7F4FB'
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
    const fallback = isSage ? DEFAULT_POWDER : DEFAULT_MOCHA;

    const primaryHex = readCssColor('--color-primary', fallback.primary);
    const secondaryHex = readCssColor('--color-secondary', fallback.secondary);
    const secondaryTextHex = readCssColor('--color-secondary-text', fallback.secondaryText);
    const tertiaryHex = readCssColor('--color-tertiary', fallback.tertiary);
    const surfaceLowestHex = readCssColor('--color-surface-lowest', fallback.surfaceLowest);
    const surfaceDimHex = readCssColor('--color-surface-dim', fallback.surfaceDim);
    const textMainHex = readCssColor('--color-text-main', fallback.textMain);
    const criticalHex = readCssColor('--color-severity-critical', fallback.critical);

    return {
      isSage,
      theme: currentTheme,
      primaryStr: primaryHex,
      secondaryStr: secondaryHex,
      secondaryTextStr: secondaryTextHex,
      tertiaryStr: tertiaryHex,
      surfaceLowestStr: surfaceLowestHex,
      surfaceDimStr: surfaceDimHex,
      textMainStr: textMainHex,
      tunnelHullStr: fallback.tunnelHull,
      tunnelWireStr: primaryHex,
      criticalStr: criticalHex,
      primary: new THREE.Color(primaryHex),
      secondary: new THREE.Color(secondaryHex),
      tertiary: new THREE.Color(tertiaryHex),
      surfaceLowest: new THREE.Color(surfaceLowestHex),
      surfaceDim: new THREE.Color(surfaceDimHex),
      tunnelHull: new THREE.Color(fallback.tunnelHull),
      tunnelWire: new THREE.Color(primaryHex),
      critical: new THREE.Color(criticalHex),
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
