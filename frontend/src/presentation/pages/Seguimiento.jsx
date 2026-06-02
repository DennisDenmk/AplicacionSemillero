import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, User, Users, Loader, AlertCircle, Printer, Calendar, Award, ShieldAlert, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import SectionHome from '../components/SectionHome';
import SubViewHeader from '../components/SubViewHeader';

const CRITERIOS = [
  { key: 'clasificacion',     label: 'Clasificación de información' },
  { key: 'seriacion',         label: 'Seriación y ordenamiento' },
  { key: 'construccion',      label: 'Construcción de conocimiento' },
  { key: 'pensamientoLogico', label: 'Pensamiento lógico' },
  { key: 'metacognicion',     label: 'Metacognición' },
];

const NIVEL_COLORS = { I: '#ef4444', EP: '#f59e0b', L: '#22c55e' };
const NIVEL_BG     = { I: '#fee2e2', EP: '#fef3c7', L: '#dcfce7' };

export default function Seguimiento({ clases = [], activeClassId, setActiveClassId, showToast }) {
  const [subView, setSubView] = useState(null); // null | 'individual' | 'grupal'
  const [alumnos, setAlumnos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('');
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [loading, setLoading] = useState(false);

  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [notaSeguimiento, setNotaSeguimiento] = useState('');
  const [savingNota, setSavingNota] = useState(false);

  // Load class data
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
      
      // Auto-select first student if none selected
      if (als.length > 0) {
        setSelectedAlumnoId(als[0].id);
      }
      
      // Auto-select latest unit as active filter for better initial dashboard view
      if (uns.length > 0 && !filtroUnidad) {
        setFiltroUnidad(uns[uns.length - 1].id);
      }
    }).catch(e => showToast(e.message || 'Error al cargar datos', 'danger'))
      .finally(() => setLoading(false));
  }, [activeClassId]);

  useEffect(() => { load(); }, [load]);

  // Load observation note when student/unit changes
  useEffect(() => {
    if (!selectedAlumnoId) {
      setNotaSeguimiento('');
      return;
    }
    setNotaSeguimiento('');
    api.getMonitoreo(selectedAlumnoId, filtroUnidad || null)
      .then(m => {
        if (m && m.notaSeguimientoObs) {
          setNotaSeguimiento(m.notaSeguimientoObs);
        } else {
          setNotaSeguimiento('');
        }
      })
      .catch(() => setNotaSeguimiento(''));
  }, [selectedAlumnoId, filtroUnidad]);

  const handleSaveNotaSeguimiento = async () => {
    if (!selectedAlumnoId) return;
    setSavingNota(true);
    try {
      await api.saveMonitoreo({
        alumnoId: selectedAlumnoId,
        unidadId: filtroUnidad || null,
        notaSeguimientoObs: notaSeguimiento
      });
      showToast('Nota de seguimiento guardada con éxito', 'success');
    } catch (e) {
      showToast(e.message || 'Error al guardar la nota', 'danger');
    } finally {
      setSavingNota(false);
    }
  };

  // --- Calculations and statistics ---
  const evalsByAlumno = alumnoId =>
    evaluaciones
      .filter(e => {
        if (e.alumnoId !== alumnoId) return false;
        if (filtroUnidad && e.unidadId !== filtroUnidad) return false;
        if (filtroFechaDesde && new Date(e.createdAt) < new Date(filtroFechaDesde + 'T00:00:00')) return false;
        if (filtroFechaHasta && new Date(e.createdAt) > new Date(filtroFechaHasta + 'T23:59:59')) return false;
        return true;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const latestRubrica = alumnoId => {
    const evs = evalsByAlumno(alumnoId);
    return evs.length ? evs[evs.length - 1].rubrica : null;
  };

  // Computes the active group's latest evaluations statistics
  const getGroupData = () => {
    const evsFiltradas = evaluaciones.filter(e => {
      if (filtroUnidad && e.unidadId !== filtroUnidad) return false;
      if (filtroFechaDesde && new Date(e.createdAt) < new Date(filtroFechaDesde + 'T00:00:00')) return false;
      if (filtroFechaHasta && new Date(e.createdAt) > new Date(filtroFechaHasta + 'T23:59:59')) return false;
      return true;
    });

    const latestPerAlumno = {};
    evsFiltradas.forEach(ev => {
      if (!latestPerAlumno[ev.alumnoId] || new Date(ev.createdAt) > new Date(latestPerAlumno[ev.alumnoId].createdAt)) {
        latestPerAlumno[ev.alumnoId] = ev;
      }
    });

    const stats = {};
    CRITERIOS.forEach(c => { stats[c.key] = { I: 0, EP: 0, L: 0 }; });
    
    let totalL = 0;
    let totalEP = 0;
    let totalEvaluados = Object.keys(latestPerAlumno).length;

    Object.values(latestPerAlumno).forEach(ev => {
      CRITERIOS.forEach(c => {
        const n = ev.rubrica?.[c.key];
        if (n && ['I', 'EP', 'L'].includes(n)) {
          stats[c.key][n]++;
          if (n === 'L') totalL++;
          if (n === 'EP') totalEP++;
        }
      });
    });

    // Calculate achievement criteria count needing reinforcement (< 80%)
    let criteriaRefuerzoCount = 0;
    CRITERIOS.forEach(c => {
      const s = stats[c.key];
      const tot = s.I + s.EP + s.L;
      if (tot > 0) {
        const pct = ((s.L + s.EP) / tot) * 100;
        if (pct < 80) criteriaRefuerzoCount++;
      }
    });

    const logroPromedio = totalEvaluados > 0 
      ? Math.round(((totalL + totalEP * 0.5) / (totalEvaluados * 5)) * 100)
      : 0;

    return {
      latestPerAlumno,
      stats,
      totalEvaluados,
      logroPromedio,
      criteriaRefuerzoCount
    };
  };

  const groupData = getGroupData();

  // --- PRINT PDF ---
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
    const w = window.open('', '_blank');
    w.document.write(buildGrupalReport(alumnos, groupData.stats, unidades, filtroUnidad));
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 500);
  };

  // Badge component for student matrix
  const getMatrixBadge = (val) => {
    if (val === 'L') {
      return (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }} title="Logrado">
          L
        </div>
      );
    }
    if (val === 'EP') {
      return (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }} title="En Proceso">
          EP
        </div>
      );
    }
    if (val === 'I') {
      return (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }} title="Iniciado">
          I
        </div>
      );
    }
    return <span style={{ color: '#cbd5e1', fontWeight: 500 }}>—</span>;
  };

  if (loading) return <div className="loading-container"><Loader className="spinner" /></div>;

  if (alumnos.length === 0) return (
    <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '24px', background: '#fff', border: '1px solid #e2e8f0' }}>
      <AlertCircle size={48} className="text-muted" style={{ margin: '0 auto 1rem' }} />
      <h3 className="font-outfit text-white" style={{ fontWeight: 'bold' }}>Sin datos disponibles</h3>
      <p className="text-muted">Registre alumnos y realice evaluaciones para ver el seguimiento.</p>
    </div>
  );

  const totalEvals = evaluaciones.length;
  const alumnosEvaluadosCount = new Set(evaluaciones.map(e => e.alumnoId)).size;

  // --- VIEW: HOME INDEX ---
  if (!subView) return (
    <SectionHome
      title="Seguimiento & Informes"
      subtitle="Monitoreo individual, grupal y exportación PDF"
      icon={<BarChart2 size={28} />}
      onSelect={setSubView}
      cards={[
        {
          id: 'grupal', icon: <Users size={22} />, color: '#0891b2',
          title: 'Seguimiento Grupal',
          description: 'Distribución por criterios, estadísticas de logro general y matriz resumen de alumnos.',
          badge: `${alumnos.length} alumnos`
        },
        {
          id: 'individual', icon: <User size={22} />, color: '#4f46e5',
          title: 'Seguimiento Individual',
          description: `Historial completo de observaciones, notas y evolución cognitiva de cada niño.`,
          badge: `${alumnosEvaluadosCount} eval.`
        }
      ]}
      extraContent={
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <StatPill label="Alumnos" value={alumnos.length} color="#4f46e5" />
          <StatPill label="Evaluaciones totales" value={totalEvals} color="#0891b2" />
          <StatPill label="Alumnos evaluados" value={alumnosEvaluadosCount} color="#22c55e" />
        </div>
      }
    />
  );

  // --- VIEW: INDIVIDUAL TRACKING ---
  if (subView === 'individual') {
    const historial = evalsByAlumno(selectedAlumnoId);
    const alumnoSel = alumnos.find(a => a.id === selectedAlumnoId);
    
    // Calculate student individual logro
    const rub = latestRubrica(selectedAlumnoId);
    let totalScore = 0;
    let evalCount = 0;
    if (rub) {
      CRITERIOS.forEach(c => {
        if (rub[c.key] === 'L') { totalScore += 100; evalCount++; }
        else if (rub[c.key] === 'EP') { totalScore += 50; evalCount++; }
        else if (rub[c.key] === 'I') { evalCount++; }
      });
    }
    const logroIndividual = evalCount > 0 ? Math.round(totalScore / evalCount) : 0;

    return (
      <div className="animate-slide-up" style={{ padding: '8px' }}>
        <SubViewHeader
          onBack={() => setSubView(null)}
          title="Seguimiento Individual"
          subtitle="Historial y estado por criterio"
          icon={<User size={20} />}
          actions={
            <button className="btn btn-secondary btn-sm" onClick={handlePrintIndividual} style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#1e293b', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}>
              <Printer size={14} /> Exportar PDF
            </button>
          }
        />

        {/* Dynamic Class, Student & Unit Selector Row */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Aula / Grupo</label>
            <select 
              className="select-input" 
              value={activeClassId} 
              onChange={e => { setActiveClassId(e.target.value); setFiltroUnidad(''); }}
              style={{ width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', color: '#1e293b', fontWeight: 600 }}
            >
              {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Seleccionar Alumno</label>
            <select 
              className="select-input" 
              value={selectedAlumnoId} 
              onChange={e => setSelectedAlumnoId(e.target.value)}
              style={{ width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', color: '#1e293b', fontWeight: 600 }}
            >
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 250px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Unidad Curricular</label>
            <select 
              className="select-input" 
              value={filtroUnidad} 
              onChange={e => setFiltroUnidad(e.target.value)}
              style={{ width: '100%', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', color: '#1e293b', fontWeight: 600 }}
            >
              <option value="">— Todas las unidades —</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.titulo}</option>)}
            </select>
          </div>
        </div>

        {/* Stats Summary Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
              {historial.length}
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluaciones realizadas</span>
          </div>

          <div className="glass" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
              {logroIndividual}%
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logro individual promedio</span>
          </div>

          <div className="glass" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
              {rub ? Object.values(rub).filter(v => v === 'L').length : 0}/5
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criterios logrados</span>
          </div>
        </div>

        {/* Current status per criterion card */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            Estado Actual por Criterio
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CRITERIOS.map(c => {
              const n = latestRubrica(selectedAlumnoId)?.[c.key];
              return (
                <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 500 }}>{c.label}</span>
                  {n ? (
                    <span className="badge" style={{ background: NIVEL_BG[n], color: NIVEL_COLORS[n], fontWeight: 700, fontSize: '0.8rem', padding: '4px 10px', borderRadius: '8px' }}>
                      {n === 'I' ? 'Iniciado' : n === 'EP' ? 'En Proceso' : 'Logrado'}
                    </span>
                  ) : <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Sin calificar</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Written support observation note */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            📝 Nota de Seguimiento & Apoyo Pedagógico
          </h3>
          <textarea
            className="select-input"
            value={notaSeguimiento}
            onChange={e => setNotaSeguimiento(e.target.value)}
            placeholder="Escriba aquí observaciones de seguimiento rápido, estrategias de andamiaje y apoyos requeridos..."
            style={{ width: '100%', minHeight: 90, resize: 'vertical', background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px', fontSize: '0.9rem', marginBottom: '12px', outline: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSaveNotaSeguimiento} 
              className="btn btn-primary btn-sm" 
              disabled={savingNota}
              style={{ background: '#2563eb', borderColor: '#2563eb', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}
            >
              {savingNota ? 'Guardando nota...' : 'Guardar Observación'}
            </button>
          </div>
        </div>

        {/* Evaluation History Timeline */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            Historial de Evaluaciones ({historial.length})
          </h3>
          {historial.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '0.95rem', textAlign: 'center', padding: '24px' }}>No hay evaluaciones registradas en esta unidad.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {historial.map((ev, idx) => {
                const u = unidades.find(un => un.id === ev.unidadId);
                return (
                  <div key={ev.id} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      <span>Evaluación #{idx + 1} {u ? `· ${u.titulo}` : ''}</span>
                      <span>{new Date(ev.createdAt).toLocaleDateString('es-EC')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {CRITERIOS.map(c => {
                        const n = ev.rubrica?.[c.key];
                        return n ? (
                          <span key={c.key} style={{ padding: '3px 8px', borderRadius: '6px', background: NIVEL_BG[n], color: NIVEL_COLORS[n], fontSize: '0.72rem', fontWeight: 700 }}>
                            {c.label.split(' ')[0]}: {n}
                          </span>
                        ) : null;
                      })}
                    </div>
                    {ev.notaEscrita && (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', fontStyle: 'italic', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                        "{ev.notaEscrita}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW: GROUP TRACKING ---
  if (subView === 'grupal') {
    return (
      <div className="animate-slide-up" style={{ padding: '8px' }}>
        <SubViewHeader
          onBack={() => setSubView(null)}
          title="Seguimiento grupal"
          subtitle="Monitoreo de logros cognitivos y alertas de refuerzo"
          icon={<Users size={20} />}
          actions={
            <button className="btn btn-secondary btn-sm" onClick={handlePrintGrupal} style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#1e293b', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}>
              <Printer size={14} /> PDF Grupal
            </button>
          }
        />

        {/* Dropdowns Selector in the top right exact layout */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div>
            <select 
              className="select-input" 
              value={activeClassId} 
              onChange={e => { setActiveClassId(e.target.value); setFiltroUnidad(''); }}
              style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              {clases.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div>
            <select 
              className="select-input" 
              value={filtroUnidad} 
              onChange={e => setFiltroUnidad(e.target.value)}
              style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', maxWidth: '300px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">— Todas las unidades —</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.titulo}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic 3 Summary Stats Cards Grid matching the mockup */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="glass" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
              {groupData.totalEvaluados}
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alumnos evaluados</span>
          </div>

          <div className="glass" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
              {groupData.logroPromedio}%
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logro promedio</span>
          </div>

          <div className="glass" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
              {groupData.criteriaRefuerzoCount}
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criterios por reforzar</span>
          </div>
        </div>

        {/* Section 1 Card: Progreso grupal por criterio stacked charts */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            Progreso grupal por criterio
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {CRITERIOS.map(c => {
              const s = groupData.stats[c.key] || { I: 0, EP: 0, L: 0 };
              const evaluatedCount = s.I + s.EP + s.L;
              const total = evaluatedCount || 1;
              const percentI = evaluatedCount > 0 ? (s.I / total) * 100 : 0;
              const percentEP = evaluatedCount > 0 ? (s.EP / total) * 100 : 0;
              const percentL = evaluatedCount > 0 ? (s.L / total) * 100 : 0;
              
              // Achievement is defined as the proportion of students who are En Proceso (EP) or Logrado (L)
              const achievementPercent = evaluatedCount > 0 ? Math.round(((s.L + s.EP) / total) * 100) : 0;
              const needsReinforcement = evaluatedCount > 0 && achievementPercent < 80;

              return (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  {/* Left Label */}
                  <div style={{ width: '250px', fontSize: '0.9rem', fontWeight: 600, color: needsReinforcement ? '#ef4444' : '#1e293b' }}>
                    {needsReinforcement ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ⚠ {c.label} (requiere refuerzo)
                      </span>
                    ) : c.label}
                  </div>

                  {/* Horizontal Stacked Bar */}
                  <div style={{ flex: 1, minWidth: '200px', display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', background: '#f1f5f9' }}>
                    {evaluatedCount === 0 ? (
                      <div style={{ width: '100%', background: '#e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                        Sin evaluar
                      </div>
                    ) : (
                      <>
                        {s.I > 0 && (
                          <div style={{ width: `${percentI}%`, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontTarget: 'center', fontSize: '0.8rem', fontWeight: 700, transition: 'width 0.4s ease' }} title={`Iniciado: ${s.I}`}>
                            {s.I}
                          </div>
                        )}
                        {s.EP > 0 && (
                          <div style={{ width: `${percentEP}%`, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, transition: 'width 0.4s ease' }} title={`En Proceso: ${s.EP}`}>
                            {s.EP}
                          </div>
                        )}
                        {s.L > 0 && (
                          <div style={{ width: `${percentL}%`, background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, transition: 'width 0.4s ease' }} title={`Logrado: ${s.L}`}>
                            {s.L}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right Achievement Percent Label */}
                  <div style={{ width: '60px', textTarget: 'right', textAlign: 'right', fontSize: '0.95rem', fontWeight: 700, color: needsReinforcement ? '#ef4444' : '#1e293b' }}>
                    {achievementPercent}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2 Card: Resumen por alumno matrix grid */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', fontFamily: 'Outfit, sans-serif' }}>
            Resumen por alumno
          </h3>

          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '16px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alumno</th>
                  <th style={{ padding: '16px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Clasificación</th>
                  <th style={{ padding: '16px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Seriación</th>
                  <th style={{ padding: '16px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Const. Conocimiento</th>
                  <th style={{ padding: '16px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Pensamiento Lógico</th>
                  <th style={{ padding: '16px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Metacognición</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map(a => {
                  const rub = latestRubrica(a.id);
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 12px', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{a.nombre}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>{getMatrixBadge(rub?.clasificacion)}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>{getMatrixBadge(rub?.seriacion)}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>{getMatrixBadge(rub?.construccion)}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>{getMatrixBadge(rub?.pensamientoLogico)}</td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>{getMatrixBadge(rub?.metacognicion)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// --- Dynamic Stat Pill ---
function StatPill({ label, value, color }) {
  return (
    <div style={{ padding: '12px 20px', borderRadius: '12px', background: `${color}08`, border: `1px solid ${color}1c`, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
      <span style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginTop: '4px', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// --- PDF HTML Reports builders ---
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
