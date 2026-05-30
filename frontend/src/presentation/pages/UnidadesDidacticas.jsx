import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Copy, Archive, X, Loader, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { api } from '../services/api';

const EMPTY_FORM = {
  titulo: '', ambito: '', objetivoGeneral: '', objetivoAprendizaje: '',
  destrezas: '', semanasPrevistas: 1, descripcionActividades: '',
  tecnicasDidacticas: '', criteriosEvaluacion: '', imagenUrl: '', materiales: []
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

  useEffect(() => { if (claseId) load(); }, [claseId]);

  const load = () => {
    setLoading(true);
    api.getUnidades(claseId)
      .then(setUnidades)
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setLoading(false));
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
    if (!window.confirm('¿Eliminar esta unidad didáctica? Se perderán sus evaluaciones asociadas.')) return;
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

  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const activas = unidades.filter(u => !u.archivada);
  const archivadas = unidades.filter(u => u.archivada);

  const NIVEL_COLORS = { I: '#ef4444', EP: '#f59e0b', L: '#22c55e' };

  return (
    <div className="sub-view">
      <div className="section-header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h3 className="font-outfit text-white" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Unidades Didácticas</h3>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Planifique, clone y archive sus unidades curriculares (RF-D02)</p>
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

      {/* MODAL */}
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
