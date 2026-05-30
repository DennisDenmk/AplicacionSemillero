/**
 * Entry Point — EduDocente Backend
 *
 * This file is intentionally minimal. All application configuration lives in:
 *   - src/infrastructure/server.js  (Express app + routes + middleware)
 *   - src/infrastructure/database/postgres.js  (PostgreSQL pool + DDL)
 *   - src/repositories/  (data access layer)
 *   - src/controllers/   (request handling)
 *   - src/routes/        (route definitions)
 *   - src/domain/        (models + utilities)
 */

const app = require('./src/infrastructure/server');
const { initDatabase } = require('./src/infrastructure/database/postgres');

const PORT = process.env.PORT || 3000;

// Initialize DB schema, then start HTTP server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`SERVIDOR INICIADO EN EL PUERTO ${PORT}`);
    console.log(`Visita: http://localhost:${PORT}`);
    console.log('====================================================');
  });
});

// ============================================================
// NUEVAS APIs — RF-D02 Unidades Didácticas
// ============================================================

app.get('/api/unidades', async (req, res) => {
  const { claseId } = req.query;
  if (!claseId) return res.status(400).json({ error: 'claseId es obligatorio' });
  if (!isValidUuid(claseId)) return res.json([]);
  try {
    const r = await pool.query(
      'SELECT * FROM unidades WHERE clase_id = $1 ORDER BY created_at ASC', [claseId]
    );
    res.json(r.rows.map(mapUnidad));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/unidades', async (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId || !isValidUuid(userId)) return res.status(401).json({ error: 'No autorizado' });
  const { claseId, titulo, ambito, objetivoGeneral, objetivoAprendizaje, destrezas, semanasPrevistas, descripcionActividades, imagenUrl, tecnicasDidacticas, criteriosEvaluacion, materiales } = req.body;
  if (!claseId || !titulo) return res.status(400).json({ error: 'claseId y titulo son requeridos' });
  if (!isValidUuid(claseId)) return res.status(400).json({ error: 'claseId inválido' });
  try {
    const r = await pool.query(
      `INSERT INTO unidades (clase_id,titulo,ambito,objetivo_general,objetivo_aprendizaje,destrezas,semanas_previstas,descripcion_actividades,imagen_url,tecnicas_didacticas,criterios_evaluacion,materiales)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [claseId,titulo,ambito||null,objetivoGeneral||null,objetivoAprendizaje||null,destrezas||null,semanasPrevistas||1,descripcionActividades||null,imagenUrl||null,tecnicasDidacticas||null,criteriosEvaluacion||null,JSON.stringify(materiales||[])]
    );
    res.status(201).json(mapUnidad(r.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/unidades/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidUuid(id)) return res.status(404).json({ error: 'Unidad no encontrada' });
  const { titulo, ambito, objetivoGeneral, objetivoAprendizaje, destrezas, semanasPrevistas, descripcionActividades, imagenUrl, tecnicasDidacticas, criteriosEvaluacion, materiales, archivada } = req.body;
  try {
    const r = await pool.query(
      `UPDATE unidades SET titulo=$1,ambito=$2,objetivo_general=$3,objetivo_aprendizaje=$4,destrezas=$5,semanas_previstas=$6,descripcion_actividades=$7,imagen_url=$8,tecnicas_didacticas=$9,criterios_evaluacion=$10,materiales=$11,archivada=$12,updated_at=now() WHERE id=$13 RETURNING *`,
      [titulo,ambito||null,objetivoGeneral||null,objetivoAprendizaje||null,destrezas||null,semanasPrevistas||1,descripcionActividades||null,imagenUrl||null,tecnicasDidacticas||null,criteriosEvaluacion||null,JSON.stringify(materiales||[]),archivada===true,id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Unidad no encontrada' });
    res.json(mapUnidad(r.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/unidades/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidUuid(id)) return res.status(404).json({ error: 'Unidad no encontrada' });
  try {
    await pool.query('DELETE FROM unidades WHERE id=$1', [id]);
    res.json({ message: 'Unidad eliminada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Clone a unidad
app.post('/api/unidades/:id/clonar', async (req, res) => {
  const { id } = req.params;
  if (!isValidUuid(id)) return res.status(404).json({ error: 'Unidad no encontrada' });
  try {
    const orig = await pool.query('SELECT * FROM unidades WHERE id=$1', [id]);
    if (orig.rows.length === 0) return res.status(404).json({ error: 'Unidad no encontrada' });
    const u = orig.rows[0];
    const r = await pool.query(
      `INSERT INTO unidades (clase_id,titulo,ambito,objetivo_general,objetivo_aprendizaje,destrezas,semanas_previstas,descripcion_actividades,imagen_url,tecnicas_didacticas,criterios_evaluacion,materiales)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [u.clase_id, u.titulo+' (Copia)', u.ambito, u.objetivo_general, u.objetivo_aprendizaje, u.destrezas, u.semanas_previstas, u.descripcion_actividades, u.imagen_url, u.tecnicas_didacticas, u.criterios_evaluacion, u.materiales]
    );
    res.status(201).json(mapUnidad(r.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// NUEVAS APIs — RF-D03 Evaluaciones con Rúbrica I/EP/L
// ============================================================

app.get('/api/evaluaciones', async (req, res) => {
  const { claseId, alumnoId } = req.query;
  if (!claseId && !alumnoId) return res.status(400).json({ error: 'claseId o alumnoId requerido' });
  try {
    let r;
    if (alumnoId && isValidUuid(alumnoId)) {
      r = await pool.query('SELECT * FROM evaluaciones WHERE alumno_id=$1 ORDER BY created_at ASC', [alumnoId]);
    } else if (claseId && isValidUuid(claseId)) {
      r = await pool.query('SELECT * FROM evaluaciones WHERE clase_id=$1 ORDER BY created_at ASC', [claseId]);
    } else { return res.json([]); }
    res.json(r.rows.map(mapEvaluacion));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/evaluaciones', async (req, res) => {
  const { alumnoId, unidadId, claseId, rubrica, notaEscrita } = req.body;
  if (!alumnoId || !claseId || !rubrica) return res.status(400).json({ error: 'alumnoId, claseId y rubrica son requeridos' });
  if (!isValidUuid(alumnoId) || !isValidUuid(claseId)) return res.status(400).json({ error: 'IDs inválidos' });
  try {
    const r = await pool.query(
      `INSERT INTO evaluaciones (alumno_id,unidad_id,clase_id,rubrica,nota_escrita) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [alumnoId, unidadId&&isValidUuid(unidadId)?unidadId:null, claseId, JSON.stringify(rubrica), notaEscrita||null]
    );
    res.status(201).json(mapEvaluacion(r.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// NUEVAS APIs — RF-D06 Ficha de Monitoreo Individual
// ============================================================

// ── Monitoreo: per alumno + per tarea (unidad) ──────────────────────────────
app.get('/api/monitoreo/:alumnoId', async (req, res) => {
  const { alumnoId } = req.params;
  const { unidadId } = req.query;
  if (!isValidUuid(alumnoId)) return res.status(400).json({ error: 'alumnoId inválido' });
  try {
    let r;
    if (unidadId && isValidUuid(unidadId)) {
      r = await pool.query('SELECT * FROM monitoreo WHERE alumno_id=$1 AND unidad_id=$2', [alumnoId, unidadId]);
    } else {
      r = await pool.query('SELECT * FROM monitoreo WHERE alumno_id=$1 AND unidad_id IS NULL', [alumnoId]);
    }
    res.json(r.rows.length > 0 ? mapMonitoreo(r.rows[0]) : null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/monitoreo', async (req, res) => {
  const { alumnoId, unidadId, clasificacionObs, clasificacionApoyo, seriacionObs, seriacionApoyo, asimilacionObs, asimilacionApoyo, justificacionObs, justificacionApoyo, autorregulacionObs, autorregulacionApoyo } = req.body;
  if (!alumnoId || !isValidUuid(alumnoId)) return res.status(400).json({ error: 'alumnoId inválido' });
  const unidad = unidadId && isValidUuid(unidadId) ? unidadId : null;
  try {
    const exists = await pool.query(
      'SELECT id FROM monitoreo WHERE alumno_id=$1 AND (unidad_id=$2 OR ($2 IS NULL AND unidad_id IS NULL))',
      [alumnoId, unidad]
    );
    if (exists.rows.length > 0) {
      const r = await pool.query(
        `UPDATE monitoreo SET clasificacion_obs=$1,clasificacion_apoyo=$2,seriacion_obs=$3,seriacion_apoyo=$4,asimilacion_obs=$5,asimilacion_apoyo=$6,justificacion_obs=$7,justificacion_apoyo=$8,autorregulacion_obs=$9,autorregulacion_apoyo=$10,updated_at=now() WHERE alumno_id=$11 AND (unidad_id=$12 OR ($12 IS NULL AND unidad_id IS NULL)) RETURNING *`,
        [clasificacionObs,clasificacionApoyo,seriacionObs,seriacionApoyo,asimilacionObs,asimilacionApoyo,justificacionObs,justificacionApoyo,autorregulacionObs,autorregulacionApoyo,alumnoId,unidad]
      );
      return res.json(mapMonitoreo(r.rows[0]));
    }
    const r = await pool.query(
      `INSERT INTO monitoreo (alumno_id,unidad_id,clasificacion_obs,clasificacion_apoyo,seriacion_obs,seriacion_apoyo,asimilacion_obs,asimilacion_apoyo,justificacion_obs,justificacion_apoyo,autorregulacion_obs,autorregulacion_apoyo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [alumnoId,unidad,clasificacionObs,clasificacionApoyo,seriacionObs,seriacionApoyo,asimilacionObs,asimilacionApoyo,justificacionObs,justificacionApoyo,autorregulacionObs,autorregulacionApoyo]
    );
    res.status(201).json(mapMonitoreo(r.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Autoevaluación: per alumno + per tarea ──────────────────────────────────
app.get('/api/autoevaluacion', async (req, res) => {
  const userId = req.headers['user-id'];
  const { claseId, alumnoId, unidadId } = req.query;
  if (!userId || !isValidUuid(userId)) return res.status(401).json({ error: 'No autorizado' });
  if (!claseId || !isValidUuid(claseId)) return res.json([]);
  try {
    let r;
    if (alumnoId && isValidUuid(alumnoId) && unidadId && isValidUuid(unidadId)) {
      r = await pool.query('SELECT * FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND alumno_id=$3 AND unidad_id=$4 ORDER BY created_at DESC LIMIT 1', [userId, claseId, alumnoId, unidadId]);
    } else {
      r = await pool.query('SELECT * FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 ORDER BY created_at DESC', [userId, claseId]);
    }
    res.json(r.rows.map(mapAutoevaluacion));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/autoevaluacion', async (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId || !isValidUuid(userId)) return res.status(401).json({ error: 'No autorizado' });
  const { claseId, unidadId, alumnoId, respuestas } = req.body;
  if (!claseId || !respuestas) return res.status(400).json({ error: 'claseId y respuestas son requeridos' });
  if (!isValidUuid(claseId)) return res.status(400).json({ error: 'claseId inválido' });
  const unidad = unidadId && isValidUuid(unidadId) ? unidadId : null;
  const alumno = alumnoId && isValidUuid(alumnoId) ? alumnoId : null;
  try {
    // Upsert: one autoeval per (docente, alumno, unidad)
    const exists = await pool.query(
      'SELECT id FROM autoevaluacion WHERE docente_id=$1 AND clase_id=$2 AND alumno_id=$3 AND (unidad_id=$4 OR ($4 IS NULL AND unidad_id IS NULL))',
      [userId, claseId, alumno, unidad]
    );
    if (exists.rows.length > 0) {
      const r = await pool.query(
        'UPDATE autoevaluacion SET respuestas=$1 WHERE id=$2 RETURNING *',
        [JSON.stringify(respuestas), exists.rows[0].id]
      );
      return res.json(mapAutoevaluacion(r.rows[0]));
    }
    const r = await pool.query(
      `INSERT INTO autoevaluacion (docente_id,unidad_id,alumno_id,clase_id,respuestas) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, unidad, alumno, claseId, JSON.stringify(respuestas)]
    );
    res.status(201).json(mapAutoevaluacion(r.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Matriz consolidada: estado de evaluaciones por tarea ────────────────────
app.get('/api/evaluaciones-matriz/:claseId/:unidadId', async (req, res) => {
  const userId = req.headers['user-id'];
  const { claseId, unidadId } = req.params;
  if (!isValidUuid(claseId) || !isValidUuid(unidadId)) return res.status(400).json({ error: 'IDs inválidos' });
  try {
    const alumnos = await pool.query('SELECT id, nombre FROM alumnos WHERE clase_id=$1 ORDER BY nombre', [claseId]);
    const evaluaciones = await pool.query(
      'SELECT DISTINCT alumno_id FROM evaluaciones WHERE clase_id=$1 AND unidad_id=$2', [claseId, unidadId]
    );
    const monitoreos = await pool.query(
      'SELECT DISTINCT alumno_id FROM monitoreo WHERE unidad_id=$1 AND alumno_id IS NOT NULL', [unidadId]
    );
    
    let autoSet = new Set();
    if (userId && isValidUuid(userId)) {
      const autoevals = await pool.query(
        'SELECT DISTINCT alumno_id FROM autoevaluacion WHERE clase_id=$1 AND unidad_id=$2 AND docente_id=$3 AND alumno_id IS NOT NULL',
        [claseId, unidadId, userId]
      );
      autoSet = new Set(autoevals.rows.map(r => r.alumno_id));
    }

    const evalSet = new Set(evaluaciones.rows.map(r => r.alumno_id));
    const monSet  = new Set(monitoreos.rows.map(r => r.alumno_id));

    const matriz = alumnos.rows.map(a => ({
      alumnoId:   a.id,
      nombre:     a.nombre,
      rubrica:    evalSet.has(a.id),
      monitoreo:  monSet.has(a.id),
      autoeval:   autoSet.has(a.id),
    }));
    res.json(matriz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Updated alumnos PUT to support new fields
app.put('/api/alumnos/:id', async (req, res) => {
  const alumnoId = req.params.id;
  const { nombre, padreCorreo, representante, telefono } = req.body;
  if (!nombre || !padreCorreo) return res.status(400).json({ error: 'nombre y padreCorreo son obligatorios' });
  if (!isValidUuid(alumnoId)) return res.status(404).json({ error: 'Alumno no encontrado' });
  try {
    const r = await pool.query(
      'UPDATE alumnos SET nombre=$1,padre_correo=$2,representante=$3,telefono=$4 WHERE id=$5 RETURNING *',
      [nombre, padreCorreo, representante||null, telefono||null, alumnoId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json(mapAlumno(r.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Fallback to serve React SPA on any other unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`SERVIDOR INICIADO EN EL PUERTO ${PORT}`);
  console.log(`Visita: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
