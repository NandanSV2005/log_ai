import React, { createContext, useContext, useState, useEffect } from 'react';

const RenderModeContext = createContext();

export function RenderModeProvider({ children }) {
  const [renderMode, setRenderModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('log_ai_render_mode');
      if (saved === '2d' || saved === '3d') {
        return saved;
      }
    }
    return '3d';
  });

  const setRenderMode = (mode) => {
    if (mode !== '2d' && mode !== '3d') return;
    setRenderModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('log_ai_render_mode', mode);
    }
  };

  const toggleRenderMode = () => {
    setRenderMode(renderMode === '3d' ? '2d' : '3d');
  };

  return (
    <RenderModeContext.Provider
      value={{
        renderMode,
        is3D: renderMode === '3d',
        is2D: renderMode === '2d',
        setRenderMode,
        toggleRenderMode
      }}
    >
      {children}
    </RenderModeContext.Provider>
  );
}

export function useRenderMode() {
  const context = useContext(RenderModeContext);
  if (!context) {
    throw new Error('useRenderMode must be used within a RenderModeProvider');
  }
  return context;
}
