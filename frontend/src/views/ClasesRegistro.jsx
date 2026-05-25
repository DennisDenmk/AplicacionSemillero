import React, { useState, useEffect, useRef } from 'react';
import { Home, Users, BookOpen, Grid, Plus, Trash2, Edit2, Upload, FileText, X, AlertCircle, Loader, Percent, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import UnidadesDidacticas from './UnidadesDidacticas';
import SectionHome from '../components/SectionHome';
import SubViewHeader from '../components/SubViewHeader';

export default function ClasesRegistro({ 
  clases, 
  activeClassId, 
  setActiveClassId, 
  onRefreshClases, 
  showToast 
}) {
  const [activeTab, setActiveTab] = useState(null); // null = home, 'aulas' | 'unidades' | 'notas' | 'tareas'
  
  // --- STATE FOR ALUMNOS ---
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [showAddAlumnoModal, setShowAddAlumnoModal] = useState(false);
  const [alumnoForm, setAlumnoForm] = useState({ id: '', nombre: '', representante: '', padreCorreo: '', telefono: '' });
  
  // --- STATE FOR TAREAS (TASKS) ---
  const [tareas, setTareas] = useState([]);
  const [loadingTareas, setLoadingTareas] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  
  // Custom states for task uploads
  const [taskForm, setTaskForm] = useState({
    titulo: '',
    imagenUrl: '',
    actividadTipo: 'CLASIFICAR',
    categorias: '',
    preguntas: '',
    respuestaEsperada: '',
    elementos: '',
    presentacion: ''
  });
  
  const [taskMaterials, setTaskMaterials] = useState([]); // [{ id, nombre, archivoUrl }]
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  
  const imageInputRef = useRef(null);
  const materialInputRef = useRef(null);

  // --- STATE FOR GRADES MATRIX ---
  const [notas, setNotas] = useState([]);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedGradeCell, setSelectedGradeCell] = useState({ alumnoId: '', tareaId: '', alumnoNombre: '', tareaTitulo: '', valor: '', comentario: '' });

  // --- STATE FOR NEW CLASS MODAL ---
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ nombre: '', grado: '' });

  // Load students, tasks and grades when active class changes
  useEffect(() => {
    setActiveTab(null); // always go back to home when switching groups
    if (activeClassId) {
      refreshAlumnos();
      refreshTareas();
      refreshNotas();
    } else {
      setAlumnos([]);
      setTareas([]);
      setNotas([]);
    }
  }, [activeClassId]);

  const refreshAlumnos = () => {
    setLoadingAlumnos(true);
    api.getAlumnos(activeClassId)
      .then(data => setAlumnos(data))
      .catch(err => showToast(err.message || 'Error al cargar alumnos', 'danger'))
      .finally(() => setLoadingAlumnos(false));
  };

  const refreshTareas = () => {
    setLoadingTareas(true);
    api.getTareas(activeClassId)
      .then(data => setTareas(data))
      .catch(err => showToast(err.message || 'Error al cargar tareas', 'danger'))
      .finally(() => setLoadingTareas(false));
  };

  const refreshNotas = () => {
    setLoadingNotas(true);
    api.getNotas(activeClassId)
      .then(data => setNotas(data))
      .catch(err => showToast(err.message || 'Error al cargar calificaciones', 'danger'))
      .finally(() => setLoadingNotas(false));
  };

  // --- CLASSES CRUD LÓGICA ---
  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!classForm.nombre || !classForm.grado) {
      showToast('Todos los campos son requeridos', 'warning');
      return;
    }

    api.createClase(classForm.nombre, classForm.grado)
      .then(newClase => {
        showToast('Aula creada exitosamente', 'success');
        setShowAddClassModal(false);
        setClassForm({ nombre: '', grado: '' });
        onRefreshClases(newClase.id);
      })
      .catch(err => showToast(err.message || 'Error al crear aula', 'danger'));
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
    if (alumnoForm.id) {
      api.updateAlumno(alumnoForm.id, alumnoForm.nombre, alumnoForm.padreCorreo, alumnoForm.representante, alumnoForm.telefono)
        .then(() => { showToast('Estudiante actualizado', 'success'); setShowAddAlumnoModal(false); setAlumnoForm(EMPTY); refreshAlumnos(); })
        .catch(err => showToast(err.message || 'Error al actualizar alumno', 'danger'));
    } else {
      api.createAlumno(activeClassId, alumnoForm.nombre, alumnoForm.padreCorreo, alumnoForm.representante, alumnoForm.telefono)
        .then(() => { showToast('Estudiante registrado exitosamente', 'success'); setShowAddAlumnoModal(false); setAlumnoForm(EMPTY); refreshAlumnos(); })
        .catch(err => showToast(err.message || 'Error al registrar alumno', 'danger'));
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
          refreshNotas();
        })
        .catch(err => showToast(err.message || 'Error al eliminar estudiante', 'danger'));
    }
  };

  // --- TAREAS DIDÁCTICAS UPLOADS & CRUD LÓGICA ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    api.uploadFile(file)
      .then(res => {
        showToast('Imagen del material didáctico cargada', 'success');
        setTaskForm(prev => ({ ...prev, imagenUrl: res.url }));
      })
      .catch(err => showToast(err.message || 'Error al subir imagen', 'danger'))
      .finally(() => setUploadingImage(false));
  };

  const handleMaterialUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMaterial(true);
    api.uploadFile(file)
      .then(res => {
        showToast('Ficha de soporte adjuntada', 'success');
        const newMaterial = {
          id: 'mat-' + Date.now(),
          nombre: res.originalName,
          archivoUrl: res.url
        };
        setTaskMaterials(prev => [...prev, newMaterial]);
      })
      .catch(err => showToast(err.message || 'Error al subir material', 'danger'))
      .finally(() => setUploadingMaterial(false));
  };

  const handleRemoveMaterial = (id) => {
    setTaskMaterials(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskForm.titulo || !taskForm.imagenUrl) {
      showToast('El título y la imagen didáctica son obligatorios', 'warning');
      return;
    }

    const payload = {
      titulo: taskForm.titulo,
      imagenUrl: taskForm.imagenUrl,
      actividadTipo: taskForm.actividadTipo,
      detalles: taskForm.actividadTipo === 'CLASIFICAR' ? {
        categorias: taskForm.categorias,
        preguntas: taskForm.preguntas,
        respuestaEsperada: taskForm.respuestaEsperada
      } : {
        elementos: taskForm.elementos,
        presentacion: taskForm.presentacion
      },
      materiales: taskMaterials
    };

    api.createTarea(activeClassId, payload)
      .then(() => {
        showToast('Ficha didáctica registrada en el catálogo', 'success');
        setShowAddTaskModal(false);
        resetTaskForm();
        refreshTareas();
      })
      .catch(err => showToast(err.message || 'Error al registrar tarea', 'danger'));
  };

  const resetTaskForm = () => {
    setTaskForm({
      titulo: '',
      imagenUrl: '',
      actividadTipo: 'CLASIFICAR',
      categorias: '',
      preguntas: '',
      respuestaEsperada: '',
      elementos: '',
      presentacion: ''
    });
    setTaskMaterials([]);
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta ficha didáctica del catálogo? Se borrarán sus calificaciones registradas.')) {
      api.deleteTarea(id)
        .then(() => {
          showToast('Ficha didáctica eliminada', 'success');
          refreshTareas();
          refreshNotas();
        })
        .catch(err => showToast(err.message || 'Error al eliminar tarea', 'danger'));
    }
  };

  // --- CALIFICACIONES (MATRIX) LÓGICA ---
  const handleOpenGradeModal = (alumno, tarea) => {
    const existingGrade = notas.find(n => n.alumnoId === alumno.id && n.tareaId === tarea.id);
    setSelectedGradeCell({
      alumnoId: alumno.id,
      tareaId: tarea.id,
      alumnoNombre: alumno.nombre,
      tareaTitulo: tarea.titulo,
      valor: existingGrade ? existingGrade.valor : '',
      comentario: existingGrade ? existingGrade.comentario : ''
    });
    setShowGradeModal(true);
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (selectedGradeCell.valor === '') {
      showToast('Por favor, ingrese una calificación', 'warning');
      return;
    }

    const val = parseFloat(selectedGradeCell.valor);
    if (isNaN(val) || val < 0 || val > 10) {
      showToast('La calificación debe ser un valor entre 0 y 10', 'warning');
      return;
    }

    api.saveNota(
      selectedGradeCell.alumnoId,
      selectedGradeCell.tareaId,
      val,
      selectedGradeCell.comentario
    )
      .then(() => {
        showToast('Calificación registrada con éxito', 'success');
        setShowGradeModal(false);
        refreshNotas();
      })
      .catch(err => showToast(err.message || 'Error al calificar', 'danger'));
  };

  const getGradeBoxClass = (val) => {
    if (val === undefined || val === null || val === '') return 'grade-null';
    const num = parseFloat(val);
    if (num >= 8.5) return 'grade-high';
    if (num >= 5.0) return 'grade-medium';
    return 'grade-low';
  };

  // Helper to calculate student GPA
  const getStudentGpa = (alumnoId) => {
    const studentGrades = notas.filter(n => n.alumnoId === alumnoId);
    if (studentGrades.length === 0) return '-';
    const sum = studentGrades.reduce((acc, curr) => acc + curr.valor, 0);
    return (sum / studentGrades.length).toFixed(1);
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
                  description: 'Cree y gestione unidades con actividades, objetivos y criterios.',
                }
              ]}
            />
            </div>
          )}

          {/* ── TAB: ALUMNOS ── */}
          {activeTab === 'aulas' && (
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
                        <th style={{ width: '15%' }} className="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnos.map(a => (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--text-white)' }}>{a.nombre}</td>
                          <td>{a.padreCorreo}</td>
                          <td className="text-right">
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
          )}

          {/* ── TAB: UNIDADES DIDÁCTICAS ── */}
          {activeTab === 'unidades' && (
            <div>
              <SubViewHeader onBack={() => setActiveTab(null)} title="Unidades Didácticas" subtitle="Planifique, clone y archive unidades curriculares" icon={<BookOpen size={18} />} />
              <UnidadesDidacticas claseId={activeClassId} showToast={showToast} />
            </div>
          )}

          {/* --- TAB 3: TAREAS COGNITIVAS (legacy) --- */}
          {activeTab === 'tareas' && (
            <div className="sub-view">
              <div className="section-header-row">
                <div>
                  <h3 className="font-outfit text-white" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Catálogo de Fichas Didácticas</h3>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Materiales gráficos oficiales cargados para realizar pruebas lógicas</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { resetTaskForm(); setShowAddTaskModal(true); }}>
                  <Plus size={16} />
                  Nueva Ficha Didáctica
                </button>
              </div>

              {loadingTareas ? (
                <div className="loading-container">
                  <Loader className="spinner" />
                </div>
              ) : tareas.length === 0 ? (
                <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px', background: '#ffffff' }}>
                  <BookOpen size={40} className="text-muted" style={{ margin: '0 auto 1rem' }} />
                  <h4 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>No hay fichas didácticas cargadas</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Registre un material didáctico subiendo su ilustración y definiendo las metas de categorización lógica.
                  </p>
                </div>
              ) : (
                <div className="cards-grid">
                  {tareas.map(t => (
                    <div key={t.id} className="task-card">
                      <div className="task-image-wrapper">
                        <img 
                          src={t.imagenUrl} 
                          alt={t.titulo} 
                          className="task-image"
                        />
                        <span className={`task-badge badge-${t.actividadTipo.toLowerCase()}`}>
                          {t.actividadTipo}
                        </span>
                      </div>
                      <div className="task-body">
                        <h4 className="task-title">{t.titulo}</h4>
                        
                        <div className="task-summary-list">
                          {t.actividadTipo === 'CLASIFICAR' ? (
                            <>
                              <div className="summary-item">
                                <span className="summary-label">Categorías Esperadas:</span>
                                <span className="summary-value">{t.detalles.categorias}</span>
                              </div>
                              <div className="summary-item">
                                <span className="summary-label">Preguntas de Mediación:</span>
                                <span className="summary-value" style={{ fontStyle: 'italic' }}>"{t.detalles.preguntas}"</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="summary-item">
                                <span className="summary-label">Elementos a Ordenar:</span>
                                <span className="summary-value">{t.detalles.elementos}</span>
                              </div>
                              <div className="summary-item">
                                <span className="summary-label">Presentación Didáctica:</span>
                                <span className="summary-value">{t.detalles.presentacion}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {t.materiales && t.materiales.length > 0 && (
                          <div className="task-materials">
                            <span className="materials-title">Documentos de Soporte:</span>
                            {t.materiales.map(mat => (
                              <a 
                                key={mat.id} 
                                href={mat.archivoUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="material-link"
                              >
                                <FileText size={14} />
                                {mat.nombre}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="task-footer">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteTask(t.id)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddAlumnoModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {alumnoForm.id ? 'Actualizar Datos' : 'Registrar Estudiante'}
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
              <div className="input-group">
                <label>Grado / Nivel de Desarrollo Operacional:</label>
                <input 
                  type="text" 
                  value={classForm.grado} 
                  onChange={(e) => setClassForm(prev => ({ ...prev, grado: e.target.value }))}
                  placeholder="Ej: 4 años (Pre-operacional básico)" 
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddClassModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Aula</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Add Task (Nueva Ficha Didáctica) */}
      {showAddTaskModal && (
        <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
          <div className="modal-box large-modal animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Material / Ficha en el Catálogo</h3>
              <button className="btn-close-modal" onClick={() => setShowAddTaskModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="modal-form">
              <div className="grid-form">
                {/* Column 1: Core details & illustration */}
                <div className="form-column">
                  <div className="input-group">
                    <label>Título de la Actividad Didáctica:</label>
                    <input 
                      type="text" 
                      value={taskForm.titulo}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ej: Identificación de Personas Seguras" 
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Tipo de Tarea Cognitiva (Estadio Piaget):</label>
                    <select 
                      className="select-input"
                      value={taskForm.actividadTipo}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, actividadTipo: e.target.value }))}
                    >
                      <option value="CLASIFICAR">CLASIFICACIÓN (Lotería de categorización)</option>
                      <option value="ORDENAR">SERIACIÓN TEMPORAL (Secuenciación de momentos)</option>
                      <option value="UBICAR">UBICACIÓN ESPACIAL (Fronteras y límites)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Imagen Ilustrativa del Material Didáctico:</label>
                    <div className="file-uploader" style={{ minHeight: '110px' }}>
                      {uploadingImage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
                          <Loader className="spinner" style={{ width: '30px', height: '30px' }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargando ilustración...</span>
                        </div>
                      ) : taskForm.imagenUrl ? (
                        <div className="preview-container">
                          <img src={taskForm.imagenUrl} alt="Preview" />
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setTaskForm(prev => ({ ...prev, imagenUrl: '' }))}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            Eliminar Imagen
                          </button>
                        </div>
                      ) : (
                        <div className="upload-dropzone">
                          <Upload size={32} />
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-white)' }}>
                            Subir archivo de ilustración
                          </span>
                          <span className="file-tip">Formatos soportados: SVG, PNG, JPG (Máx 5MB)</span>
                          <input 
                            type="file" 
                            className="file-input-hidden" 
                            ref={imageInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Specific didactical questions */}
                <div className="form-column">
                  {taskForm.actividadTipo === 'CLASIFICAR' ? (
                    <div className="dynamic-panel">
                      <div className="dynamic-panel-content">
                        <span className="panel-subtitle text-white">Configuración de Clasificación</span>
                        <div className="input-group">
                          <label>Categorías Didácticas Esperadas:</label>
                          <textarea 
                            value={taskForm.categorias}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, categorias: e.target.value }))}
                            placeholder="Ej: Personas de Confianza familiar vs. Personas sospechosas externamente." 
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Preguntas de Mediación Cognitiva:</label>
                          <textarea 
                            value={taskForm.preguntas}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, preguntas: e.target.value }))}
                            placeholder="Ej: ¿Cuáles de estas personas te cuidan en la calle? ¿Qué harías si un desconocido te ofrece subir a su auto?" 
                            required
                          />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label>Respuesta o Comportamiento Lógico Esperado:</label>
                          <textarea 
                            value={taskForm.respuestaEsperada}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, respuestaEsperada: e.target.value }))}
                            placeholder="Ej: El niño debe separar las 9 láminas identificando al policía y al bombero como figuras seguras." 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="dynamic-panel">
                      <div className="dynamic-panel-content">
                        <span className="panel-subtitle text-white">Configuración de Seriación / Ubicación</span>
                        <div className="input-group">
                          <label>Elementos / Momentos a Ordenar:</label>
                          <textarea 
                            value={taskForm.elementos}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, elementos: e.target.value }))}
                            placeholder="Ej: 1. Llaman a la puerta, 2. Mira por mirilla, 3. No abre y pide ayuda." 
                            required
                          />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label>Instrucciones de Presentación en Aula:</label>
                          <textarea 
                            value={taskForm.presentacion}
                            onChange={(e) => setTaskForm(prev => ({ ...prev, presentacion: e.target.value }))}
                            placeholder="Ej: Entregar las 3 tarjetas recortadas en desorden al niño y pedirle que narre la secuencia de izquierda a derecha." 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attachment of support materials */}
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Fichas de Soporte / Hojas de Trabajo (PDF):</label>
                    <div 
                      style={{ 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '10px', 
                        padding: '0.75rem', 
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {uploadingMaterial ? 'Cargando archivo...' : 'Adjunte guías en PDF (Máx 10MB)'}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        disabled={uploadingMaterial}
                        style={{ padding: '0.3rem 0.6rem', position: 'relative' }}
                      >
                        <Plus size={14} style={{ marginRight: '0.2rem', display: 'inline' }} />
                        Adjuntar
                        <input 
                          type="file" 
                          className="file-input-hidden" 
                          ref={materialInputRef}
                          onChange={handleMaterialUpload}
                          accept="application/pdf"
                        />
                      </button>
                    </div>
                    
                    {taskMaterials.length > 0 && (
                      <ul className="materials-list">
                        {taskMaterials.map(mat => (
                          <li key={mat.id} className="material-item">
                            <span className="material-item-name">{mat.nombre}</span>
                            <button 
                              type="button" 
                              className="btn-remove-material" 
                              onClick={() => handleRemoveMaterial(mat.id)}
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer full-width">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTaskModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Ficha Didáctica</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
