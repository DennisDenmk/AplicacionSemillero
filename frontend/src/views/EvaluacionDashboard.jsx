import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckSquare, Save, Loader, AlertCircle, Clipboard, Users } from 'lucide-react';
import { api } from '../services/api';
import SectionHome from '../components/SectionHome';
import SubViewHeader from '../components/SubViewHeader';

// ── Constantes rúbrica ──────────────────────────────────────────────────────
const CRITERIOS = [
  { key: 'clasificacion',    label: 'Clasificación de Información' },
  { key: 'seriacion',        label: 'Seriación y Ordenamiento' },
  { key: 'construccion',     label: 'Construcción de Conocimiento' },
  { key: 'pensamientoLogico',label: 'Pensamiento Lógico' },
  { key: 'metacognicion',    label: 'Metacognición' },
];

const NIVELES = [
  { key: 'I',  label: 'Iniciado',    color: '#ef4444', bg: 'rgba(239,68,68,0.09)'  },
  { key: 'EP', label: 'En Proceso',  color: '#f59e0b', bg: 'rgba(245,158,11,0.09)' },
  { key: 'L',  label: 'Logrado',     color: '#22c55e', bg: 'rgba(34,197,94,0.09)'  },
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
const EMPTY_MONITOREO = {
  clasificacionObs: '', clasificacionApoyo: '',
  seriacionObs: '', seriacionApoyo: '',
  asimilacionObs: '', asimilacionApoyo: '',
  justificacionObs: '', justificacionApoyo: '',
  autorregulacionObs: '', autorregulacionApoyo: '',
};

// ── Componente principal ────────────────────────────────────────────────────
export default function EvaluacionDashboard({ activeClassId, showToast }) {
  const [subView, setSubView] = useState(null); // null | 'rubrica' | 'monitoreo' | 'autoeval'

  // Data
  const [alumnos, setAlumnos]   = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  // Selectors
  const [selectedAlumnoId,  setSelectedAlumnoId]  = useState('');
  const [selectedUnidadId,  setSelectedUnidadId]  = useState('');

  // Sub-view state
  const [rubrica,         setRubrica]         = useState(EMPTY_RUBRICA);
  const [notaEscrita,     setNotaEscrita]     = useState('');
  const [monitoreo,       setMonitoreo]       = useState(EMPTY_MONITOREO);
  const [autorespuestas,  setAutorespuestas]  = useState(
    AUTOEVAL_PREGUNTAS.map(q => ({ pregunta: q, respuesta: '', reflexion: '' }))
  );

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeClassId) return;
    setLoading(true);
    Promise.all([api.getAlumnos(activeClassId), api.getUnidades(activeClassId)])
      .then(([als, uns]) => {
        setAlumnos(als);
        setUnidades(uns.filter(u => !u.archivada));
        if (als.length > 0) setSelectedAlumnoId(als[0].id);
      })
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setLoading(false));
  }, [activeClassId]);

  useEffect(() => {
    if (!selectedAlumnoId) return;
    setRubrica(EMPTY_RUBRICA); setNotaEscrita('');
    api.getEvaluacionesAlumno(selectedAlumnoId).then(evals => {
      if (!evals.length) return;
      const latest = selectedUnidadId ? evals.find(e => e.unidadId === selectedUnidadId) : evals[evals.length - 1];
      if (latest) { setRubrica({ ...EMPTY_RUBRICA, ...(latest.rubrica || {}) }); setNotaEscrita(latest.notaEscrita || ''); }
    }).catch(() => {});
    api.getMonitoreo(selectedAlumnoId)
      .then(m => setMonitoreo(m ? { ...EMPTY_MONITOREO, ...m } : EMPTY_MONITOREO))
      .catch(() => setMonitoreo(EMPTY_MONITOREO));
  }, [selectedAlumnoId, selectedUnidadId]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const saveRubrica = e => {
    e.preventDefault();
    if (!selectedAlumnoId) return showToast('Seleccione un alumno', 'warning');
    if (!Object.values(rubrica).every(v => v !== '')) return showToast('Evalúe todos los criterios', 'warning');
    setSaving(true);
    api.createEvaluacion({ alumnoId: selectedAlumnoId, unidadId: selectedUnidadId || null, claseId: activeClassId, rubrica, notaEscrita })
      .then(() => showToast('Evaluación guardada', 'success'))
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setSaving(false));
  };

  const saveMonitoreo = e => {
    e.preventDefault();
    if (!selectedAlumnoId) return showToast('Seleccione un alumno', 'warning');
    setSaving(true);
    api.saveMonitoreo({ alumnoId: selectedAlumnoId, ...monitoreo })
      .then(() => showToast('Ficha guardada', 'success'))
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setSaving(false));
  };

  const saveAutoeval = e => {
    e.preventDefault();
    setSaving(true);
    api.createAutoevaluacion({ claseId: activeClassId, unidadId: selectedUnidadId || null, respuestas: autorespuestas })
      .then(() => showToast('Autoevaluación guardada', 'success'))
      .catch(e => showToast(e.message, 'danger'))
      .finally(() => setSaving(false));
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const logrados = Object.values(rubrica).filter(v => v === 'L').length;
  const progresoColor = logrados === 5 ? '#22c55e' : logrados >= 3 ? '#f59e0b' : '#ef4444';
  const progresoLabel = logrados === 5 ? 'Logrado' : logrados >= 3 ? 'En Proceso' : 'Iniciado';

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (loading) return <div className="loading-container"><Loader className="spinner" /></div>;

  if (alumnos.length === 0) return (
    <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px', background: '#fff' }}>
      <AlertCircle size={48} className="text-muted" style={{ margin: '0 auto 1rem' }} />
      <h3 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>No hay alumnos en este aula</h3>
      <p className="text-muted">Registre estudiantes en "Mis Aulas" antes de evaluar.</p>
    </div>
  );

  // ── Selector panel (shared across sub-views) ───────────────────────────────
  const SelectorPanel = () => (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end',
      padding: '1.25rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem',
      background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.12)'
    }}>
      <div style={{ flex: '1 1 180px' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Alumno</label>
        <select className="select-input" value={selectedAlumnoId} onChange={e => setSelectedAlumnoId(e.target.value)}>
          {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </div>
      <div style={{ flex: '1 1 180px' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Unidad (opcional)</label>
        <select className="select-input" value={selectedUnidadId} onChange={e => setSelectedUnidadId(e.target.value)}>
          <option value="">— Sin unidad —</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.titulo}</option>)}
        </select>
      </div>
      {subView === 'rubrica' && (
        <div style={{ textAlign: 'right', paddingBottom: '0.1rem' }}>
          <p style={{ margin: '0 0 0.15rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Estado</p>
          <span style={{ fontWeight: 800, color: progresoColor, fontSize: '0.95rem' }}>{progresoLabel}</span>
        </div>
      )}
    </div>
  );

  // ── Home ───────────────────────────────────────────────────────────────────
  if (!subView) return (
    <SectionHome
      title="Evaluación & Seguimiento"
      subtitle="Seleccione una sección para comenzar"
      icon={<Clipboard size={28} />}
      onSelect={setSubView}
      cards={[
        {
          id: 'rubrica', icon: <Award size={22} />, color: '#4f46e5',
          title: 'Rúbrica Cognitiva',
          description: 'Evalúe a cada alumno en 5 criterios con niveles I / EP / L.',
        },
        {
          id: 'monitoreo', icon: <FileText size={22} />, color: '#0891b2',
          title: 'Ficha de Monitoreo',
          description: 'Registre observaciones y acciones de apoyo por dimensión cognitiva.',
        },
        {
          id: 'autoeval', icon: <CheckSquare size={22} />, color: '#7c3aed',
          title: 'Autoevaluación Docente',
          description: '6 preguntas de reflexión pedagógica sobre su desempeño en sesión.',
        },
      ]}
      extraContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', borderRadius: '12px', background: 'rgba(248,250,252,0.5)', border: '1px solid rgba(148,163,184,0.1)' }}>
          <Users size={16} className="text-muted" />
          <span className="text-muted" style={{ fontSize: '0.82rem' }}>{alumnos.length} estudiante{alumnos.length !== 1 ? 's' : ''} registrado{alumnos.length !== 1 ? 's' : ''} en este grupo</span>
        </div>
      }
    />
  );

  // ── Sub-view: Rúbrica ──────────────────────────────────────────────────────
  if (subView === 'rubrica') return (
    <div className="animate-slide-up">
      <SubViewHeader onBack={() => setSubView(null)} title="Rúbrica Cognitiva" subtitle="Niveles I / EP / L — 5 criterios" icon={<Award size={20} />} />
      <SelectorPanel />
      <form onSubmit={saveRubrica}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <p className="text-muted" style={{ fontSize: '0.82rem', margin: '0 0 0.5rem' }}>
            <strong style={{ color: '#ef4444' }}>I</strong> = Iniciado &nbsp;·&nbsp;
            <strong style={{ color: '#f59e0b' }}>EP</strong> = En Proceso &nbsp;·&nbsp;
            <strong style={{ color: '#22c55e' }}>L</strong> = Logrado
          </p>
          {CRITERIOS.map(c => (
            <div key={c.key} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              padding: '0.85rem 1.1rem', borderRadius: '12px',
              background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.1)'
            }}>
              <span style={{ flex: '1 1 150px', fontWeight: 600, color: 'var(--text-white)', fontSize: '0.88rem' }}>{c.label}</span>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                {NIVELES.map(n => (
                  <button key={n.key} type="button" onClick={() => setRubrica(p => ({ ...p, [c.key]: n.key }))}
                    style={{
                      padding: '0.38rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
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
            placeholder="Registre observaciones sobre esta evaluación..." style={{ minHeight: 80 }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={15} /> {saving ? 'Guardando…' : 'Guardar Evaluación'}
          </button>
        </div>
      </form>
    </div>
  );

  // ── Sub-view: Monitoreo ────────────────────────────────────────────────────
  if (subView === 'monitoreo') return (
    <div className="animate-slide-up">
      <SubViewHeader onBack={() => setSubView(null)} title="Ficha de Monitoreo Individual" subtitle="Observaciones y acciones de apoyo por dimensión" icon={<FileText size={20} />} />
      <SelectorPanel />
      <form onSubmit={saveMonitoreo}>
        {[
          { obs: 'clasificacionObs', apoyo: 'clasificacionApoyo', label: 'Clasificación' },
          { obs: 'seriacionObs',     apoyo: 'seriacionApoyo',     label: 'Seriación' },
          { obs: 'asimilacionObs',   apoyo: 'asimilacionApoyo',   label: 'Asimilación / Acomodación' },
          { obs: 'justificacionObs', apoyo: 'justificacionApoyo', label: 'Justificación Lógica' },
          { obs: 'autorregulacionObs', apoyo: 'autorregulacionApoyo', label: 'Autorregulación' },
        ].map(row => (
          <div key={row.obs} style={{ marginBottom: '1rem', padding: '1.1rem 1.25rem', borderRadius: '14px', background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
            <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.88rem', margin: '0 0 0.75rem' }}>{row.label}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.72rem' }}>Observaciones</label>
                <textarea value={monitoreo[row.obs]} onChange={e => setMonitoreo(p => ({ ...p, [row.obs]: e.target.value }))}
                  placeholder="Conducta observada…" style={{ minHeight: 65 }} />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.72rem' }}>Acciones de Apoyo</label>
                <textarea value={monitoreo[row.apoyo]} onChange={e => setMonitoreo(p => ({ ...p, [row.apoyo]: e.target.value }))}
                  placeholder="Estrategias de intervención…" style={{ minHeight: 65 }} />
              </div>
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={15} /> {saving ? 'Guardando…' : 'Guardar Ficha'}
          </button>
        </div>
      </form>
    </div>
  );

  // ── Sub-view: Autoevaluación ───────────────────────────────────────────────
  if (subView === 'autoeval') return (
    <div className="animate-slide-up">
      <SubViewHeader onBack={() => setSubView(null)} title="Autoevaluación Docente" subtitle="6 preguntas de reflexión pedagógica" icon={<CheckSquare size={20} />} />
      <div style={{ marginBottom: '1.25rem', padding: '0.9rem 1.25rem', borderRadius: '12px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Seleccione una unidad didáctica si desea asociar esta autoevaluación a una sesión específica:
        </p>
        <select className="select-input" style={{ marginTop: '0.5rem', maxWidth: 360 }} value={selectedUnidadId} onChange={e => setSelectedUnidadId(e.target.value)}>
          <option value="">— Sin unidad —</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.titulo}</option>)}
        </select>
      </div>
      <form onSubmit={saveAutoeval}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {autorespuestas.map((r, i) => (
            <div key={i} style={{ padding: '1.1rem 1.25rem', borderRadius: '14px', background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: '0.86rem', margin: '0 0 0.75rem' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{i + 1}.</span> {r.pregunta}
              </p>
              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                {['Sí', 'No', 'En Proceso'].map(op => (
                  <button key={op} type="button"
                    onClick={() => setAutorespuestas(p => p.map((x, idx) => idx === i ? { ...x, respuesta: op } : x))}
                    style={{
                      padding: '0.32rem 0.9rem', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer',
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
                style={{ width: '100%', minHeight: 50, fontSize: '0.8rem', borderRadius: '8px', padding: '0.45rem 0.7rem', border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(248,250,252,0.5)', color: 'var(--text-white)', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'right' }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={15} /> {saving ? 'Guardando…' : 'Guardar Autoevaluación'}
          </button>
        </div>
      </form>
    </div>
  );

  return null;
}
