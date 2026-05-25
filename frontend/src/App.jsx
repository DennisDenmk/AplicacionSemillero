import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Clipboard, LogOut, User, Loader, Wifi, WifiOff, Menu, X, GraduationCap, BarChart2, AlertCircle } from 'lucide-react';
import { api } from './services/api';

// Importing Views
import ClasesRegistro from './views/ClasesRegistro';
import MarcoTeorico from './views/MarcoTeorico';
import EvaluacionDashboard from './views/EvaluacionDashboard';
import Seguimiento from './views/Seguimiento';

export default function App() {
  const [user, setUser] = useState(null);
  const [clases, setClases] = useState([]);
  const [activeClassId, setActiveClassId] = useState('');
  const [currentView, setCurrentView] = useState('clases'); // clases, teorico, evaluacion
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toasts, setToasts] = useState([]);

  // Auth form states
  const [authTab, setAuthTab] = useState('login'); // login, register
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ nombre: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Connection listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexión reestablecida. Trabajando en línea.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sin conexión a internet. Los cambios se guardarán localmente.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Register PWA Service Worker if in production/built
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registrado:', reg.scope))
          .catch(err => console.error('Error al registrar Service Worker:', err));
      });
    }

    // Verify session on startup
    const activeUser = api.getCurrentUser();
    if (activeUser) {
      setUser(activeUser);
      loadClases(activeUser.id);
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadClases = (userId, defaultId = null) => {
    setLoading(true);
    api.getClases()
      .then(data => {
        setClases(data);
        // Restore active class from localStorage or select the first one
        const cachedClassId = localStorage.getItem('activeClassId');
        if (defaultId) {
          setActiveClassId(defaultId);
          localStorage.setItem('activeClassId', defaultId);
        } else if (cachedClassId && data.some(c => c.id === cachedClassId)) {
          setActiveClassId(cachedClassId);
        } else if (data.length > 0) {
          setActiveClassId(data[0].id);
          localStorage.setItem('activeClassId', data[0].id);
        } else {
          setActiveClassId('');
        }
      })
      .catch(err => {
        showToast('Error al cargar aulas. Trabajando en modo local.', 'warning');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setActiveClassId(classId);
    localStorage.setItem('activeClassId', classId);
    showToast('Aula activa cambiada', 'success');
  };

  // Toast System
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Auth Operations
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setAuthError('Por favor complete todos los campos');
      return;
    }

    setSubmittingAuth(true);
    setAuthError('');
    
    api.login(loginForm.email, loginForm.password)
      .then(activeUser => {
        setUser(activeUser);
        showToast(`¡Bienvenida, ${activeUser.nombre}!`, 'success');
        loadClases(activeUser.id);
      })
      .catch(err => {
        setAuthError(err.message || 'Credenciales inválidas');
      })
      .finally(() => {
        setSubmittingAuth(false);
      });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registerForm.nombre || !registerForm.email || !registerForm.password) {
      setAuthError('Por favor complete todos los campos');
      return;
    }

    setSubmittingAuth(true);
    setAuthError('');

    api.register(registerForm.email, registerForm.password, registerForm.nombre)
      .then(() => {
        showToast('Registro exitoso. Iniciando sesión...', 'success');
        // Auto login after register
        return api.login(registerForm.email, registerForm.password);
      })
      .then(activeUser => {
        setUser(activeUser);
        loadClases(activeUser.id);
      })
      .catch(err => {
        setAuthError(err.message || 'Error en el registro');
      })
      .finally(() => {
        setSubmittingAuth(false);
      });
  };

  const handleLogout = () => {
    if (window.confirm('¿Está seguro de cerrar sesión?')) {
      api.logout();
      setUser(null);
      setClases([]);
      setActiveClassId('');
      setCurrentView('clases');
      showToast('Sesión cerrada con éxito', 'success');
    }
  };

  const handleRefreshClases = (newActiveId = null) => {
    if (user) {
      loadClases(user.id, newActiveId);
    }
  };

  // Render proper sub-view based on currentView state
  const renderView = () => {
    switch (currentView) {
      case 'clases':
        return (
          <ClasesRegistro 
            clases={clases}
            activeClassId={activeClassId}
            setActiveClassId={setActiveClassId}
            onRefreshClases={handleRefreshClases}
            showToast={showToast}
          />
        );
      case 'teorico':
        return <MarcoTeorico />;

      case 'evaluacion':
        return (
          <EvaluacionDashboard 
            activeClassId={activeClassId}
            showToast={showToast}
          />
        );
      case 'seguimiento':
        return (
          <Seguimiento
            activeClassId={activeClassId}
            showToast={showToast}
          />
        );
      default:
        return <div style={{ color: 'var(--text-white)' }}>Vista no encontrada</div>;
    }
  };

  // Initial loader
  if (loading && !user) {
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

  // AUTHENTICATION SCREEN (LOGIN / REGISTER)
  if (!user) {
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
            <button 
              className={`btn btn-sm ${authTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              style={{ flex: 1 }}
            >
              Iniciar Sesión
            </button>
            <button 
              className={`btn btn-sm ${authTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setAuthTab('register'); setAuthError(''); }}
              style={{ flex: 1 }}
            >
              Registrarse
            </button>
          </div>

          {authError && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              {authError}
            </div>
          )}

          {/* LOGIN FORM */}
          {authTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form active">
              <h3 className="form-title">Ingreso para Docentes</h3>
              <div className="input-group">
                <label>Correo Electrónico:</label>
                <input 
                  type="email" 
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@escuela.com" 
                  required
                />
              </div>
              <div className="input-group">
                <label>Contraseña:</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••" 
                  required
                />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={submittingAuth}>
                {submittingAuth ? 'Accediendo...' : 'Ingresar al Entorno'}
              </button>
              <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem' }}>
                Credenciales de prueba: <strong style={{ color: 'var(--text-white)' }}>docente@escuela.com</strong> / <strong style={{ color: 'var(--text-white)' }}>password123</strong>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {authTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-form active">
              <h3 className="form-title">Registro de Investigador</h3>
              <div className="input-group">
                <label>Nombre y Apellidos:</label>
                <input 
                  type="text" 
                  value={registerForm.nombre}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Prof. Ana María" 
                  required
                />
              </div>
              <div className="input-group">
                <label>Correo Electrónico:</label>
                <input 
                  type="email" 
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@escuela.com" 
                  required
                />
              </div>
              <div className="input-group">
                <label>Contraseña:</label>
                <input 
                  type="password" 
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres" 
                  required
                />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={submittingAuth}>
                {submittingAuth ? 'Registrando...' : 'Completar Registro'}
              </button>
            </form>
          )}
        </div>

        {/* TOAST SYSTEM (AUTH SCREEN) */}
        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast toast-${t.type}`}>
                <span>{t.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // MAIN DASHBOARD LAYOUT
  const userInitials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const activeClassObj = clases.find(c => c.id === activeClassId);

  return (
    <div className="app-container">
      <div className="dashboard-layout">
        
        {/* SIDEBAR MOBILE OVERLAY */}
        {isSidebarActive && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
              background: 'rgba(0,0,0,0.4)', zIndex: 99,
              backdropFilter: 'blur(2px)'
            }}
            onClick={() => setIsSidebarActive(false)}
          />
        )}
        
        {/* SIDEBAR NAVIGATION */}
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

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            <button 
              className={`btn nav-item ${currentView === 'clases' ? 'active' : ''}`}
              onClick={() => { setCurrentView('clases'); setIsSidebarActive(false); }}
            >
              <Home size={18} />
              Mis Aulas & Registro
            </button>

            <button 
              className={`btn nav-item ${currentView === 'teorico' ? 'active' : ''}`}
              onClick={() => { setCurrentView('teorico'); setIsSidebarActive(false); }}
            >
              <BookOpen size={18} />
              Marco Teórico
            </button>



            <button 
              className={`btn nav-item ${!activeClassId ? 'nav-class-locked' : ''} ${currentView === 'evaluacion' ? 'active' : ''}`}
              onClick={() => { 
                if (!activeClassId) {
                  showToast('Debe seleccionar o registrar una clase activa en "Mis Aulas"', 'warning');
                  return;
                }
                setCurrentView('evaluacion'); 
                setIsSidebarActive(false); 
              }}
              title={!activeClassId ? "Bloqueado hasta seleccionar aula" : ""}
            >
              <Clipboard size={18} />
              Rúbricas & Evaluación
            </button>

            <button 
              className={`btn nav-item ${!activeClassId ? 'nav-class-locked' : ''} ${currentView === 'seguimiento' ? 'active' : ''}`}
              onClick={() => { 
                if (!activeClassId) {
                  showToast('Debe seleccionar o registrar una clase activa en "Mis Aulas"', 'warning');
                  return;
                }
                setCurrentView('seguimiento'); 
                setIsSidebarActive(false); 
              }}
              title={!activeClassId ? "Bloqueado hasta seleccionar aula" : ""}
            >
              <BarChart2 size={18} />
              Seguimiento & Informes
            </button>
          </nav>

          {/* Sidebar user footer */}
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">{user.nombre}</span>
                <span className="user-role">Maestro Investigador</span>
              </div>
            </div>
            <button className="btn btn-icon-only btn-logout" onClick={handleLogout} title="Cerrar Sesión">
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* WORKSPACE CONTENT AREA */}
        <main className="workspace">
          
          {/* Header */}
          <header className="workspace-header">
            <div className="header-left">
              <button 
                className="btn btn-icon-only mobile-only" 
                onClick={() => setIsSidebarActive(!isSidebarActive)}
              >
                {isSidebarActive ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              {activeClassId && activeClassObj && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>AULA ACTIVA</span>
                  <span className="text-white" style={{ fontWeight: '800', fontSize: '1.25rem', fontFamily: 'var(--font-outfit)', marginTop: '-0.2rem' }}>
                    {activeClassObj.nombre}
                  </span>
                </div>
              )}
            </div>

            <div className="header-right">
              {/* Online/Offline Status Indicator */}
              <div className={`connection-status-badge ${isOnline ? '' : 'offline'}`}>
                {isOnline ? <Wifi size={14} className="text-green-600" /> : <WifiOff size={14} className="text-red-600" />}
                <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {/* Class Dropdown Selector */}
              {clases.length > 0 && (
                <div className="class-selector">
                  <label htmlFor="active-class-select">Aula:</label>
                  <select 
                    id="active-class-select" 
                    value={activeClassId} 
                    onChange={handleClassChange}
                  >
                    <option value="" disabled>Seleccione aula...</option>
                    {clases.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.grado})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </header>

          {/* Workspace Views */}
          <div className="workspace-content">
            {renderView()}
          </div>
        </main>
      </div>

      {/* TOAST SYSTEM */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
