/**
 * Application Layer — useAuth Hook
 * Encapsulates all authentication state and logic.
 */
import { useState } from 'react';
import { AuthService } from '../../infrastructure/api/AuthService.js';

export function useAuth(showToast) {
  const [user, setUser] = useState(null);
  const [authTab, setAuthTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ nombre: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  function initFromSession() {
    return AuthService.getCurrentUser();
  }

  function handleLoginSubmit(e, onSuccess) {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setAuthError('Por favor complete todos los campos');
      return;
    }
    setSubmittingAuth(true);
    setAuthError('');
    AuthService.login(loginForm.email, loginForm.password)
      .then(activeUser => {
        setUser(activeUser);
        showToast(`¡Bienvenida, ${activeUser.nombre}!`, 'success');
        onSuccess && onSuccess(activeUser);
      })
      .catch(err => setAuthError(err.message || 'Credenciales inválidas'))
      .finally(() => setSubmittingAuth(false));
  }

  function handleRegisterSubmit(e, onSuccess) {
    e.preventDefault();
    if (!registerForm.nombre || !registerForm.email || !registerForm.password) {
      setAuthError('Por favor complete todos los campos');
      return;
    }
    setSubmittingAuth(true);
    setAuthError('');
    AuthService.register(registerForm.email, registerForm.password, registerForm.nombre)
      .then(() => {
        showToast('Registro exitoso. Iniciando sesión...', 'success');
        return AuthService.login(registerForm.email, registerForm.password);
      })
      .then(activeUser => {
        setUser(activeUser);
        onSuccess && onSuccess(activeUser);
      })
      .catch(err => setAuthError(err.message || 'Error en el registro'))
      .finally(() => setSubmittingAuth(false));
  }

  function handleLogout(onLogout) {
    if (window.confirm('¿Está seguro de cerrar sesión?')) {
      AuthService.logout();
      setUser(null);
      showToast('Sesión cerrada con éxito', 'success');
      onLogout && onLogout();
    }
  }

  return {
    user, setUser,
    authTab, setAuthTab,
    loginForm, setLoginForm,
    registerForm, setRegisterForm,
    authError, setAuthError,
    submittingAuth,
    initFromSession,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout
  };
}
