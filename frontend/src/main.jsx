import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { RenderModeProvider } from './contexts/RenderModeContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <RenderModeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </RenderModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
