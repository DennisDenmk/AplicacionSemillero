const { Pool } = require('pg');

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

// --- DDL: Table Initialization Script ---
const initDbQuery = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "docentes" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nombre" varchar(255) NOT NULL,
  "email" varchar(255) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS "clases" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "nombre" varchar(255) NOT NULL,
  "grado" varchar(255) NOT NULL,
  "docente_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS "alumnos" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "clase_id" uuid NOT NULL,
  "nombre" varchar(255) NOT NULL,
  "padre_correo" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS "tareas" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "clase_id" uuid NOT NULL,
  "unidad_id" uuid,
  "titulo" varchar(255) NOT NULL,
  "imagen_url" varchar(512) NOT NULL,
  "actividad_tipo" varchar(50) NOT NULL,
  "detalles" jsonb NOT NULL,
  "materiales" jsonb,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS "notas" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "alumno_id" uuid NOT NULL,
  "tarea_id" varchar(255) NOT NULL,
  "valor" decimal(4,2) NOT NULL,
  "comentario" text,
  "created_at" timestamp DEFAULT (now())
);

COMMENT ON TABLE "docentes" IS 'Registra los docentes e investigadores que acceden a la plataforma';
COMMENT ON TABLE "clases" IS 'Aulas físicas administradas por cada docente en sus investigaciones';
COMMENT ON TABLE "alumnos" IS 'Estudiantes pertenecientes a un aula, sujetos a simulación y evaluación';
COMMENT ON TABLE "tareas" IS 'Fichas didácticas y láminas curriculares cargadas en el aula';
COMMENT ON TABLE "notas" IS 'Historial de calificaciones cuantitativas y cualitativas de los estudiantes';

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

CREATE TABLE IF NOT EXISTS "autoevaluacion" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "docente_id" uuid NOT NULL,
  "unidad_id" uuid,
  "clase_id" uuid NOT NULL,
  "respuestas" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamp DEFAULT (now())
);

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

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monitoreo' AND column_name='unidad_id') THEN
        ALTER TABLE "monitoreo" ADD COLUMN "unidad_id" uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='autoevaluacion' AND column_name='alumno_id') THEN
        ALTER TABLE "autoevaluacion" ADD COLUMN "alumno_id" uuid;
    END IF;
    -- Migración: agregar unidad_id a tareas si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tareas' AND column_name='unidad_id') THEN
        ALTER TABLE "tareas" ADD COLUMN "unidad_id" uuid;
    END IF;
    -- FK de tareas → unidades (con cascade)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tareas_unidad') THEN
        ALTER TABLE "tareas" ADD CONSTRAINT "fk_tareas_unidad" FOREIGN KEY ("unidad_id") REFERENCES "unidades" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
END $$;
`;

const seedQuery = `
INSERT INTO docentes (nombre, email, password) 
VALUES ('Prof. Ana María', 'docente@escuela.com', 'password123')
ON CONFLICT (email) DO NOTHING;
`;

async function initDatabase() {
  try {
    await pool.query(initDbQuery);
    console.log('Tablas PostgreSQL validadas/creadas correctamente.');
    await pool.query(seedQuery);
    console.log('Datos semilla de prueba del docente verificados.');
  } catch (err) {
    console.error('Error al inicializar esquemas PostgreSQL en inicio:', err.message);
  }
}

module.exports = { pool, initDatabase };
