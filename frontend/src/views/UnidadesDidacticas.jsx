import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Copy, Archive, X, Loader, ChevronDown, ChevronUp, Upload, FileText } from 'lucide-react';
import { api } from '../services/api';

const EMPTY_FORM = {
  titulo: '', ambito: '', objetivoGeneral: '', objetivoAprendizaje: '',
  destrezas: '', semanasPrevistas: 1, descripcionActividades: '',
  tecnicasDidacticas: '', criteriosEvaluacion: '', imagenUrl: '', materiales: []
};

const EMPTY_TASK_FORM = {
  titulo: '',
  imagenUrl: '',
  actividadTipo: 'CLASIFICAR',
  categorias: '',
  preguntas: '',
  respuestaEsperada: '',
  elementos: '',
  presentacion: ''
};

export default function UnidadesDidacticas({ claseId, showToast }) {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState({});
  const [showArchivadas, setShowArchivadas] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // --- ESTADO PARA TAREAS ANIDADAS ---
  const [unitTareas, setUnitTareas] = useState({}); // Mapeo de unidadId -> listado de tareas
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedUnidadId, setSelectedUnidadId] = useState(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [taskMaterials, setTaskMaterials] = useState([]); // [{ id, nombre, archivoUrl }]
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const imageInputRef = useRef(null);
  const materialInputRef = useRef(null);

  useEffect(() => { if (claseId) load(); }, [claseId]);

  const load = () => {
    setLoading(true);
    api.getUnidades(claseId)
      .then(setUnidades)
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setLoading(false));
  };

  const loadTareas = (unidadId) => {
    api.getTareasByUnidad(unidadId)
      .then(data => {
        setUnitTareas(prev => ({ ...prev, [unidadId]: data }));
      })
      .catch(err => showToast(err.message || 'Error al cargar tareas', 'danger'));
  };

  const openNew = () => { setForm({ ...EMPTY_FORM, claseId }); setEditId(null); setShowModal(true); };
  const openEdit = u => {
    setForm({
      titulo: u.titulo || '', ambito: u.ambito || '',
      objetivoGeneral: u.objetivoGeneral || '', objetivoAprendizaje: u.objetivoAprendizaje || '',
      destrezas: u.destrezas || '', semanasPrevistas: u.semanasPrevistas || 1,
      descripcionActividades: u.descripcionActividades || '',
      tecnicasDidacticas: u.tecnicasDidacticas || '',
      criteriosEvaluacion: u.criteriosEvaluacion || '',
      imagenUrl: u.imagenUrl || '', materiales: u.materiales || []
    });
    setEditId(u.id); setShowModal(true);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.titulo) { showToast('El título es obligatorio', 'warning'); return; }
    const payload = { ...form, claseId };
    const op = editId ? api.updateUnidad(editId, payload) : api.createUnidad(payload);
    op.then(() => {
      showToast(editId ? 'Unidad actualizada' : 'Unidad creada', 'success');
      setShowModal(false); load();
    }).catch(e => showToast(e.message, 'danger'));
  };

  const handleDelete = id => {
    if (!window.confirm('¿Eliminar esta unidad didáctica? Se perderán sus evaluaciones y tareas asociadas.')) return;
    api.deleteUnidad(id)
      .then(() => { showToast('Unidad eliminada', 'success'); load(); })
      .catch(e => showToast(e.message, 'danger'));
  };

  const handleClone = id => {
    api.clonarUnidad(id)
      .then(() => { showToast('Unidad clonada exitosamente', 'success'); load(); })
      .catch(e => showToast(e.message, 'danger'));
  };

  const handleArchive = u => {
    api.updateUnidad(u.id, { ...u, claseId: u.claseId, archivada: !u.archivada })
      .then(() => { showToast(u.archivada ? 'Unidad activada' : 'Unidad archivada', 'success'); load(); })
      .catch(e => showToast(e.message, 'danger'));
  };

  const handleImageUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingImg(true);
    api.uploadFile(file)
      .then(r => { setForm(p => ({ ...p, imagenUrl: r.url })); showToast('Imagen cargada', 'success'); })
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setUploadingImg(false));
  };

  const toggle = id => {
    setExpanded(p => {
      const next = { ...p, [id]: !p[id] };
      if (next[id] && !unitTareas[id]) {
        loadTareas(id);
      }
      return next;
    });
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // --- LÓGICA DE TAREAS ANIDADAS ---
  const openNewTask = (unidadId) => {
    setSelectedUnidadId(unidadId);
    setTaskForm(EMPTY_TASK_FORM);
    setTaskMaterials([]);
    setShowTaskModal(true);
  };

  const handleTaskImageUpload = (e) => {
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

  const handleTaskMaterialUpload = (e) => {
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

  const handleRemoveTaskMaterial = (id) => {
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

    api.createTarea(claseId, selectedUnidadId, payload)
      .then(() => {
        showToast('Ficha didáctica registrada exitosamente en la unidad', 'success');
        setShowTaskModal(false);
        loadTareas(selectedUnidadId);
      })
      .catch(err => showToast(err.message || 'Error al registrar tarea', 'danger'));
  };

  const handleDeleteTask = (id, unidadId) => {
    if (window.confirm('¿Está seguro de eliminar esta ficha didáctica? Se borrarán sus calificaciones registradas.')) {
      api.deleteTarea(id)
        .then(() => {
          showToast('Ficha didáctica registrada', 'success');
          loadTareas(unidadId);
        })
        .catch(err => showToast(err.message || 'Error al eliminar tarea', 'danger'));
    }
  };

  const activas = unidades.filter(u => !u.archivada);
  const archivadas = unidades.filter(u => u.archivada);

  return (
    <div className="sub-view">
      <div className="section-header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3 className="font-outfit text-white" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Unidades Didácticas</h3>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Planifique unidades y gestione sus tareas cognitivas (RF-D02)</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>
          <Plus size={16} /> Nueva Unidad
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><Loader className="spinner" /></div>
      ) : activas.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px', background: '#ffffff' }}>
          <BookOpen size={48} className="text-muted" style={{ margin: '0 auto 1rem' }} />
          <h4 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>No hay unidades didácticas</h4>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Cree su primera unidad para empezar a planificar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activas.map(u => (
            <div key={u.id} className="glass" style={{ borderRadius: '20px', background: '#fff', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', cursor: 'pointer' }} onClick={() => toggle(u.id)}>
                {u.imagenUrl && <img src={u.imagenUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, color: 'var(--text-white)', margin: 0, fontSize: '1rem' }}>{u.titulo}</p>
                  <p className="text-muted" style={{ fontSize: '0.78rem', margin: 0 }}>
                    {u.ambito && <span style={{ marginRight: '1rem' }}>📚 {u.ambito}</span>}
                    <span>⏱ {u.semanasPrevistas} sem.</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); openEdit(u); }} title="Editar"><Edit2 size={14} /></button>
                  <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); handleClone(u.id); }} title="Clonar"><Copy size={14} /></button>
                  <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); handleArchive(u); }} title="Archivar"><Archive size={14} /></button>
                  <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); handleDelete(u.id); }} style={{ color: 'var(--danger)' }} title="Eliminar"><Trash2 size={14} /></button>
                  {expanded[u.id] ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
                </div>
              </div>
              {expanded[u.id] && (
                <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {u.objetivoGeneral && <Field label="Objetivo General" value={u.objetivoGeneral} />}
                    {u.objetivoAprendizaje && <Field label="Objetivo de Aprendizaje" value={u.objetivoAprendizaje} />}
                    {u.destrezas && <Field label="Destrezas" value={u.destrezas} />}
                    {u.tecnicasDidacticas && <Field label="Técnicas Didácticas" value={u.tecnicasDidacticas} />}
                    {u.criteriosEvaluacion && <Field label="Criterios de Evaluación" value={u.criteriosEvaluacion} />}
                    {u.descripcionActividades && <Field label="Descripción de Actividades" value={u.descripcionActividades} full />}
                  </div>

                  {/* SECCIÓN DE TAREAS DIDÁCTICAS ANIDADAS */}
                  <div style={{ marginTop: '2rem', borderTop: '1px dashed rgba(148,163,184,0.2)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-white)', fontSize: '0.95rem' }}>🎯 Fichas y Tareas Cognitivas de la Unidad</h4>
                      <button className="btn btn-primary btn-sm" onClick={() => openNewTask(u.id)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                        <Plus size={14} /> Añadir Ficha Didáctica
                      </button>
                    </div>

                    {!unitTareas[u.id] ? (
                      <div style={{ textAlign: 'center', padding: '1rem' }}><Loader className="spinner" style={{ width: 20, height: 20 }} /></div>
                    ) : unitTareas[u.id].length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(148,163,184,0.05)', borderRadius: '12px' }}>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>No hay fichas didácticas asociadas a esta unidad.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {unitTareas[u.id].map(t => (
                          <div key={t.id} className="task-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(148,163,184,0.1)' }}>
                            <div className="task-image-wrapper">
                              <img src={t.imagenUrl} alt={t.titulo} className="task-image" />
                              <span className={`task-badge badge-${t.actividadTipo.toLowerCase()}`}>{t.actividadTipo}</span>
                            </div>
                            <div className="task-body" style={{ padding: '0.75rem' }}>
                              <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-white)' }}>{t.titulo}</h5>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {t.actividadTipo === 'CLASIFICAR' ? (
                                  <>
                                    <p style={{ margin: '0 0 0.25rem' }}><strong>Categorías:</strong> {t.detalles.categorias}</p>
                                    <p style={{ margin: 0 }}><strong>Mediación:</strong> {t.detalles.preguntas}</p>
                                  </>
                                ) : (
                                  <>
                                    <p style={{ margin: '0 0 0.25rem' }}><strong>Elementos:</strong> {t.detalles.elementos}</p>
                                    <p style={{ margin: 0 }}><strong>Presentación:</strong> {t.detalles.presentacion}</p>
                                  </>
                                )}
                              </div>

                              {t.materiales && t.materiales.length > 0 && (
                                <div className="task-materials" style={{ marginTop: '0.5rem' }}>
                                  {t.materiales.map(mat => (
                                    <a key={mat.id} href={mat.archivoUrl} target="_blank" rel="noreferrer" className="material-link" style={{ fontSize: '0.7rem' }}>
                                      <FileText size={12} />
                                      {mat.nombre}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="task-footer" style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteTask(t.id, u.id)} style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}>
                                <Trash2 size={12} /> Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {archivadas.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowArchivadas(p => !p)}>
            <Archive size={14} /> {showArchivadas ? 'Ocultar' : 'Ver'} Archivadas ({archivadas.length})
          </button>
          {showArchivadas && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', opacity: 0.65 }}>
              {archivadas.map(u => (
                <div key={u.id} className="glass" style={{ borderRadius: '16px', background: '#fff', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-white)', margin: 0 }}>{u.titulo}</p>
                    <span style={{ fontSize: '0.75rem' }} className="text-muted">Archivada</span>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleArchive(u)}>Restaurar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(u.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: REGISTRAR UNIDAD */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box large-modal animate-slide-up" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Editar Unidad Didáctica' : 'Nueva Unidad Didáctica'}</h3>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="grid-form">
                <div className="form-column">
                  <div className="input-group">
                    <label>Título *</label>
                    <input type="text" value={form.titulo} onChange={e => f('titulo', e.target.value)} placeholder="Ej: Personas Seguras y Autocuidado" required />
                  </div>
                  <div className="input-group">
                    <label>Ámbito</label>
                    <input type="text" value={form.ambito} onChange={e => f('ambito', e.target.value)} placeholder="Ej: Convivencia e Identidad Personal" />
                  </div>
                  <div className="input-group">
                    <label>Semanas Previstas</label>
                    <input type="number" min="1" max="40" value={form.semanasPrevistas} onChange={e => f('semanasPrevistas', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="input-group">
                    <label>Imagen Ilustrativa</label>
                    <div className="file-uploader" style={{ minHeight: 80 }}>
                      {form.imagenUrl
                        ? <img src={form.imagenUrl} alt="preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />
                        : uploadingImg
                          ? <div style={{ textAlign: 'center', padding: '1rem' }}><Loader className="spinner" style={{ width: 24, height: 24 }} /></div>
                          : <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem' }}>
                              <Upload size={24} className="text-muted" />
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Subir imagen</span>
                              <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                            </label>
                      }
                      {form.imagenUrl && <button type="button" onClick={() => f('imagenUrl', '')} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>Quitar imagen</button>}
                    </div>
                  </div>
                </div>
                <div className="form-column">
                  <div className="input-group">
                    <label>Objetivo General</label>
                    <textarea value={form.objetivoGeneral} onChange={e => f('objetivoGeneral', e.target.value)} placeholder="Objetivo general de la unidad..." style={{ minHeight: 80 }} />
                  </div>
                  <div className="input-group">
                    <label>Objetivo de Aprendizaje</label>
                    <textarea value={form.objetivoAprendizaje} onChange={e => f('objetivoAprendizaje', e.target.value)} placeholder="Objetivo específico de aprendizaje..." style={{ minHeight: 80 }} />
                  </div>
                  <div className="input-group">
                    <label>Destrezas</label>
                    <textarea value={form.destrezas} onChange={e => f('destrezas', e.target.value)} placeholder="Destrezas a desarrollar..." style={{ minHeight: 70 }} />
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label>Descripción de Actividades (texto, imágenes, referencias)</label>
                <textarea value={form.descripcionActividades} onChange={e => f('descripcionActividades', e.target.value)} placeholder="Descripción detallada de las actividades de la unidad..." style={{ minHeight: 100 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Técnicas Didácticas</label>
                  <textarea value={form.tecnicasDidacticas} onChange={e => f('tecnicasDidacticas', e.target.value)} placeholder="Ej: Juego simbólico, Clasificación, Seriación..." style={{ minHeight: 70 }} />
                </div>
                <div className="input-group">
                  <label>Criterios de Evaluación</label>
                  <textarea value={form.criteriosEvaluacion} onChange={e => f('criteriosEvaluacion', e.target.value)} placeholder="Ej: Clasifica correctamente, Sería en 3 momentos..." style={{ minHeight: 70 }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Actualizar' : 'Crear Unidad'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR TAREA A LA UNIDAD */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-box large-modal animate-slide-up" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Material / Ficha en la Unidad Didáctica</h3>
              <button className="btn-close-modal" onClick={() => setShowTaskModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="modal-form">
              <div className="grid-form">
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
                          <img src={taskForm.imagenUrl} alt="Preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8 }} />
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setTaskForm(prev => ({ ...prev, imagenUrl: '' }))}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', marginTop: '0.5rem' }}
                          >
                            Eliminar Imagen
                          </button>
                        </div>
                      ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem', border: '2px dashed rgba(148,163,184,0.3)', borderRadius: 12 }}>
                          <Upload size={32} className="text-muted" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-white)' }}>
                            Subir archivo de ilustración
                          </span>
                          <span className="file-tip" style={{ fontSize: '0.7rem' }}>Formatos soportados: SVG, PNG, JPG (Máx 5MB)</span>
                          <input 
                            type="file" 
                            hidden 
                            onChange={handleTaskImageUpload}
                            accept="image/*"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-column">
                  {taskForm.actividadTipo === 'CLASIFICAR' ? (
                    <div className="dynamic-panel" style={{ background: 'rgba(148,163,184,0.05)', padding: '1rem', borderRadius: 12 }}>
                      <div className="dynamic-panel-content">
                        <span className="panel-subtitle text-white" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Configuración de Clasificación</span>
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
                    <div className="dynamic-panel" style={{ background: 'rgba(148,163,184,0.05)', padding: '1rem', borderRadius: 12 }}>
                      <div className="dynamic-panel-content">
                        <span className="panel-subtitle text-white" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Configuración de Seriación / Ubicación</span>
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

                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Fichas de Soporte / Hojas de Trabajo (PDF):</label>
                    <div style={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: '10px', padding: '0.75rem', background: 'rgba(148,163,184,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {uploadingMaterial ? 'Cargando archivo...' : 'Adjunte guías en PDF (Máx 10MB)'}
                      </span>
                      <label className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem', cursor: 'pointer', margin: 0 }}>
                        <Plus size={14} style={{ marginRight: '0.2rem', display: 'inline' }} />
                        Adjuntar
                        <input 
                          type="file" 
                          hidden 
                          onChange={handleTaskMaterialUpload}
                          accept="application/pdf"
                        />
                      </label>
                    </div>
                    
                    {taskMaterials.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                        {taskMaterials.map(mat => (
                          <li key={mat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(148,163,184,0.1)', padding: '0.25rem 0.5rem', borderRadius: 6, marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{mat.nombre}</span>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTaskMaterial(mat.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }}
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

              <div className="modal-footer full-width" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Ficha Didáctica</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, full }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 0.25rem' }}>{label}</p>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-white)', margin: 0, whiteSpace: 'pre-wrap' }}>{value}</p>
    </div>
  );
}
