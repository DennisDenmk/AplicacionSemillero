import React, { useState, useEffect, useRef } from 'react';
import { Home, Users, BookOpen, Grid, Plus, Trash2, Edit2, Upload, FileText, X, AlertCircle, Loader, Percent, ShieldCheck, User, Eye } from 'lucide-react';
import { api } from '../../services/api';
import UnidadesDidacticas from './UnidadesDidacticas';
import SectionHome from '../components/SectionHome';
import SubViewHeader from '../components/SubViewHeader';

function StudentProfile({ alumno, activeClassName, onBack, showToast, onNavigate }) {
  const [profileTab, setProfileTab] = useState('progreso'); // 'progreso' | 'historial' | 'notas'
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getEvaluacionesAlumno(alumno.id),
      api.getUnidades(alumno.claseId)
    ])
      .then(([evs, uns]) => {
        setEvaluaciones(evs);
        setUnidades(uns);
      })
      .catch(e => showToast(e.message || 'Error al cargar perfil', 'danger'))
      .finally(() => setLoading(false));
  }, [alumno]);

  const getEvaluatedCount = (rubrica) => {
    if (!rubrica) return 0;
    const keys = ['clasificacion', 'seriacion', 'construccion', 'pensamientoLogico', 'metacognicion'];
    return keys.filter(k => rubrica[k] && ['I', 'EP', 'L'].includes(rubrica[k])).length;
  };

  const getCritLabel = (crit) => {
    switch (crit) {
      case 'clasificacion': return 'Clasificación de información';
      case 'seriacion': return 'Seriación y ordenamiento';
      case 'construccion': return 'Construcción de conocimiento';
      case 'pensamientoLogico': return 'Pensamiento lógico';
      case 'metacognicion': return 'Metacognición';
      default: return crit;
    }
  };

  const getCritBadge = (val) => {
    switch (val) {
      case 'L': return <span className="badge badge-achieved">Logrado</span>;
      case 'EP': return <span className="badge badge-progress" style={{ background: '#fef3c7', color: '#d97706' }}>En Proceso</span>;
      case 'I': return <span className="badge badge-initiated">Iniciado</span>;
      default: return <span style={{ color: 'var(--text-muted)' }}>Sin calificar</span>;
    }
  };

  const latestEval = evaluaciones.length > 0 
    ? evaluaciones[evaluaciones.length - 1] 
    : null;

  const activeUnit = latestEval && unidades.find(u => u.id === latestEval.unidadId);

  return (
    <div className="student-profile-view animate-slide-up" style={{ padding: '8px' }}>
      {/* Top Header Row matching the image */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={onBack} 
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}
          >
            ← {activeClassName}
          </button>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            Perfil del alumno
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-primary btn-sm" 
            style={{ background: '#2563eb', borderColor: '#2563eb', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
            onClick={() => onNavigate('evaluacion')}
          >
            Evaluar
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#1e293b', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
            onClick={() => onNavigate('seguimiento', { subView: 'individual', alumnoId: alumno.id })}
          >
            Ficha de monitoreo
          </button>
        </div>
      </div>

      {/* Main Student Header Card matching the image */}
      <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '24px' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: '#dbeafe', color: '#2563eb', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.35rem', fontWeight: 700 
        }}>
          {alumno.nombre.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            {alumno.nombre}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#64748b' }}>
            {activeClassName} · Representante: {alumno.representante || '—'} · {alumno.telefono || '—'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0', marginBottom: '24px' }}>
        {['progreso', 'historial', 'notas'].map(tab => (
          <button
            key={tab}
            onClick={() => setProfileTab(tab)}
            style={{
              background: 'none', border: 'none', padding: '12px 18px', cursor: 'pointer',
              fontSize: '0.95rem', fontWeight: profileTab === tab ? 700 : 500,
              color: profileTab === tab ? '#2563eb' : '#64748b',
              borderBottom: profileTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              textTransform: 'capitalize', transition: 'all 0.2s', marginBottom: '-1px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader className="spinner" /></div>
      ) : (
        <>
          {profileTab === 'progreso' && (
            <div>
              {/* Rúbrica cognitiva Card */}
              <div className="glass" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                    Rúbrica cognitiva — {activeUnit ? activeUnit.titulo : 'Última Unidad'}
                  </h3>
                  {latestEval && getEvaluatedCount(latestEval.rubrica) === 5 ? (
                    <span className="badge badge-achieved" style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', fontSize: '0.8rem' }}>Completo</span>
                  ) : (
                    <span className="badge badge-progress" style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', fontSize: '0.8rem' }}>En Proceso</span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['clasificacion', 'seriacion', 'construccion', 'pensamientoLogico', 'metacognicion'].map(key => {
                    const val = latestEval ? latestEval.rubrica?.[key] : null;
                    return (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 }}>
                          {getCritLabel(key)}
                        </span>
                        {getCritBadge(val)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progreso por unidad Card */}
              <div className="glass" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                  Progreso por unidad
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {unidades.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center' }}>No hay unidades registradas en este grupo.</div>
                  ) : unidades.map(u => {
                    const uEval = evaluaciones.find(e => e.unidadId === u.id);
                    const evalCount = getEvaluatedCount(uEval?.rubrica);
                    const percent = (evalCount / 5) * 100;
                    return (
                      <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: '#1e293b', fontWeight: 600 }}>{u.titulo}</span>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>{evalCount}/5 criterios</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: '#2563eb', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {profileTab === 'historial' && (
            <div className="glass" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                Historial de Evaluaciones
              </h3>
              {evaluaciones.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center', padding: '24px' }}>No hay evaluaciones registradas para este estudiante.</div>
              ) : (
                <div className="table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Fecha</th>
                        <th style={{ padding: '12px' }}>Criterios Evaluados</th>
                        <th style={{ padding: '12px' }}>Observación Escrita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluaciones.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(e.createdAt).toLocaleDateString('es-EC')}</td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge badge-progress" style={{ background: '#dbeafe', color: '#2563eb', padding: '4px 8px' }}>
                              {getEvaluatedCount(e.rubrica)}/5
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#475569', fontSize: '0.9rem' }}>{e.notaEscrita || 'Sin observaciones'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {profileTab === 'notas' && (
            <div className="glass" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                Observaciones y Notas
              </h3>
              {evaluaciones.filter(e => e.notaEscrita).length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center', padding: '24px' }}>No hay observaciones registradas para este estudiante.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {evaluaciones.filter(e => e.notaEscrita).map(e => {
                    const u = unidades.find(un => un.id === e.unidadId);
                    return (
                      <div key={e.id} style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          <span>{u ? u.titulo : 'Evaluación'}</span>
                          <span>{new Date(e.createdAt).toLocaleDateString('es-EC')}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.6 }}>
                          {e.notaEscrita}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ClasesRegistro({ 
  clases, 
  activeClassId, 
  setActiveClassId, 
  onRefreshClases, 
  showToast,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState(null); // null = home, 'aulas' | 'unidades'
  const [selectedAlumnoPerfil, setSelectedAlumnoPerfil] = useState(null);

  // --- STATE FOR ALUMNOS ---
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [showAddAlumnoModal, setShowAddAlumnoModal] = useState(false);
  const [alumnoForm, setAlumnoForm] = useState({ id: '', nombre: '', representante: '', padreCorreo: '', telefono: '' });

  // --- STATE FOR NEW CLASS MODAL ---
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ nombre: '', grado: '' });
  const [saving, setSaving] = useState(false);

  // Load students when active class changes
  useEffect(() => {
    setActiveTab(null);
    setSelectedAlumnoPerfil(null);
    if (activeClassId) {
      refreshAlumnos();
    } else {
      setAlumnos([]);
    }
  }, [activeClassId]);

  const refreshAlumnos = () => {
    setLoadingAlumnos(true);
    api.getAlumnos(activeClassId)
      .then(data => setAlumnos(data))
      .catch(err => showToast(err.message || 'Error al cargar alumnos', 'danger'))
      .finally(() => setLoadingAlumnos(false));
  };



  // --- CLASSES CRUD LÓGICA ---
  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!classForm.nombre) {
      showToast('El nombre del aula es requerido', 'warning');
      return;
    }

    setSaving(true);
    api.createClase(classForm.nombre, classForm.grado || 'General')
      .then(newClase => {
        showToast('Aula creada exitosamente', 'success');
        setShowAddClassModal(false);
        setClassForm({ nombre: '', grado: '' });
        onRefreshClases(newClase.id);
      })
      .catch(err => showToast(err.message || 'Error al crear aula', 'danger'))
      .finally(() => setSaving(false));
  };

  const handleDeleteClass = (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Está seguro de eliminar esta aula? Se borrarán todos los estudiantes, tareas didácticas y calificaciones asociadas.')) {
      api.deleteClase(id)
        .then(() => {
          showToast('Aula eliminada', 'success');
          onRefreshClases(null);
        })
        .catch(err => showToast(err.message || 'Error al eliminar aula', 'danger'));
    }
  };

  // --- ALUMNOS CRUD LÓGICA ---
  const handleSaveAlumno = (e) => {
    e.preventDefault();
    if (!alumnoForm.nombre || !alumnoForm.padreCorreo) {
      showToast('Nombre y correo del tutor son requeridos', 'warning');
      return;
    }
    const EMPTY = { id: '', nombre: '', representante: '', padreCorreo: '', telefono: '' };
    setSaving(true);
    if (alumnoForm.id) {
      api.updateAlumno(alumnoForm.id, alumnoForm.nombre, alumnoForm.padreCorreo, alumnoForm.representante, alumnoForm.telefono)
        .then(() => { showToast('Estudiante actualizado', 'success'); setShowAddAlumnoModal(false); setAlumnoForm(EMPTY); refreshAlumnos(); })
        .catch(err => showToast(err.message || 'Error al actualizar alumno', 'danger'))
        .finally(() => setSaving(false));
    } else {
      api.createAlumno(activeClassId, alumnoForm.nombre, alumnoForm.padreCorreo, alumnoForm.representante, alumnoForm.telefono)
        .then(() => { showToast('Estudiante registrado exitosamente', 'success'); setShowAddAlumnoModal(false); setAlumnoForm(EMPTY); refreshAlumnos(); })
        .catch(err => showToast(err.message || 'Error al registrar alumno', 'danger'))
        .finally(() => setSaving(false));
    }
  };

  const handleEditAlumnoClick = (alumno) => {
    setAlumnoForm({ id: alumno.id, nombre: alumno.nombre, representante: alumno.representante || '', padreCorreo: alumno.padreCorreo, telefono: alumno.telefono || '' });
    setShowAddAlumnoModal(true);
  };

  const handleDeleteAlumno = (id) => {
    if (window.confirm('¿Está seguro de eliminar este estudiante? Se perderán todas sus calificaciones.')) {
      api.deleteAlumno(id)
        .then(() => {
          showToast('Estudiante eliminado', 'success');
          refreshAlumnos();
        })
        .catch(err => showToast(err.message || 'Error al eliminar estudiante', 'danger'));
    }
  };





  return (
    <div className="sub-view animate-slide-up">
      <div className="section-header">
        <div>
          <h1 className="section-title">Registro & Gestión Curricular</h1>
          <p className="section-subtitle">Administre sus aulas, registre alumnos, defina actividades didácticas y califique</p>
        </div>
        <Home className="text-indigo-600" size={36} />
      </div>

      {/* Primary Selection Indicator */}
      {/* =====================================================
          GESTIÓN DE GRUPOS — siempre visible (RF-D01)
          ===================================================== */}
      {!activeClassId && (
        <div style={{ marginBottom: '2rem' }}>
          {/* Header row siempre visible */}
        <div className="section-header-row" style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 className="font-outfit text-white" style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>
              Mis Grupos / Aulas
            </h3>
            <span style={{
              background: 'rgba(79,70,229,0.12)', color: 'var(--accent-primary)',
              borderRadius: '999px', padding: '0.15rem 0.65rem', fontSize: '0.78rem', fontWeight: 700
            }}>{clases.length}</span>
            {activeClassId && (
              <span style={{
                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                borderRadius: '999px', padding: '0.15rem 0.65rem', fontSize: '0.72rem', fontWeight: 600
              }}>
                Activa: {clases.find(c => c.id === activeClassId)?.nombre}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {activeClassId && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveClassId('')}
                title="Ver todos los grupos"
              >
                Cambiar grupo
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddClassModal(true)}>
              <Plus size={15} /> Nuevo Grupo
            </button>
          </div>
        </div>

        {/* Listado de grupos */}
        {clases.length === 0 ? (
          <div className="glass" style={{ padding: '2.5rem', textAlign: 'center', borderRadius: '20px', background: '#fff' }}>
            <Users size={44} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
            <h4 className="font-outfit text-white" style={{ fontWeight: 'bold', fontSize: '1rem' }}>No tiene grupos registrados</h4>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Cree su primer grupo (ej: "Sección A — 4 años") para comenzar.
            </p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setShowAddClassModal(true)}>
              <Plus size={15} /> Crear Primer Grupo
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {clases.map((c, index) => {
              const isActive = c.id === activeClassId;
              const borderColors = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
              const accentColor = borderColors[index % borderColors.length];
              
              const initialsColors = ['#7c3aed', '#22c55e', '#0ea5e9', '#f59e0b', '#ec4899'];
              
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveClassId(c.id)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '0',
                    cursor: 'pointer',
                    boxShadow: isActive ? `0 0 0 2px ${accentColor}40, 0 10px 25px -5px rgba(0,0,0,0.05)` : '0 4px 15px -3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${isActive ? accentColor : 'rgba(148,163,184,0.15)'}`
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Colored Top Border */}
                  <div style={{ height: '6px', width: '100%', background: accentColor }} />
                  
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
                        {c.nombre}
                      </h4>
                      <button
                        title="Eliminar grupo"
                        onClick={e => handleDeleteClass(c.id, e)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--danger)', padding: '0.2rem', opacity: 0.5,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <BookOpen size={14} />
                        <span>{c.grado}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={14} />
                        <span>{c.numAlumnos || 0} alumnos</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {c.alumnosNombres && c.alumnosNombres.length > 0 ? (
                        <>
                          {c.alumnosNombres.slice(0, 3).map((name, i) => (
                            <div key={i} style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: initialsColors[i % initialsColors.length], color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.65rem', fontWeight: 700,
                              border: '2px solid #ffffff', marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i
                            }}>
                              {name.substring(0, 2).toUpperCase()}
                            </div>
                          ))}
                          {(c.numAlumnos > 3) && (
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: '#f1f5f9', color: '#64748b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.65rem', fontWeight: 700,
                              border: '2px solid #ffffff', marginLeft: '-8px', zIndex: 0
                            }}>
                              +{c.numAlumnos - 3}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sin alumnos</span>
                      )}
                    </div>
                    
                    <span style={{ color: '#94a3b8' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {activeClassId && (
        <div>
          {/* ── HOME: sin tab seleccionado ── */}
          {!activeTab && (
            <div className="animate-slide-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                  onClick={() => setActiveClassId('')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.9rem', borderRadius: '10px', cursor: 'pointer',
                    background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)',
                    color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
                    transition: 'all 0.15s', flexShrink: 0
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.08)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> 
                  Volver a Mis Grupos
                </button>
                <div>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-white)', fontFamily: 'Outfit, sans-serif' }}>
                    {clases.find(c => c.id === activeClassId)?.nombre || 'Grupo Activo'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Seleccione una sección para gestionar</p>
                </div>
              </div>
              <SectionHome
                onSelect={setActiveTab}
                cards={[
                  {
                    id: 'aulas', icon: <Users size={22} />, color: '#4f46e5',
                    title: 'Alumnos Registrados',
                    description: 'Agregue, edite o elimine estudiantes del grupo.',
                    badge: alumnos.length > 0 ? `${alumnos.length} alumnos` : 'Vacío'
                  },
                  {
                    id: 'unidades', icon: <BookOpen size={22} />, color: '#0891b2',
                    title: 'Unidades Didácticas',
                    description: 'Cree y gestione unidades con sus tareas didácticas anidadas.',
                  }
                ]}
              />
            </div>
          )}

          {/* ── TAB: ALUMNOS ── */}
          {activeTab === 'aulas' && (
            selectedAlumnoPerfil ? (
              <StudentProfile 
                alumno={selectedAlumnoPerfil} 
                activeClassName={clases.find(c => c.id === activeClassId)?.nombre || 'Aula'} 
                onBack={() => setSelectedAlumnoPerfil(null)} 
                showToast={showToast} 
                onNavigate={onNavigate}
              />
            ) : (
              <div className="sub-view">
                <SubViewHeader
                  onBack={() => setActiveTab(null)}
                  title="Alumnos Registrados"
                  subtitle="Gestione los estudiantes del grupo"
                  icon={<Users size={18} />}
                  actions={
                    <button className="btn btn-primary btn-sm" onClick={() => { setAlumnoForm({ id: '', nombre: '', representante: '', padreCorreo: '', telefono: '' }); setShowAddAlumnoModal(true); }}>
                      <Plus size={15} /> Agregar Estudiante
                    </button>
                  }
                />

                {loadingAlumnos ? (
                  <div className="loading-container">
                    <Loader className="spinner" />
                  </div>
                ) : alumnos.length === 0 ? (
                  <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px', background: '#ffffff' }}>
                    <Users size={40} className="text-muted" style={{ margin: '0 auto 1rem' }} />
                    <h4 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>No hay estudiantes registrados</h4>
                    <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      Agregue su primer estudiante en este aula para comenzar a calificar sus actividades.
                    </p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre del Niño</th>
                          <th>Correo del Padre/Tutor</th>
                          <th style={{ width: '25%' }} className="text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnos.map(a => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 'bold', color: 'var(--text-white)' }}>{a.nombre}</td>
                            <td>{a.padreCorreo}</td>
                            <td className="text-right">
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button 
                                  className="btn btn-ghost btn-sm" 
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}
                                  onClick={() => setSelectedAlumnoPerfil(a)} 
                                  title="Ver Perfil"
                                >
                                  <Eye size={12} /> Perfil
                                </button>
                                <button className="btn-icon-only btn-sm" onClick={() => handleEditAlumnoClick(a)} title="Editar">
                                  <Edit2 size={14} />
                                </button>
                                <button className="btn-icon-only btn-sm" onClick={() => handleDeleteAlumno(a.id)} style={{ color: 'var(--danger)' }} title="Eliminar">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          )}

          {/* ── TAB: UNIDADES DIDÁCTICAS ── */}
          {activeTab === 'unidades' && (
            <div>
              <SubViewHeader onBack={() => setActiveTab(null)} title="Unidades Didácticas" subtitle="Planifique, clone y archive unidades curriculares" icon={<BookOpen size={18} />} />
              <UnidadesDidacticas claseId={activeClassId} showToast={showToast} />
            </div>
          )}


        </div>
      )}

      {/* ==========================================
          MODALS & FLOATING POPUPS SYSTEM
          ========================================== */}

      {/* 1. Modal: Add/Edit Student */}
      {showAddAlumnoModal && (
        <div className="modal-overlay" onClick={() => setShowAddAlumnoModal(false)}>
          <div className="modal-box animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {alumnoForm.id ? 'Modificar Registro de Niño' : 'Registrar Nuevo Niño en Estudio'}
              </h3>
              <button className="btn-close-modal" onClick={() => setShowAddAlumnoModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveAlumno} className="modal-form">
              <div className="input-group">
                <label>Nombre Completo del Niño:</label>
                <input 
                  type="text" 
                  value={alumnoForm.nombre} 
                  onChange={(e) => setAlumnoForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Mateo Alejandro Silva" 
                  required
                />
              </div>
              <div className="input-group">
                <label>Representante / Tutor Legal:</label>
                <input 
                  type="text" 
                  value={alumnoForm.representante} 
                  onChange={(e) => setAlumnoForm(prev => ({ ...prev, representante: e.target.value }))}
                  placeholder="Ej: María Silva (madre)"
                />
              </div>
              <div className="input-group">
                <label>Correo del Padre/Madre/Tutor: *</label>
                <input 
                  type="email" 
                  value={alumnoForm.padreCorreo} 
                  onChange={(e) => setAlumnoForm(prev => ({ ...prev, padreCorreo: e.target.value }))}
                  placeholder="Ej: padre.mateo@gmail.com" 
                  required
                />
                <span className="input-hint">Utilizado para enviar el informe de desarrollo cognitivo final.</span>
              </div>
              <div className="input-group">
                <label>Teléfono de Contacto:</label>
                <input 
                  type="tel" 
                  value={alumnoForm.telefono} 
                  onChange={(e) => setAlumnoForm(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Ej: 0987654321"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAlumnoModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Loader className="spinner" size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} />
                      Procesando...
                    </span>
                  ) : (
                    alumnoForm.id ? 'Actualizar Datos' : 'Registrar Estudiante'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Create Class */}
      {showAddClassModal && (
        <div className="modal-overlay" onClick={() => setShowAddClassModal(false)}>
          <div className="modal-box animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Crear Aula de Investigación</h3>
              <button className="btn-close-modal" onClick={() => setShowAddClassModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="modal-form">
              <div className="input-group">
                <label>Nombre del Aula / Sección:</label>
                <input 
                  type="text" 
                  value={classForm.nombre} 
                  onChange={(e) => setClassForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Aula Roja - Los Exploradores" 
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddClassModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Loader className="spinner" size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} />
                      Registrando...
                    </span>
                  ) : (
                    'Registrar Aula'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
}
