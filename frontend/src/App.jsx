import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Clipboard, LogOut, Loader, Wifi, WifiOff, Menu, X, BarChart2, AlertCircle } from 'lucide-react';

// Application layer hooks
import { useAuth } from './application/hooks/useAuth.js';
import { useClases } from './application/hooks/useClases.js';
import { useToast } from './application/hooks/useToast.js';

// Presentation layer — pages (views)
import ClasesRegistro from './presentation/pages/ClasesRegistro.jsx';
import MarcoTeorico from './presentation/pages/MarcoTeorico.jsx';
import EvaluacionDashboard from './presentation/pages/EvaluacionDashboard.jsx';
import Seguimiento from './presentation/pages/Seguimiento.jsx';

export default function App() {
  const { toasts, showToast } = useToast();
  const auth = useAuth(showToast);
  const clasesHook = useClases(showToast);

  const [currentView, setCurrentView] = useState('clases');
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appLoading, setAppLoading] = useState(true);

  // Connection listeners + session restore
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast('Conexión reestablecida. Trabajando en línea.', 'success'); };
    const handleOffline = () => { setIsOnline(false); showToast('Sin conexión a internet. Los cambios se guardarán localmente.', 'warning'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const activeUser = auth.initFromSession();
    if (activeUser) {
      auth.setUser(activeUser);
      clasesHook.loadClases(activeUser.id);
    }
    setAppLoading(false);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRefreshClases = (newActiveId = null) => {
    clasesHook.refreshClases(newActiveId);
  };

  const renderView = () => {
    switch (currentView) {
      case 'clases':
        return (
          <ClasesRegistro
            clases={clasesHook.clases}
            activeClassId={clasesHook.activeClassId}
            setActiveClassId={clasesHook.setActiveClassId}
            onRefreshClases={handleRefreshClases}
            showToast={showToast}
          />
        );
      case 'teorico':
        return <MarcoTeorico />;
      case 'evaluacion':
        return <EvaluacionDashboard activeClassId={clasesHook.activeClassId} showToast={showToast} />;
      case 'seguimiento':
        return <Seguimiento activeClassId={clasesHook.activeClassId} showToast={showToast} />;
      default:
        return <div style={{ color: 'var(--text-white)' }}>Vista no encontrada</div>;
    }
  };

  // Initial loader
  if (appLoading) {
    return (
      <div className="auth-screen">
        <div style={{ textAlign: 'center' }}>
          <Loader className="spinner" style={{ margin: '0 auto 1.5rem' }} />
          <h3 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>EduDocente PWA</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Cargando entorno de investigación cognitiva...</p>
        </div>
      </div>
    );
  }

  // AUTHENTICATION SCREEN
  if (!auth.user) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <svg className="floating-logo" viewBox="0 0 512 512">
                <rect width="512" height="512" rx="128" fill="url(#grad-app)" />
                <defs>
                  <linearGradient id="grad-app" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#4f46e5' }} />
                    <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
                  </linearGradient>
                </defs>
                <rect x="156" y="240" width="200" height="120" rx="15" fill="#ffffff" />
                <line x1="256" y1="240" x2="256" y2="360" stroke="#cbd5e1" strokeWidth="4" />
                <path d="M256 120 L376 168 L256 216 L136 168 Z" fill="#f8fafc" />
                <circle cx="360" cy="245" r="8" fill="#ffd700" />
              </svg>
            </div>
            <h1 className="font-outfit text-white">EduDocente</h1>
            <p className="auth-subtitle">INVESTIGACIÓN Y SIMULACIÓN COGNITIVA</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>
            <button className={`btn btn-sm ${auth.authTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { auth.setAuthTab('login'); auth.setAuthError(''); }} style={{ flex: 1 }}>
              Iniciar Sesión
            </button>
            <button className={`btn btn-sm ${auth.authTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { auth.setAuthTab('register'); auth.setAuthError(''); }} style={{ flex: 1 }}>
              Registrarse
            </button>
          </div>

          {auth.authError && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {auth.authError}
            </div>
          )}

          {auth.authTab === 'login' && (
            <form onSubmit={(e) => auth.handleLoginSubmit(e, (u) => clasesHook.loadClases(u.id))} className="auth-form active">
              <h3 className="form-title">Ingreso para Docentes</h3>
              <div className="input-group">
                <label>Correo Electrónico:</label>
                <input type="email" value={auth.loginForm.email}
                  onChange={(e) => auth.setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@escuela.com" required />
              </div>
              <div className="input-group">
                <label>Contraseña:</label>
                <input type="password" value={auth.loginForm.password}
                  onChange={(e) => auth.setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••" required />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={auth.submittingAuth}>
                {auth.submittingAuth ? 'Accediendo...' : 'Ingresar al Entorno'}
              </button>
              <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Credenciales de prueba: <strong style={{ color: 'var(--text-white)' }}>docente@escuela.com</strong> / <strong style={{ color: 'var(--text-white)' }}>password123</strong>
              </p>
            </form>
          )}

          {auth.authTab === 'register' && (
            <form onSubmit={(e) => auth.handleRegisterSubmit(e, (u) => clasesHook.loadClases(u.id))} className="auth-form active">
              <h3 className="form-title">Registro de Investigador</h3>
              <div className="input-group">
                <label>Nombre y Apellidos:</label>
                <input type="text" value={auth.registerForm.nombre}
                  onChange={(e) => auth.setRegisterForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Prof. Ana María" required />
              </div>
              <div className="input-group">
                <label>Correo Electrónico:</label>
                <input type="email" value={auth.registerForm.email}
                  onChange={(e) => auth.setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@escuela.com" required />
              </div>
              <div className="input-group">
                <label>Contraseña:</label>
                <input type="password" value={auth.registerForm.password}
                  onChange={(e) => auth.setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres" required />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={auth.submittingAuth}>
                {auth.submittingAuth ? 'Registrando...' : 'Completar Registro'}
              </button>
            </form>
          )}
        </div>

        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}><span>{t.message}</span></div>)}
          </div>
        )}
      </div>
    );
  }

  // MAIN DASHBOARD
  const userInitials = auth.user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const activeClassObj = clasesHook.clases.find(c => c.id === clasesHook.activeClassId);

  return (
    <div className="app-container">
      <div className="dashboard-layout">

        {isSidebarActive && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99, backdropFilter: 'blur(2px)' }}
            onClick={() => setIsSidebarActive(false)} />
        )}

        <aside className={`sidebar ${isSidebarActive ? 'active' : ''}`} style={{ zIndex: 100 }}>
          <div className="sidebar-brand">
            <svg className="brand-icon" viewBox="0 0 512 512">
              <rect width="512" height="512" rx="128" fill="url(#grad-sidebar)" />
              <defs>
                <linearGradient id="grad-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4f46e5' }} />
                  <stop offset="100%" style={{ stopColor: '#7c3aed' }} />
                </linearGradient>
              </defs>
              <rect x="156" y="240" width="200" height="120" rx="15" fill="#ffffff" />
              <line x1="256" y1="240" x2="256" y2="360" stroke="#cbd5e1" strokeWidth="4" />
              <path d="M256 120 L376 168 L256 216 L136 168 Z" fill="#f8fafc" />
              <circle cx="360" cy="245" r="8" fill="#ffd700" />
            </svg>
            <span className="brand-text text-white">EduDocente</span>
          </div>

          <nav className="sidebar-nav">
            <button className={`btn nav-item ${currentView === 'clases' ? 'active' : ''}`}
              onClick={() => { setCurrentView('clases'); setIsSidebarActive(false); }}>
              <Home size={18} /> Mis Aulas &amp; Registro
            </button>
            <button className={`btn nav-item ${currentView === 'teorico' ? 'active' : ''}`}
              onClick={() => { setCurrentView('teorico'); setIsSidebarActive(false); }}>
              <BookOpen size={18} /> Marco Teórico
            </button>
            <button className={`btn nav-item ${!clasesHook.activeClassId ? 'nav-class-locked' : ''} ${currentView === 'evaluacion' ? 'active' : ''}`}
              onClick={() => {
                if (!clasesHook.activeClassId) { showToast('Debe seleccionar o registrar una clase activa en "Mis Aulas"', 'warning'); return; }
                setCurrentView('evaluacion'); setIsSidebarActive(false);
              }}>
              <Clipboard size={18} /> Rúbricas &amp; Evaluación
            </button>
            <button className={`btn nav-item ${!clasesHook.activeClassId ? 'nav-class-locked' : ''} ${currentView === 'seguimiento' ? 'active' : ''}`}
              onClick={() => {
                if (!clasesHook.activeClassId) { showToast('Debe seleccionar o registrar una clase activa en "Mis Aulas"', 'warning'); return; }
                setCurrentView('seguimiento'); setIsSidebarActive(false);
              }}>
              <BarChart2 size={18} /> Seguimiento &amp; Informes
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">{auth.user.nombre}</span>
                <span className="user-role">Maestro Investigador</span>
              </div>
            </div>
            <button className="btn btn-icon-only btn-logout" title="Cerrar Sesión"
              onClick={() => auth.handleLogout(() => { clasesHook.setClases([]); clasesHook.setActiveClassId(''); setCurrentView('clases'); })}>
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        <main className="workspace">
          <header className="workspace-header">
            <div className="header-left">
              <button className="btn btn-icon-only mobile-only" onClick={() => setIsSidebarActive(!isSidebarActive)}>
                {isSidebarActive ? <X size={20} /> : <Menu size={20} />}
              </button>
              {clasesHook.activeClassId && activeClassObj && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>AULA ACTIVA</span>
                  <span className="text-white" style={{ fontWeight: '800', fontSize: '1.25rem', fontFamily: 'var(--font-outfit)', marginTop: '-0.2rem' }}>
                    {activeClassObj.nombre}
                  </span>
                </div>
              )}
            </div>
            <div className="header-right">
              <div className={`connection-status-badge ${isOnline ? '' : 'offline'}`}>
                {isOnline ? <Wifi size={14} className="text-green-600" /> : <WifiOff size={14} className="text-red-600" />}
                <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              {clasesHook.clases.length > 0 && (
                <div className="class-selector">
                  <label htmlFor="active-class-select">Aula:</label>
                  <select id="active-class-select" value={clasesHook.activeClassId} onChange={clasesHook.handleClassChange}>
                    <option value="" disabled>Seleccione aula...</option>
                    {clasesHook.clases.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.grado})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </header>

          <div className="workspace-content">
            {renderView()}
          </div>
        </main>
      </div>

      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}><span>{t.message}</span></div>)}
        </div>
      )}
    </div>
  );
}
