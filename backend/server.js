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

// Cargar variables de entorno del archivo .env al inicio
require('dotenv').config();

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
