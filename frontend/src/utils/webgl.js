/**
 * Utility to detect WebGL / WebGL2 support in the browser environment.
 */
export function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    // Release the test context immediately so it does not count against active context limit
    const loseExt = gl.getExtension('WEBGL_lose_context');
    if (loseExt) {
      loseExt.loseContext();
    }
    return true;
  } catch {
    return false;
  }
}
