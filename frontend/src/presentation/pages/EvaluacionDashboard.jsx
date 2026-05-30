import React, { useState, useEffect, useCallback } from 'react';
import { Award, FileText, CheckSquare, Save, Loader, AlertCircle, X, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import SubViewHeader from '../components/SubViewHeader';

// ── Constantes ───────────────────────────────────────────────────────────────
const CRITERIOS = [
  { key: 'clasificacion',     label: 'Clasificación de Información' },
  { key: 'seriacion',         label: 'Seriación y Ordenamiento' },
  { key: 'construccion',      label: 'Construcción de Conocimiento' },
  { key: 'pensamientoLogico', label: 'Pensamiento Lógico' },
  { key: 'metacognicion',     label: 'Metacognición' },
];
const NIVELES = [
  { key: 'I',  label: 'Iniciado',   color: '#ef4444', bg: 'rgba(239,68,68,0.09)'  },
  { key: 'EP', label: 'En Proceso', color: '#f59e0b', bg: 'rgba(245,158,11,0.09)' },
  { key: 'L',  label: 'Logrado',    color: '#22c55e', bg: 'rgba(34,197,94,0.09)'  },
];
const AUTOEVAL_PREGUNTAS = [
  '¿Planifiqué la actividad didáctica con anterioridad y de forma estructurada?',
  '¿Generé situaciones de desequilibrio cognitivo sin dar las respuestas de forma directa?',
  '¿Apliqué preguntas de andamiaje (scaffolding) ajustadas al nivel operativo del menor?',
  '¿Mantuve escucha activa y registro del lenguaje verbal y no verbal del alumno?',
  '¿Evité imponer directrices dogmáticas y promoví la autorregulación del estudiante?',
  '¿Registré las observaciones de forma fidedigna en la ficha de monitoreo individual?',
];
const EMPTY_RUBRICA   = { clasificacion: '', seriacion: '', construccion: '', pensamientoLogico: '', metacognicion: '' };
const EMPTY_MONITOREO = { clasificacionObs: '', clasificacionApoyo: '', seriacionObs: '', seriacionApoyo: '', asimilacionObs: '', asimilacionApoyo: '', justificacionObs: '', justificacionApoyo: '', autorregulacionObs: '', autorregulacionApoyo: '' };

// ── Componente principal ─────────────────────────────────────────────────────
export default function EvaluacionDashboard({ activeClassId, showToast }) {
  // State
  const [unidades, setUnidades]         = useState([]);
  const [selectedUnidadId, setSelectedUnidadId] = useState('');
  const [matriz, setMatriz]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [saving, setSaving]             = useState(false);

  // Modal state
  const [modal, setModal]               = useState(null); // null | { type: 'rubrica'|'monitoreo'|'autoeval', alumnoId, alumnoNombre }
  const [rubrica, setRubrica]           = useState(EMPTY_RUBRICA);
  const [notaEscrita, setNotaEscrita]   = useState('');
  const [monitoreo, setMonitoreo]       = useState(EMPTY_MONITOREO);
  const [autorespuestas, setAutorespuestas] = useState(
    AUTOEVAL_PREGUNTAS.map(q => ({ pregunta: q, respuesta: '', reflexion: '' }))
  );

  // ── Load unidades ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeClassId) return;
    api.getUnidades(activeClassId)
      .then(uns => {
        const activas = uns.filter(u => !u.archivada);
        setUnidades(activas);
        if (activas.length > 0) setSelectedUnidadId(activas[0].id);
      })
      .catch(e => showToast(e.message, 'danger'));
  }, [activeClassId]);

  // ── Load matriz when unidad changes ─────────────────────────────────────
  const refreshMatriz = useCallback(() => {
    if (!activeClassId || !selectedUnidadId) { setMatriz([]); return; }
    setLoading(true);
    api.getMatriz(activeClassId, selectedUnidadId)
      .then(data => setMatriz(data))
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setLoading(false));
  }, [activeClassId, selectedUnidadId]);

  useEffect(() => { refreshMatriz(); }, [refreshMatriz]);

  // ── Open modal and pre-load existing data ────────────────────────────────
  const openModal = async (type, alumnoId, alumnoNombre) => {
    setModal({ type, alumnoId, alumnoNombre });
    if (type === 'rubrica') {
      setRubrica(EMPTY_RUBRICA); setNotaEscrita('');
      try {
        const evals = await api.getEvaluacionesAlumno(alumnoId);
        const found = evals.find(e => e.unidadId === selectedUnidadId);
        if (found) { setRubrica({ ...EMPTY_RUBRICA, ...(found.rubrica || {}) }); setNotaEscrita(found.notaEscrita || ''); }
      } catch (_) {}
    } else if (type === 'monitoreo') {
      setMonitoreo(EMPTY_MONITOREO);
      try {
        const m = await api.getMonitoreo(alumnoId, selectedUnidadId);
        if (m) setMonitoreo({ ...EMPTY_MONITOREO, ...m });
      } catch (_) {}
    } else if (type === 'autoeval') {
      setAutorespuestas(AUTOEVAL_PREGUNTAS.map(q => ({ pregunta: q, respuesta: '', reflexion: '' })));
      try {
        const list = await api.getAutoevaluaciones(activeClassId, alumnoId, selectedUnidadId);
        if (list.length > 0 && list[0].respuestas) {
          setAutorespuestas(list[0].respuestas);
        }
      } catch (_) {}
    }
  };

  const closeModal = () => setModal(null);

  // ── Save handlers ────────────────────────────────────────────────────────
  const saveRubrica = async e => {
    e.preventDefault();
    if (!Object.values(rubrica).every(v => v !== '')) return showToast('Evalúe todos los criterios', 'warning');
    setSaving(true);
    try {
      await api.createEvaluacion({ alumnoId: modal.alumnoId, unidadId: selectedUnidadId || null, claseId: activeClassId, rubrica, notaEscrita });
      showToast('Rúbrica guardada', 'success');
      closeModal(); refreshMatriz();
    } catch (e) { showToast(e.message, 'danger'); }
    finally { setSaving(false); }
  };

  const saveMonitoreo = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.saveMonitoreo({ alumnoId: modal.alumnoId, unidadId: selectedUnidadId || null, ...monitoreo });
      showToast('Ficha de monitoreo guardada', 'success');
      closeModal(); refreshMatriz();
    } catch (e) { showToast(e.message, 'danger'); }
    finally { setSaving(false); }
  };

  const saveAutoeval = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createAutoevaluacion({ claseId: activeClassId, unidadId: selectedUnidadId || null, alumnoId: modal.alumnoId, respuestas: autorespuestas });
      showToast('Autoevaluación guardada', 'success');
      closeModal(); refreshMatriz();
    } catch (e) { showToast(e.message, 'danger'); }
    finally { setSaving(false); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const StatusIcon = ({ done, onClick, label }) => (
    <button
      onClick={onClick}
      title={done ? `Editar ${label}` : `Registrar ${label}`}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
        padding: '0.4rem 0.8rem', borderRadius: '10px',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(148,163,184,0.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {done
        ? <CheckCircle size={22} style={{ color: '#22c55e' }} />
        : <XCircle    size={22} style={{ color: '#ef4444' }} />
      }
    </button>
  );

  // ── Guard ────────────────────────────────────────────────────────────────
  if (unidades.length === 0 && !loading) return (
    <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px', background: '#fff' }}>
      <AlertCircle size={48} className="text-muted" style={{ margin: '0 auto 1rem' }} />
      <h3 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>No hay tareas registradas</h3>
      <p className="text-muted">Cree al menos una Unidad Didáctica en la sección correspondiente para poder evaluar.</p>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up">

      {/* ── Selector de Tarea ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Seleccione una Tarea / Unidad Didáctica
        </label>
        <select
          className="select-input"
          value={selectedUnidadId}
          onChange={e => setSelectedUnidadId(e.target.value)}
          style={{ maxWidth: 480 }}
        >
          <option value="">— Seleccione una tarea —</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.titulo}</option>)}
        </select>
      </div>

      {/* ── Tabla Matriz ── */}
      {selectedUnidadId && (
        <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(148,163,184,0.12)' }}>
          {loading ? (
            <div className="loading-container" style={{ padding: '3rem' }}><Loader className="spinner" /></div>
          ) : matriz.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>No hay alumnos registrados en este grupo.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid rgba(148,163,184,0.15)' }}>
                  {['Nombre del Alumno', 'Rúbrica Cognitiva', 'Ficha de Monitoreo', 'Autoevaluación Docente'].map((h, i) => (
                    <th key={i} style={{
                      padding: '0.9rem 1.25rem', textAlign: i === 0 ? 'left' : 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matriz.map((row, idx) => (
                  <tr key={row.alumnoId} style={{
                    borderBottom: idx < matriz.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbfd'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${(row.alumnoId.charCodeAt(0) * 37) % 360},65%,60%)`,
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.72rem', fontWeight: 800
                        }}>
                          {row.nombre.substring(0, 2).toUpperCase()}
                        </div>
                        {row.nombre}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusIcon done={row.rubrica}   onClick={() => openModal('rubrica',   row.alumnoId, row.nombre)} label="Rúbrica" />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusIcon done={row.monitoreo} onClick={() => openModal('monitoreo', row.alumnoId, row.nombre)} label="Monitoreo" />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <StatusIcon done={row.autoeval}  onClick={() => openModal('autoeval',  row.alumnoId, row.nombre)} label="Autoevaluación" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══ Modales ══ */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 200 }}>
          <div className="modal-box large-modal animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Header */}
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ marginBottom: '0.15rem' }}>
                  {modal.type === 'rubrica'   && '🏅 Rúbrica Cognitiva'}
                  {modal.type === 'monitoreo' && '📋 Ficha de Monitoreo'}
                  {modal.type === 'autoeval'  && '✅ Autoevaluación Docente'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Alumno: <strong style={{ color: 'var(--text-white)' }}>{modal.alumnoNombre}</strong>
                </p>
              </div>
              <button className="btn-close-modal" onClick={closeModal}><X size={22} /></button>
            </div>

            {/* ── Rúbrica Form ── */}
            {modal.type === 'rubrica' && (
              <form onSubmit={saveRubrica} className="modal-form">
                <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <strong style={{ color: '#ef4444' }}>I</strong> = Iniciado &nbsp;·&nbsp;
                  <strong style={{ color: '#f59e0b' }}>EP</strong> = En Proceso &nbsp;·&nbsp;
                  <strong style={{ color: '#22c55e' }}>L</strong> = Logrado
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  {CRITERIOS.map(c => (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
                      <span style={{ flex: '1 1 140px', fontWeight: 600, color: 'var(--text-white)', fontSize: '0.87rem' }}>{c.label}</span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {NIVELES.map(n => (
                          <button key={n.key} type="button" onClick={() => setRubrica(p => ({ ...p, [c.key]: n.key }))}
                            style={{
                              padding: '0.35rem 0.95rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.84rem',
                              border: `2px solid ${rubrica[c.key] === n.key ? n.color : 'rgba(148,163,184,0.22)'}`,
                              background: rubrica[c.key] === n.key ? n.bg : 'transparent',
                              color: rubrica[c.key] === n.key ? n.color : 'var(--text-muted)',
                              fontWeight: rubrica[c.key] === n.key ? 800 : 500, transition: 'all 0.15s',
                            }}>{n.key}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                  <label>Observación escrita (opcional):</label>
                  <textarea value={notaEscrita} onChange={e => setNotaEscrita(e.target.value)}
                    placeholder="Registre observaciones..." style={{ minHeight: 70 }} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={15} /> {saving ? 'Guardando…' : 'Guardar Rúbrica'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Monitoreo Form ── */}
            {modal.type === 'monitoreo' && (
              <form onSubmit={saveMonitoreo} className="modal-form">
                {[
                  { obs: 'clasificacionObs',   apoyo: 'clasificacionApoyo',   label: 'Clasificación' },
                  { obs: 'seriacionObs',        apoyo: 'seriacionApoyo',        label: 'Seriación' },
                  { obs: 'asimilacionObs',      apoyo: 'asimilacionApoyo',      label: 'Asimilación / Acomodación' },
                  { obs: 'justificacionObs',    apoyo: 'justificacionApoyo',    label: 'Justificación Lógica' },
                  { obs: 'autorregulacionObs',  apoyo: 'autorregulacionApoyo',  label: 'Autorregulación' },
                ].map(row => (
                  <div key={row.obs} style={{ marginBottom: '0.85rem', padding: '1rem 1.1rem', borderRadius: '12px', background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(148,163,184,0.1)' }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.85rem', margin: '0 0 0.6rem' }}>{row.label}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div className="input-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Observaciones</label>
                        <textarea value={monitoreo[row.obs]} onChange={e => setMonitoreo(p => ({ ...p, [row.obs]: e.target.value }))}
                          placeholder="Conducta observada…" style={{ minHeight: 60 }} />
                      </div>
                      <div className="input-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.7rem' }}>Acciones de Apoyo</label>
                        <textarea value={monitoreo[row.apoyo]} onChange={e => setMonitoreo(p => ({ ...p, [row.apoyo]: e.target.value }))}
                          placeholder="Estrategias…" style={{ minHeight: 60 }} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={15} /> {saving ? 'Guardando…' : 'Guardar Ficha'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Autoevaluación Form ── */}
            {modal.type === 'autoeval' && (
              <form onSubmit={saveAutoeval} className="modal-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.25rem' }}>
                  {autorespuestas.map((r, i) => (
                    <div key={i} style={{ padding: '1rem 1.1rem', borderRadius: '12px', background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(148,163,184,0.1)' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: '0.85rem', margin: '0 0 0.65rem' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{i + 1}.</span> {r.pregunta}
                      </p>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.55rem', flexWrap: 'wrap' }}>
                        {['Sí', 'No', 'En Proceso'].map(op => (
                          <button key={op} type="button"
                            onClick={() => setAutorespuestas(p => p.map((x, idx) => idx === i ? { ...x, respuesta: op } : x))}
                            style={{
                              padding: '0.3rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer',
                              border: `2px solid ${r.respuesta === op ? 'var(--accent-primary)' : 'rgba(148,163,184,0.22)'}`,
                              background: r.respuesta === op ? 'rgba(79,70,229,0.1)' : 'transparent',
                              color: r.respuesta === op ? 'var(--accent-primary)' : 'var(--text-muted)',
                              fontWeight: r.respuesta === op ? 700 : 400, transition: 'all 0.15s',
                            }}>{op}</button>
                        ))}
                      </div>
                      <textarea value={r.reflexion}
                        onChange={e => setAutorespuestas(p => p.map((x, idx) => idx === i ? { ...x, reflexion: e.target.value } : x))}
                        placeholder="Reflexión libre (opcional)…"
                        style={{ width: '100%', minHeight: 44, fontSize: '0.78rem', borderRadius: '8px', padding: '0.4rem 0.65rem', border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(248,250,252,0.5)', color: 'var(--text-white)', resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={15} /> {saving ? 'Guardando…' : 'Guardar Autoevaluación'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
