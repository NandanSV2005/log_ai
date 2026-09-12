/**
 * Utility to detect WebGL / WebGL2 support in the browser environment.
 */
export function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl') ||
        canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}
