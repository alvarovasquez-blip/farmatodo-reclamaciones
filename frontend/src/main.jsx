import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';
import Login from './Login';
import App from './App';

function Root() {
  const { user } = useAuth();
  return user ? <App/> : <Login/>;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <Root/>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>
);
