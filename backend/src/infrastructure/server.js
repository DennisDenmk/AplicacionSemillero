const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Routes
const authRoutes = require('../routes/auth.routes');
const clasesRoutes = require('../routes/clases.routes');
const alumnosRoutes = require('../routes/alumnos.routes');
const tareasRoutes = require('../routes/tareas.routes');
const notasRoutes = require('../routes/notas.routes');
const unidadesRoutes = require('../routes/unidades.routes');
const evaluacionRoutes = require('../routes/evaluacion.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// ── File Upload Configuration (Multer) ────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Ensure upload directory and default SVG assets exist
const publicDir = path.join(__dirname, '..', '..', 'public');
const uploadsDir = path.join(publicDir, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const frutasSvgPath = path.join(uploadsDir, 'tarea_frutas.svg');
if (!fs.existsSync(frutasSvgPath)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <rect width="100%" height="100%" style="fill:url(#grad1);"/>
    <defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#3a1c71;stop-opacity:1"/><stop offset="50%" style="stop-color:#d76d77;stop-opacity:1"/><stop offset="100%" style="stop-color:#ffaf7b;stop-opacity:1"/></linearGradient></defs>
    <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Outfit,sans-serif" font-size="24" font-weight="bold">🍎 FRUTAS VS CHATARRA 🍟</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#eee" font-family="Inter,sans-serif" font-size="14">Material de Apoyo Visual (Prototipo)</text>
    <circle cx="120" cy="220" r="30" fill="#ff4d4d" opacity="0.8"/>
    <circle cx="280" cy="220" r="30" fill="#ffd700" opacity="0.8"/>
    <rect x="190" y="200" width="20" height="40" fill="#4caf50" opacity="0.8"/>
  </svg>`;
  fs.writeFileSync(frutasSvgPath, svg, 'utf8');
}

const rutinaSvgPath = path.join(uploadsDir, 'tarea_rutina.svg');
if (!fs.existsSync(rutinaSvgPath)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <rect width="100%" height="100%" style="fill:url(#grad2);"/>
    <defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#11998e;stop-opacity:1"/><stop offset="100%" style="stop-color:#38ef7d;stop-opacity:1"/></linearGradient></defs>
    <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Outfit,sans-serif" font-size="24" font-weight="bold">⏰ MI RUTINA DIARIA 🎒</text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#eee" font-family="Inter,sans-serif" font-size="14">Fichas de Secuencia Lógica (Prototipo)</text>
    <rect x="90" y="200" width="40" height="40" rx="5" fill="#fff" opacity="0.8"/>
    <rect x="180" y="200" width="40" height="40" rx="5" fill="#fff" opacity="0.8"/>
    <rect x="270" y="200" width="40" height="40" rx="5" fill="#fff" opacity="0.8"/>
  </svg>`;
  fs.writeFileSync(rutinaSvgPath, svg, 'utf8');
}

const mockPdfPath = path.join(uploadsDir, 'lamina_alimentos.pdf');
if (!fs.existsSync(mockPdfPath)) {
  fs.writeFileSync(mockPdfPath, 'Ficha Interactiva: Frutas y Verduras vs Dulces. Clasificación Cognitiva (Piaget).', 'utf8');
}

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/clases', clasesRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/unidades', unidadesRoutes);
app.use('/api', evaluacionRoutes);

// ── File Upload Endpoint ──────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo' });
  res.json({ url: `/uploads/${req.file.filename}`, originalName: req.file.originalname });
});

// ── SPA Fallback ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = app;
