const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- PostgreSQL Database Pool Setup ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5432/Clase'
});

// Verify connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('====================================================');
    console.error('ERROR AL CONECTAR CON LA BASE DE DATOS POSTGRESQL:');
    console.error(err.message);
    console.error('Por favor, asegúrate de que PostgreSQL está corriendo y de definir la variable DATABASE_URL.');
    console.error('====================================================');
  } else {
    console.log('====================================================');
    console.log('CONEXIÓN EXITOSA CON LA BASE DE DATOS POSTGRESQL');
    console.log('====================================================');
    release();
  }
});

// --- Table Initialization Script (DDL) ---
const initDbQuery = `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: docentes (Maestros/Investigadores)
CREATE TABLE IF NOT EXISTS "docentes" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nombre" varchar(255) NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

-- 2. Table: clases (Aulas)
CREATE TABLE IF NOT EXISTS "clases" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nombre" varchar(255) NOT NULL,
  "grado" varchar(255) NOT NULL,
  "docente_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

-- 3. Table: alumnos (Estudiantes)
CREATE TABLE IF NOT EXISTS "alumnos" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "clase_id" uuid NOT NULL,
  "nombre" varchar(255) NOT NULL,
  "padre_correo" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

-- 4. Table: tareas (Fichas Didácticas)
CREATE TABLE IF NOT EXISTS "tareas" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "clase_id" uuid NOT NULL,
  "titulo" varchar(255) NOT NULL,
  "imagen_url" varchar(512) NOT NULL,
  "actividad_tipo" varchar(50) NOT NULL,
  "detalles" jsonb NOT NULL,
  "materiales" jsonb,
  "created_at" timestamp DEFAULT (now())
);

-- 5. Table: notas (Calificaciones & Rúbricas)
CREATE TABLE IF NOT EXISTS "notas" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "alumno_id" uuid NOT NULL,
  "tarea_id" varchar(255) NOT NULL,
  "valor" decimal(4,2) NOT NULL,
  "comentario" text,
  "created_at" timestamp DEFAULT (now())
);

-- Comments metadata
COMMENT ON TABLE "docentes" IS 'Registra los docentes e investigadores que acceden a la plataforma';
COMMENT ON TABLE "clases" IS 'Aulas físicas administradas por cada docente en sus investigaciones';
COMMENT ON TABLE "alumnos" IS 'Estudiantes pertenecientes a un aula, sujetos a simulación y evaluación';
COMMENT ON TABLE "tareas" IS 'Fichas didácticas y láminas curriculares cargadas en el aula';
COMMENT ON TABLE "notas" IS 'Historial de calificaciones cuantitativas y cualitativas de los estudiantes';

-- Check constraints & Cascading relationships
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_clases_docente') THEN
        ALTER TABLE "clases" ADD CONSTRAINT "fk_clases_docente" FOREIGN KEY ("docente_id") REFERENCES "docentes" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_alumnos_clase') THEN
        ALTER TABLE "alumnos" ADD CONSTRAINT "fk_alumnos_clase" FOREIGN KEY ("clase_id") REFERENCES "clases" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tareas_clase') THEN
        ALTER TABLE "tareas" ADD CONSTRAINT "fk_tareas_clase" FOREIGN KEY ("clase_id") REFERENCES "clases" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notas_alumno') THEN
        ALTER TABLE "notas" ADD CONSTRAINT "fk_notas_alumno" FOREIGN KEY ("alumno_id") REFERENCES "alumnos" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
END $$;

-- Migration: add columns to alumnos if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='representante') THEN
    ALTER TABLE "alumnos" ADD COLUMN "representante" varchar(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='telefono') THEN
    ALTER TABLE "alumnos" ADD COLUMN "telefono" varchar(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='activo') THEN
    ALTER TABLE "alumnos" ADD COLUMN "activo" boolean DEFAULT true;
  END IF;
END $$;

-- Table: unidades (RF-D02 Unidades Didacticas)
CREATE TABLE IF NOT EXISTS "unidades" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "clase_id" uuid NOT NULL,
  "titulo" varchar(255) NOT NULL,
  "ambito" varchar(255),
  "objetivo_general" text,
  "objetivo_aprendizaje" text,
  "destrezas" text,
  "semanas_previstas" int DEFAULT 1,
  "descripcion_actividades" text,
  "imagen_url" varchar(512),
  "tecnicas_didacticas" text,
  "criterios_evaluacion" text,
  "materiales" jsonb,
  "archivada" boolean DEFAULT false,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

-- Table: evaluaciones (RF-D03 rubrica I/EP/L)
CREATE TABLE IF NOT EXISTS "evaluaciones" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "alumno_id" uuid NOT NULL,
  "unidad_id" uuid,
  "clase_id" uuid NOT NULL,
  "rubrica" jsonb NOT NULL DEFAULT '{}',
  "nota_escrita" text,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

-- Table: monitoreo (RF-D06)
CREATE TABLE IF NOT EXISTS "monitoreo" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "alumno_id" uuid NOT NULL,
  "clasificacion_obs" text,
  "clasificacion_apoyo" text,
  "seriacion_obs" text,
  "seriacion_apoyo" text,
  "asimilacion_obs" text,
  "asimilacion_apoyo" text,
  "justificacion_obs" text,
  "justificacion_apoyo" text,
  "autorregulacion_obs" text,
  "autorregulacion_apoyo" text,
  "updated_at" timestamp DEFAULT (now())
);

-- Table: autoevaluacion (RF-D07)
CREATE TABLE IF NOT EXISTS "autoevaluacion" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "docente_id" uuid NOT NULL,
  "unidad_id" uuid,
  "clase_id" uuid NOT NULL,
  "respuestas" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamp DEFAULT (now())
);

-- FK constraints for new tables (run after CREATE TABLE)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_unidades_clase') THEN
        ALTER TABLE "unidades" ADD CONSTRAINT "fk_unidades_clase" FOREIGN KEY ("clase_id") REFERENCES "clases" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_evaluaciones_alumno') THEN
        ALTER TABLE "evaluaciones" ADD CONSTRAINT "fk_evaluaciones_alumno" FOREIGN KEY ("alumno_id") REFERENCES "alumnos" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_monitoreo_alumno') THEN
        ALTER TABLE "monitoreo" ADD CONSTRAINT "fk_monitoreo_alumno" FOREIGN KEY ("alumno_id") REFERENCES "alumnos" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_autoevaluacion_docente') THEN
        ALTER TABLE "autoevaluacion" ADD CONSTRAINT "fk_autoevaluacion_docente" FOREIGN KEY ("docente_id") REFERENCES "docentes" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
END $$;

-- Migrations: add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monitoreo' AND column_name='unidad_id') THEN
        ALTER TABLE "monitoreo" ADD COLUMN "unidad_id" uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='autoevaluacion' AND column_name='alumno_id') THEN
        ALTER TABLE "autoevaluacion" ADD COLUMN "alumno_id" uuid;
    END IF;
END $$;
`;


// Seed data
const seedQuery = `
INSERT INTO docentes (nombre, email, password) 
VALUES ('Prof. Ana María', 'docente@escuela.com', 'password123')
ON CONFLICT (email) DO NOTHING;
`;

// Initialize database
pool.query(initDbQuery)
  .then(() => {
    console.log('Tablas PostgreSQL validadas/creadas correctamente.');
    return pool.query(seedQuery);
  })
  .then(() => {
    console.log('Datos semilla de prueba del docente verificados.');
  })
  .catch(err => {
    console.error('Error al inicializar esquemas PostgreSQL en inicio:', err.message);
  });

// --- File Upload Configuration with Multer ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Ensure upload directory exists
const defaultUploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(defaultUploadsDir)) {
  fs.mkdirSync(defaultUploadsDir, { recursive: true });
}

// Generate template SVGs if missing
const frutasSvgPath = path.join(defaultUploadsDir, 'tarea_frutas.svg');
if (!fs.existsSync(frutasSvgPath)) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <rect width="100%" height="100%" fill="q-linear-gradient" style="fill:url(#grad1);"/>
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3a1c71;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#d76d77;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ffaf7b;stop-opacity:1" />
      </linearGradient>
    </defs>
    <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="'Outfit', sans-serif" font-size="24" font-weight="bold">🍎 FRUTAS VS CHATARRA 🍟</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#eee" font-family="'Inter', sans-serif" font-size="14">Material de Apoyo Visual (Prototipo)</text>
    <circle cx="120" cy="220" r="30" fill="#ff4d4d" opacity="0.8"/>
    <circle cx="280" cy="220" r="30" fill="#ffd700" opacity="0.8"/>
    <rect x="190" y="200" width="20" height="40" fill="#4caf50" opacity="0.8"/>
  </svg>`;
  fs.writeFileSync(frutasSvgPath, svgContent, 'utf8');
}

const rutinaSvgPath = path.join(defaultUploadsDir, 'tarea_rutina.svg');
if (!fs.existsSync(rutinaSvgPath)) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <rect width="100%" height="100%" fill="q-linear-gradient" style="fill:url(#grad2);"/>
    <defs>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#11998e;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#38ef7d;stop-opacity:1" />
      </linearGradient>
    </defs>
    <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="'Outfit', sans-serif" font-size="24" font-weight="bold">⏰ MI RUTINA DIARIA 🎒</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#eee" font-family="'Inter', sans-serif" font-size="14">Fichas de Secuencia Lógica (Prototipo)</text>
    <rect x="90" y="200" width="40" height="40" rx="5" fill="#fff" opacity="0.8"/>
    <rect x="180" y="200" width="40" height="40" rx="5" fill="#fff" opacity="0.8"/>
    <rect x="270" y="200" width="40" height="40" rx="5" fill="#fff" opacity="0.8"/>
  </svg>`;
  fs.writeFileSync(rutinaSvgPath, svgContent, 'utf8');
}

const mockPdfPath = path.join(defaultUploadsDir, 'lamina_alimentos.pdf');
if (!fs.existsSync(mockPdfPath)) {
  fs.writeFileSync(mockPdfPath, 'Ficha Interactiva: Frutas y Verduras vs Dulces. Clasificación Cognitiva (Piaget).', 'utf8');
}

// --- DATA TRANSFORMS & MAP HELPERS (DECOUPLED FRONTEND COMPATIBLE) ---
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email
  };
}

function mapClase(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    grado: row.grado,
    userId: row.docente_id,
    numAlumnos: row.num_alumnos ? parseInt(row.num_alumnos) : 0,
    alumnosNombres: row.alumnos_nombres ? row.alumnos_nombres : []
  };
}

function mapAlumno(row) {
  if (!row) return null;
  return {
    id: row.id,
    claseId: row.clase_id,
    nombre: row.nombre,
    representante: row.representante || '',
    padreCorreo: row.padre_correo,
    telefono: row.telefono || '',
    activo: row.activo !== false
  };
}

function mapTarea(row) {
  if (!row) return null;
  return {
    id: row.id,
    claseId: row.clase_id,
    titulo: row.titulo,
    imagenUrl: row.imagen_url,
    actividadTipo: row.actividad_tipo,
    detalles: typeof row.detalles === 'string' ? JSON.parse(row.detalles) : row.detalles,
    materiales: typeof row.materiales === 'string' ? JSON.parse(row.materiales) : (row.materiales || [])
  };
}

function mapNota(row) {
  if (!row) return null;
  return {
    id: row.id,
    alumnoId: row.alumno_id,
    tareaId: row.tarea_id,
    valor: parseFloat(row.valor),
    comentario: row.comentario
  };
}

function mapUnidad(row) {
  if (!row) return null;
  return {
    id: row.id,
    claseId: row.clase_id,
    titulo: row.titulo,
    ambito: row.ambito,
    objetivoGeneral: row.objetivo_general,
    objetivoAprendizaje: row.objetivo_aprendizaje,
    destrezas: row.destrezas,
    semanasPrevistas: row.semanas_previstas,
    descripcionActividades: row.descripcion_actividades,
    imagenUrl: row.imagen_url,
    tecnicasDidacticas: row.tecnicas_didacticas,
    criteriosEvaluacion: row.criterios_evaluacion,
    materiales: typeof row.materiales === 'string' ? JSON.parse(row.materiales) : (row.materiales || []),
    archivada: row.archivada,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapEvaluacion(row) {
  if (!row) return null;
  return {
    id: row.id,
    alumnoId: row.alumno_id,
    unidadId: row.unidad_id,
    claseId: row.clase_id,
    rubrica: typeof row.rubrica === 'string' ? JSON.parse(row.rubrica) : (row.rubrica || {}),
    notaEscrita: row.nota_escrita,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMonitoreo(row) {
  if (!row) return null;
  return {
    id: row.id,
    alumnoId: row.alumno_id,
    clasificacionObs: row.clasificacion_obs,
    clasificacionApoyo: row.clasificacion_apoyo,
    seriacionObs: row.seriacion_obs,
    seriacionApoyo: row.seriacion_apoyo,
    asimilacionObs: row.asimilacion_obs,
    asimilacionApoyo: row.asimilacion_apoyo,
    justificacionObs: row.justificacion_obs,
    justificacionApoyo: row.justificacion_apoyo,
    autorregulacionObs: row.autorregulacion_obs,
    autorregulacionApoyo: row.autorregulacion_apoyo,
    updatedAt: row.updated_at
  };
}

function mapAutoevaluacion(row) {
  if (!row) return null;
  return {
    id: row.id,
    docenteId: row.docente_id,
    unidadId: row.unidad_id,
    claseId: row.clase_id,
    respuestas: typeof row.respuestas === 'string' ? JSON.parse(row.respuestas) : (row.respuestas || []),
    createdAt: row.created_at
  };
}

// Helper to delete task files from local uploads folder
function deleteTaskFiles(task) {
  if (task.imagenUrl && task.imagenUrl.startsWith('/uploads/') && !task.imagenUrl.includes('tarea_frutas') && !task.imagenUrl.includes('tarea_rutina')) {
    const fullPath = path.join(__dirname, 'public', task.imagenUrl);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (err) { console.error('Error deleting image:', err); }
    }
  }

  if (task.materiales && Array.isArray(task.materiales)) {
    task.materiales.forEach(mat => {
      if (mat.archivoUrl && mat.archivoUrl.startsWith('/uploads/') && !mat.archivoUrl.includes('lamina_alimentos')) {
        const fullPath = path.join(__dirname, 'public', mat.archivoUrl);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (err) { console.error('Error deleting material:', err); }
        }
      }
    });
  }
}

// UUID format check helper (prevents PostgreSQL type errors from legacy session strings)
function isValidUuid(uuid) {
  if (!uuid) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

// --- API ENDPOINTS (PostgreSQL Implementation) ---

// 1. Authentication APIs
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM docentes WHERE LOWER(email) = LOWER($1) AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.json(mapUser(result.rows[0]));
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'Error interno del servidor en la consulta' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, nombre } = req.body;
  if (!email || !password || !nombre) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const exists = await pool.query('SELECT 1 FROM docentes WHERE LOWER(email) = LOWER($1)', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const result = await pool.query(
      'INSERT INTO docentes (nombre, email, password) VALUES ($1, LOWER($2), $3) RETURNING *',
      [nombre, email, password]
    );

    res.status(201).json(mapUser(result.rows[0]));
  } catch (err) {
    console.error('Error in register:', err);
    res.status(500).json({ error: 'Error al registrar el docente' });
  }
});

// 2. Clases APIs
app.get('/api/clases', async (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  
  if (!isValidUuid(userId)) {
    return res.json([]); // Gracefully return empty array for invalid legacy UUIDs
  }

  try {
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM alumnos a WHERE a.clase_id = c.id) as num_alumnos,
        (SELECT json_agg(a.nombre) FROM (SELECT nombre FROM alumnos a2 WHERE a2.clase_id = c.id LIMIT 4) a) as alumnos_nombres
       FROM clases c 
       WHERE c.docente_id = $1 ORDER BY c.created_at DESC`,
      [userId]
    );
    res.json(result.rows.map(mapClase));
  } catch (err) {
    console.error('Error fetching clases:', err);
    res.status(500).json({ error: 'Error al consultar aulas en base de datos' });
  }
});

app.post('/api/clases', async (req, res) => {
  const userId = req.headers['user-id'];
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  if (!isValidUuid(userId)) {
    return res.status(400).json({ error: 'Identificador de docente no válido' });
  }

  const { nombre, grado } = req.body;
  if (!nombre || !grado) {
    return res.status(400).json({ error: 'Nombre y grado son requeridos' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO clases (nombre, grado, docente_id) VALUES ($1, $2, $3) RETURNING *',
      [nombre, grado, userId]
    );
    res.status(201).json(mapClase(result.rows[0]));
  } catch (err) {
    console.error('Error creating clase:', err);
    res.status(500).json({ error: 'Error al crear aula en PostgreSQL' });
  }
});

app.delete('/api/clases/:id', async (req, res) => {
  const userId = req.headers['user-id'];
  const claseId = req.params.id;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  if (!isValidUuid(userId) || !isValidUuid(claseId)) {
    return res.status(404).json({ error: 'Clase no encontrada o identificador inválido' });
  }

  try {
    const check = await pool.query(
      'SELECT * FROM clases WHERE id = $1 AND docente_id = $2',
      [claseId, userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Clase no encontrada o no pertenece al usuario' });
    }

    // Read and delete files of the tasks inside this class
    const tasks = await pool.query('SELECT * FROM tareas WHERE clase_id = $1', [claseId]);
    tasks.rows.map(mapTarea).forEach(task => {
      deleteTaskFiles(task);
    });

    // DB foreign key with ON DELETE CASCADE automatically deletes associated rows
    await pool.query('DELETE FROM clases WHERE id = $1', [claseId]);

    res.json({ message: 'Clase y todos sus datos relacionados eliminados' });
  } catch (err) {
    console.error('Error deleting clase:', err);
    res.status(500).json({ error: 'Error al eliminar la clase en base de datos' });
  }
});

// 3. Alumnos APIs
app.get('/api/alumnos', async (req, res) => {
  const { claseId } = req.query;
  if (!claseId) return res.status(400).json({ error: 'claseId es obligatorio' });

  if (!isValidUuid(claseId)) {
    return res.json([]); // Return empty list gracefully
  }

  try {
    const result = await pool.query(
      'SELECT * FROM alumnos WHERE clase_id = $1 ORDER BY nombre ASC',
      [claseId]
    );
    res.json(result.rows.map(mapAlumno));
  } catch (err) {
    console.error('Error fetching alumnos:', err);
    res.status(500).json({ error: 'Error al consultar alumnos' });
  }
});

app.post('/api/alumnos', async (req, res) => {
  const { claseId, nombre, padreCorreo, representante, telefono } = req.body;
  if (!claseId || !nombre || !padreCorreo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (!isValidUuid(claseId)) {
    return res.status(400).json({ error: 'Identificador claseId no válido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO alumnos (clase_id, nombre, padre_correo, representante, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [claseId, nombre, padreCorreo, representante||null, telefono||null]
    );
    res.status(201).json(mapAlumno(result.rows[0]));
  } catch (err) {
    console.error('Error creating alumno:', err);
    res.status(500).json({ error: 'Error al registrar alumno en base de datos' });
  }
});

app.put('/api/alumnos/:id', async (req, res) => {
  const alumnoId = req.params.id;
  const { nombre, padreCorreo } = req.body;

  if (!nombre || !padreCorreo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (!isValidUuid(alumnoId)) {
    return res.status(404).json({ error: 'Alumno no encontrado o ID inválido' });
  }

  try {
    const result = await pool.query(
      'UPDATE alumnos SET nombre = $1, padre_correo = $2 WHERE id = $3 RETURNING *',
      [nombre, padreCorreo, alumnoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json(mapAlumno(result.rows[0]));
  } catch (err) {
    console.error('Error updating alumno:', err);
    res.status(500).json({ error: 'Error al actualizar alumno' });
  }
});

app.delete('/api/alumnos/:id', async (req, res) => {
  const alumnoId = req.params.id;

  if (!isValidUuid(alumnoId)) {
    return res.status(404).json({ error: 'Alumno no encontrado o ID inválido' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM alumnos WHERE id = $1 RETURNING *',
      [alumnoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }

    res.json({ message: 'Alumno y calificaciones asociadas eliminados' });
  } catch (err) {
    console.error('Error deleting alumno:', err);
    res.status(500).json({ error: 'Error al eliminar alumno' });
  }
});

// 4. Tareas APIs
app.get('/api/tareas', async (req, res) => {
  const { claseId } = req.query;
  if (!claseId) return res.status(400).json({ error: 'claseId es obligatorio' });

  if (!isValidUuid(claseId)) {
    return res.json([]); // Return empty list gracefully
  }

  try {
    const result = await pool.query(
      'SELECT * FROM tareas WHERE clase_id = $1 ORDER BY created_at ASC',
      [claseId]
    );
    res.json(result.rows.map(mapTarea));
  } catch (err) {
    console.error('Error fetching tareas:', err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

app.post('/api/tareas', async (req, res) => {
  const { claseId, titulo, imagenUrl, actividadTipo, detalles, materiales } = req.body;
  if (!claseId || !titulo || !imagenUrl || !actividadTipo || !detalles) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!isValidUuid(claseId)) {
    return res.status(400).json({ error: 'Identificador claseId no válido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tareas (clase_id, titulo, imagen_url, actividad_tipo, detalles, materiales) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        claseId, 
        titulo, 
        imagenUrl, 
        actividadTipo, 
        JSON.stringify(detalles), 
        JSON.stringify(materiales || [])
      ]
    );
    res.status(201).json(mapTarea(result.rows[0]));
  } catch (err) {
    console.error('Error creating tarea:', err);
    res.status(500).json({ error: 'Error al registrar la tarea' });
  }
});

app.put('/api/tareas/:id', async (req, res) => {
  const tareaId = req.params.id;
  const { titulo, imagenUrl, actividadTipo, detalles, materiales } = req.body;

  if (!titulo || !imagenUrl || !actividadTipo || !detalles) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (!isValidUuid(tareaId)) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  try {
    const check = await pool.query('SELECT * FROM tareas WHERE id = $1', [tareaId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const oldTarea = mapTarea(check.rows[0]);
    const originalMaterials = oldTarea.materiales || [];
    const newMaterials = materiales || [];

    // Clean deleted files from disk
    originalMaterials.forEach(origMat => {
      const isStillPresent = newMaterials.some(newMat => newMat.archivoUrl === origMat.archivoUrl);
      if (!isStillPresent && origMat.archivoUrl.startsWith('/uploads/') && !origMat.archivoUrl.includes('lamina_alimentos')) {
        const fullPath = path.join(__dirname, 'public', origMat.archivoUrl);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch (err) { console.error('Error deleting material:', err); }
        }
      }
    });

    if (oldTarea.imagenUrl !== imagenUrl && oldTarea.imagenUrl.startsWith('/uploads/') && !oldTarea.imagenUrl.includes('tarea_frutas') && !oldTarea.imagenUrl.includes('tarea_rutina')) {
      const fullPath = path.join(__dirname, 'public', oldTarea.imagenUrl);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (err) { console.error('Error deleting image:', err); }
      }
    }

    const result = await pool.query(
      'UPDATE tareas SET titulo = $1, imagen_url = $2, actividad_tipo = $3, detalles = $4, materiales = $5 WHERE id = $6 RETURNING *',
      [
        titulo, 
        imagenUrl, 
        actividadTipo, 
        JSON.stringify(detalles), 
        JSON.stringify(newMaterials), 
        tareaId
      ]
    );

    res.json(mapTarea(result.rows[0]));
  } catch (err) {
    console.error('Error updating tarea:', err);
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
});

app.delete('/api/tareas/:id', async (req, res) => {
  const tareaId = req.params.id;

  if (!isValidUuid(tareaId)) {
    return res.status(404).json({ error: 'Tarea no encontrada o ID inválido' });
  }

  try {
    const check = await pool.query('SELECT * FROM tareas WHERE id = $1', [tareaId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const tarea = mapTarea(check.rows[0]);
    deleteTaskFiles(tarea);

    await pool.query('DELETE FROM tareas WHERE id = $1', [tareaId]);
    res.json({ message: 'Tarea y archivos asociados eliminados' });
  } catch (err) {
    console.error('Error deleting tarea:', err);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

// 5. Notas / Calificaciones APIs
app.get('/api/notas', async (req, res) => {
  const { claseId } = req.query;
  if (!claseId) return res.status(400).json({ error: 'claseId es requerido' });

  if (!isValidUuid(claseId)) {
    return res.json([]); // Return empty list gracefully
  }

  try {
    // Select all grades of students belonging to this class
    const result = await pool.query(
      `SELECT n.* FROM notas n 
       INNER JOIN alumnos a ON n.alumno_id = a.id 
       WHERE a.clase_id = $1 
       ORDER BY n.created_at ASC`,
      [claseId]
    );
    res.json(result.rows.map(mapNota));
  } catch (err) {
    console.error('Error fetching notas:', err);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
});

app.post('/api/notas', async (req, res) => {
  const { alumnoId, tareaId, valor, comentario } = req.body;
  if (alumnoId === undefined || tareaId === undefined || valor === undefined) {
    return res.status(400).json({ error: 'alumnoId, tareaId y valor son requeridos' });
  }

  if (!isValidUuid(alumnoId)) {
    return res.status(400).json({ error: 'Identificador de alumnoId no es válido' });
  }

  const numericValue = parseFloat(valor);
  if (isNaN(numericValue) || numericValue < 0 || numericValue > 10) {
    return res.status(400).json({ error: 'La nota debe ser un número entre 0 y 10' });
  }

  try {
    // Check if grade already exists
    const check = await pool.query(
      'SELECT id FROM notas WHERE alumno_id = $1 AND tarea_id = $2',
      [alumnoId, tareaId]
    );

    if (check.rows.length > 0) {
      await pool.query(
        'UPDATE notas SET valor = $1, comentario = $2 WHERE alumno_id = $3 AND tarea_id = $4',
        [numericValue, comentario || '', alumnoId, tareaId]
      );
    } else {
      await pool.query(
        'INSERT INTO notas (alumno_id, tarea_id, valor, comentario) VALUES ($1, $2, $3, $4)',
        [alumnoId, tareaId, numericValue, comentario || '']
      );
    }

    res.json({ message: 'Calificación guardada correctamente' });
  } catch (err) {
    console.error('Error saving nota:', err);
    res.status(500).json({ error: 'Error al registrar calificación en base de datos' });
  }
});

// 6. Generic File Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }

  res.json({
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname
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
