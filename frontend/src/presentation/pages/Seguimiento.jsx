import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, User, Users, Loader, AlertCircle, Printer } from 'lucide-react';
import { api } from '../services/api';
import SectionHome from '../components/SectionHome';
import SubViewHeader from '../components/SubViewHeader';

const CRITERIOS = [
  { key: 'clasificacion',     label: 'Clasificación' },
  { key: 'seriacion',         label: 'Seriación' },
  { key: 'construccion',      label: 'Construcción' },
  { key: 'pensamientoLogico', label: 'Pens. Lógico' },
  { key: 'metacognicion',     label: 'Metacognición' },
];
const NIVEL_COLORS = { I: '#ef4444', EP: '#f59e0b', L: '#22c55e' };
const NIVEL_BG     = { I: 'rgba(239,68,68,0.1)', EP: 'rgba(245,158,11,0.1)', L: 'rgba(34,197,94,0.1)' };

export default function Seguimiento({ activeClassId, showToast }) {
  const [subView, setSubView] = useState(null); // null | 'individual' | 'grupal'
  const [alumnos, setAlumnos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!activeClassId) return;
    setLoading(true);
    Promise.all([
      api.getAlumnos(activeClassId),
      api.getUnidades(activeClassId),
      api.getEvaluaciones(activeClassId),
    ]).then(([als, uns, evs]) => {
      setAlumnos(als);
      setUnidades(uns);
      setEvaluaciones(evs);
      if (als.length > 0 && !selectedAlumnoId) setSelectedAlumnoId(als[0].id);
    }).catch(e => showToast(e.message, 'danger'))
      .finally(() => setLoading(false));
  }, [activeClassId]);

  useEffect(() => { load(); }, [load]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const evalsByAlumno = alumnoId =>
    evaluaciones
      .filter(e => e.alumnoId === alumnoId && (!filtroUnidad || e.unidadId === filtroUnidad))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const latestRubrica = alumnoId => {
    const evs = evalsByAlumno(alumnoId);
    return evs.length ? evs[evs.length - 1].rubrica : null;
  };

  const groupStats = () => {
    const evsFiltradas = filtroUnidad
      ? evaluaciones.filter(e => e.unidadId === filtroUnidad)
      : evaluaciones;
    const latestPerAlumno = {};
    evsFiltradas.forEach(ev => {
      if (!latestPerAlumno[ev.alumnoId] || new Date(ev.createdAt) > new Date(latestPerAlumno[ev.alumnoId].createdAt))
        latestPerAlumno[ev.alumnoId] = ev;
    });
    const stats = {};
    CRITERIOS.forEach(c => { stats[c.key] = { I: 0, EP: 0, L: 0 }; });
    Object.values(latestPerAlumno).forEach(ev => {
      CRITERIOS.forEach(c => {
        const n = ev.rubrica?.[c.key];
        if (n && ['I', 'EP', 'L'].includes(n)) stats[c.key][n]++;
      });
    });
    return stats;
  };

  // ── PDF Builders ───────────────────────────────────────────────────────────
  const handlePrintIndividual = () => {
    const a = alumnos.find(x => x.id === selectedAlumnoId);
    if (!a) return;
    const evs = evalsByAlumno(selectedAlumnoId);
    const w = window.open('', '_blank');
    w.document.write(buildIndividualReport(a, evs, unidades));
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 500);
  };

  const handlePrintGrupal = () => {
    const stats = groupStats();
    const w = window.open('', '_blank');
    w.document.write(buildGrupalReport(alumnos, stats, unidades, filtroUnidad));
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 500);
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="loading-container"><Loader className="spinner" /></div>;

  if (alumnos.length === 0) return (
    <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px', background: '#fff' }}>
      <AlertCircle size={48} className="text-muted" style={{ margin: '0 auto 1rem' }} />
      <h3 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>Sin datos disponibles</h3>
      <p className="text-muted">Registre alumnos y realice evaluaciones para ver el seguimiento.</p>
    </div>
  );

  const totalEvals = evaluaciones.length;
  const alumnosEvaluados = new Set(evaluaciones.map(e => e.alumnoId)).size;

  // Filtro panel (reutilizable)
  const FiltroPanel = () => (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ flex: '1 1 200px' }}>
        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Filtrar por Unidad</label>
        <select className="select-input" value={filtroUnidad} onChange={e => setFiltroUnidad(e.target.value)}>
          <option value="">— Todas las unidades —</option>
          {unidades.map(u => <option key={u.id} value={u.id}>{u.titulo}</option>)}
        </select>
      </div>
    </div>
  );

  // ── Home ───────────────────────────────────────────────────────────────────
  if (!subView) return (
    <SectionHome
      title="Seguimiento & Informes"
      subtitle="Monitoreo individual, grupal y exportación PDF"
      icon={<BarChart2 size={28} />}
      onSelect={setSubView}
      cards={[
        {
          id: 'individual', icon: <User size={22} />, color: '#4f46e5',
          title: 'Seguimiento Individual',
          description: `Historial de evaluaciones por alumno y estado actual en cada criterio.`,
          badge: `${alumnosEvaluados} eval.`
        },
        {
          id: 'grupal', icon: <Users size={22} />, color: '#0891b2',
          title: 'Seguimiento Grupal',
          description: 'Distribución I/EP/L por criterio para todo el grupo, con alertas de refuerzo.',
          badge: `${alumnos.length} alumnos`
        },
      ]}
      extraContent={
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <StatPill label="Alumnos" value={alumnos.length} color="#4f46e5" />
          <StatPill label="Evaluaciones totales" value={totalEvals} color="#0891b2" />
          <StatPill label="Alumnos evaluados" value={alumnosEvaluados} color="#22c55e" />
        </div>
      }
    />
  );

  // ── Sub-view: Individual ───────────────────────────────────────────────────
  if (subView === 'individual') {
    const historial = evalsByAlumno(selectedAlumnoId);
    const alumnoSel = alumnos.find(a => a.id === selectedAlumnoId);
    return (
      <div className="animate-slide-up">
        <SubViewHeader
          onBack={() => setSubView(null)}
          title="Seguimiento Individual"
          subtitle="Historial y estado por criterio"
          icon={<User size={20} />}
          actions={
            <button className="btn btn-secondary btn-sm" onClick={handlePrintIndividual}>
              <Printer size={14} /> PDF Individual
            </button>
          }
        />
        <FiltroPanel />

        {/* Selector alumno */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase' }}>Alumno</label>
          <select className="select-input" value={selectedAlumnoId} onChange={e => setSelectedAlumnoId(e.target.value)} style={{ maxWidth: 320 }}>
            {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>

        {/* Perfil del alumno */}
        {alumnoSel && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '1rem 1.25rem', borderRadius: '14px', background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.1)', marginBottom: '1.25rem' }}>
            <div className="avatar" style={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0 }}>{alumnoSel.nombre.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, color: 'var(--text-white)', margin: 0 }}>{alumnoSel.nombre}</p>
              {alumnoSel.representante && <p className="text-muted" style={{ margin: 0, fontSize: '0.78rem' }}>Rep: {alumnoSel.representante}</p>}
              <p className="text-muted" style={{ margin: 0, fontSize: '0.78rem' }}>{alumnoSel.padreCorreo}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="text-muted" style={{ fontSize: '0.7rem', margin: '0 0 0.15rem', textTransform: 'uppercase', fontWeight: 700 }}>Evaluaciones</p>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{historial.length}</span>
            </div>
          </div>
        )}

        {/* Estado actual por criterio */}
        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.1)', marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.88rem', margin: '0 0 0.9rem' }}>Estado Actual por Criterio</p>
          {CRITERIOS.map(c => {
            const n = latestRubrica(selectedAlumnoId)?.[c.key];
            return (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(148,163,184,0.07)' }}>
                <span style={{ flex: 1, color: 'var(--text-white)', fontSize: '0.86rem' }}>{c.label}</span>
                {n ? <span style={{ padding: '0.2rem 0.75rem', borderRadius: '6px', background: NIVEL_BG[n], color: NIVEL_COLORS[n], fontSize: '0.78rem', fontWeight: 700 }}>
                  {n === 'I' ? 'Iniciado' : n === 'EP' ? 'En Proceso' : 'Logrado'}
                </span> : <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>}
              </div>
            );
          })}
        </div>

        {/* Historial */}
        <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.88rem', margin: '0 0 0.9rem' }}>Historial ({historial.length})</p>
          {historial.length === 0
            ? <p className="text-muted" style={{ fontSize: '0.85rem' }}>Sin evaluaciones registradas.</p>
            : historial.map((ev, idx) => {
                const unidad = unidades.find(u => u.id === ev.unidadId);
                return (
                  <div key={ev.id} style={{ padding: '0.85rem 1rem', marginBottom: '0.6rem', borderRadius: '10px', background: 'rgba(100,116,139,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-white)', margin: 0, fontSize: '0.85rem' }}>Evaluación #{idx + 1}</p>
                      <p className="text-muted" style={{ fontSize: '0.72rem', margin: 0 }}>{new Date(ev.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    {unidad && <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 0.4rem' }}>Unidad: {unidad.titulo}</p>}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {CRITERIOS.map(c => {
                        const n = ev.rubrica?.[c.key];
                        return n ? (
                          <span key={c.key} style={{ padding: '0.15rem 0.55rem', borderRadius: '5px', background: NIVEL_BG[n], color: NIVEL_COLORS[n], fontSize: '0.72rem', fontWeight: 700 }}>
                            {c.label.split(' ')[0]}: {n}
                          </span>
                        ) : null;
                      })}
                    </div>
                    {ev.notaEscrita && <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ev.notaEscrita}</p>}
                  </div>
                );
              })}
        </div>
      </div>
    );
  }

  // ── Sub-view: Grupal ───────────────────────────────────────────────────────
  if (subView === 'grupal') {
    const stats = groupStats();
    return (
      <div className="animate-slide-up">
        <SubViewHeader
          onBack={() => setSubView(null)}
          title="Seguimiento Grupal"
          subtitle="Distribución por criterio — todos los alumnos"
          icon={<Users size={20} />}
          actions={
            <button className="btn btn-secondary btn-sm" onClick={handlePrintGrupal}>
              <Printer size={14} /> PDF Grupal
            </button>
          }
        />
        <FiltroPanel />

        {/* Barras por criterio */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(148,163,184,0.1)', marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.88rem', margin: '0 0 1rem' }}>Distribución por Criterio — {alumnos.length} alumnos</p>
          {CRITERIOS.map(c => {
            const s = stats[c.key];
            const total = (s.I + s.EP + s.L) || 1;
            return (
              <div key={c.key} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-white)', fontSize: '0.85rem' }}>{c.label}</span>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    {['I', 'EP', 'L'].map(n => (
                      <span key={n} style={{ fontSize: '0.75rem', color: NIVEL_COLORS[n], fontWeight: 700 }}>{n}: {s[n]}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', height: 10, borderRadius: '6px', overflow: 'hidden', background: 'rgba(148,163,184,0.15)' }}>
                  {['I', 'EP', 'L'].map(n => s[n] > 0 && (
                    <div key={n} style={{ width: `${(s[n] / total) * 100}%`, background: NIVEL_COLORS[n], transition: 'width 0.4s' }} title={`${n}: ${s[n]}`} />
                  ))}
                </div>
                {s.L / total < 0.4 && (
                  <p style={{ fontSize: '0.7rem', color: '#f59e0b', margin: '0.2rem 0 0' }}>⚠ Requiere refuerzo grupal</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Tabla resumen */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alumno</th>
                {CRITERIOS.map(c => <th key={c.key} style={{ fontSize: '0.72rem', textAlign: 'center' }}>{c.label}</th>)}
                <th style={{ textAlign: 'center' }}>Evals.</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map(a => {
                const rub = latestRubrica(a.id);
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>{a.nombre}</td>
                    {CRITERIOS.map(c => {
                      const n = rub?.[c.key];
                      return (
                        <td key={c.key} style={{ textAlign: 'center' }}>
                          {n
                            ? <span style={{ padding: '0.15rem 0.5rem', borderRadius: '5px', background: NIVEL_BG[n], color: NIVEL_COLORS[n], fontSize: '0.75rem', fontWeight: 700 }}>{n}</span>
                            : <span className="text-muted" style={{ fontSize: '0.72rem' }}>—</span>}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 700 }}>{evalsByAlumno(a.id).length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

// ── Small stat pill ────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{ padding: '0.65rem 1rem', borderRadius: '10px', background: `${color}0d`, border: `1px solid ${color}20`, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
      <span style={{ fontSize: '1.3rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</span>
    </div>
  );
}

// ── PDF builders ───────────────────────────────────────────────────────────
function buildIndividualReport(alumno, evaluaciones, unidades) {
  const rows = evaluaciones.map((ev, i) => {
    const unidad = unidades.find(u => u.id === ev.unidadId);
    const fecha = new Date(ev.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
    const criterios = ['clasificacion','seriacion','construccion','pensamientoLogico','metacognicion']
      .map(k => `<td style="text-align:center;color:${ev.rubrica?.[k]==='L'?'#16a34a':ev.rubrica?.[k]==='EP'?'#d97706':'#dc2626'};font-weight:700">${ev.rubrica?.[k]||'—'}</td>`).join('');
    return `<tr><td>#${i+1} — ${fecha}${unidad?`<br><small>${unidad.titulo}</small>`:''}</td>${criterios}<td>${ev.notaEscrita||''}</td></tr>`;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Informe ${alumno.nombre}</title>
  <style>body{font-family:Arial,sans-serif;padding:2rem;color:#1e293b}h1{font-size:1.3rem}p{color:#64748b;font-size:0.83rem}table{width:100%;border-collapse:collapse;margin-top:1rem}th,td{border:1px solid #e2e8f0;padding:0.45rem 0.7rem;font-size:0.8rem}th{background:#f8fafc;font-weight:700}@media print{body{padding:1rem}}</style></head><body>
  <h1>Informe Individual — ${alumno.nombre}</h1>
  <p>Representante: ${alumno.representante||'—'} | Contacto: ${alumno.padreCorreo} | Generado: ${new Date().toLocaleDateString('es-EC')}</p>
  <table><thead><tr><th>Evaluación</th><th>Clasif.</th><th>Seriación</th><th>Construc.</th><th>P.Lógico</th><th>Metacog.</th><th>Nota</th></tr></thead>
  <tbody>${rows||'<tr><td colspan="7" style="text-align:center;color:#94a3b8">Sin evaluaciones</td></tr>'}</tbody></table></body></html>`;
}

function buildGrupalReport(alumnos, stats, unidades, filtroUnidad) {
  const unidad = unidades.find(u => u.id === filtroUnidad);
  const CRIT = ['clasificacion','seriacion','construccion','pensamientoLogico','metacognicion'];
  const LABELS = ['Clasificación','Seriación','Construcción','Pens. Lógico','Metacognición'];
  const rows = CRIT.map((c, i) => {
    const s = stats[c] || { I:0, EP:0, L:0 };
    return `<tr><td>${LABELS[i]}</td><td style="color:#dc2626;font-weight:700">${s.I}</td><td style="color:#d97706;font-weight:700">${s.EP}</td><td style="color:#16a34a;font-weight:700">${s.L}</td></tr>`;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resumen Grupal</title>
  <style>body{font-family:Arial,sans-serif;padding:2rem;color:#1e293b}h1{font-size:1.3rem}p{color:#64748b;font-size:0.83rem}table{width:100%;border-collapse:collapse;margin-top:1rem}th,td{border:1px solid #e2e8f0;padding:0.45rem 0.7rem;font-size:0.83rem}th{background:#f8fafc;font-weight:700}@media print{body{padding:1rem}}</style></head><body>
  <h1>Resumen Grupal</h1>
  <p>${unidad?`Unidad: ${unidad.titulo} | `:''}Alumnos: ${alumnos.length} | Generado: ${new Date().toLocaleDateString('es-EC')}</p>
  <table><thead><tr><th>Criterio</th><th>Iniciado (I)</th><th>En Proceso (EP)</th><th>Logrado (L)</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`;
}
