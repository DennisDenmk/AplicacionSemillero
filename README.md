# 🏫 EduDocente — Plataforma de Gestión y Evaluación Psicopedagógica

EduDocente es una plataforma web modular diseñada para que docentes de educación infantil e investigadores del desarrollo cognitivo gestionen grupos de estudiantes, planifiquen unidades didácticas y realicen evaluaciones diagnósticas estructuradas basadas en estadios psicogenéticos (Piaget).

![Arquitectura de EduDocente](./architecture.png)

---

## 🚀 Características Principales

- **Gestión de Aulas (Grupos):** Creación y organización de aulas de investigación con métricas rápidas de alumnos integrados.
- **Registro de Alumnos:** Administración simplificada de estudiantes, tutores y datos de contacto.
- **Unidades Didácticas:** Creación, catalogación, clonación y archivado de fichas didácticas estructuradas por tipo de tarea cognitiva (Clasificación, Seriación, Ubicación Espacial).
- **Dashboard de Evaluación (Matriz Unificada):** 
  - Flujo centrado en la tarea (Ficha Didáctica).
  - Matriz interactiva de control de estado por alumno.
  - **Rúbrica Cognitiva:** Niveles I (Iniciado), EP (En Proceso) y L (Logrado) para 5 criterios cognitivos clave.
  - **Ficha de Monitoreo Individual:** Registro detallado de observaciones y acciones de apoyo por dimensión de asimilación/acomodación.
  - **Autoevaluación Docente:** Cuestionario reflexivo de 6 preguntas para auto-analizar el andamiaje pedagógico de la sesión por cada estudiante.
- **Diseño Mobile-First & PWA:** Totalmente adaptado para pantallas móviles con soporte de gestos táctiles (cerrar menús tocando el fondo) y almacenamiento local.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 18
- **Herramienta de Construcción:** Vite
- **Iconografía:** Lucide React
- **Estilos:** Vanilla CSS moderno (Arquitectura limpia con Variables de CSS, soporte de Grid/Flexbox y animaciones).

### Backend
- **Entorno:** Node.js (v18+)
- **Framework Web:** Express.js
- **Base de Datos:** PostgreSQL
- **Conector DB:** `node-postgres` (con soporte para pool de conexiones resiliente)
- **Subida de Materiales:** Multer (archivos PDF e imágenes locales)

---

## 🗄️ Estructura de la Base de Datos

El sistema se inicializa de forma autónoma creando las siguientes tablas relacionales con sus respectivas migraciones:

- `docentes`: Información de perfiles docentes y contraseñas.
- `clases`: Aulas o grupos del docente.
- `alumnos`: Estudiantes vinculados a cada aula.
- `unidades`: Unidades y fichas didácticas registradas.
- `evaluaciones`: Rúbricas cognitivas completadas por alumno y unidad.
- `monitoreo`: Observaciones de aula por dimensión psicopedagógica, por alumno y unidad.
- `autoevaluacion`: Evaluaciones de auto-reflexión del docente por alumno y unidad.

---

## ⚙️ Instalación y Desarrollo Local

### Requisitos Previos
- Node.js (versión 18 o superior)
- Servidor PostgreSQL activo con una base de datos creada.

### Paso 1: Configurar Variables de Entorno
Crea un archivo `.env` en la carpeta `backend/` con las siguientes credenciales:

```env
PORT=3000
DATABASE_URL=postgresql://tu_usuario:tu_contraseña@localhost:5432/edu_docente
JWT_SECRET=tu_clave_secreta_aqui
```

### Paso 2: Configuración del Backend
1. Navega al directorio del servidor:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor en modo desarrollo:
   ```bash
   npm run dev
   # o alternativamente: node server.js
   ```
*Nota: El servidor inicializará las tablas de la base de datos automáticamente si no existen.*

### Paso 3: Configuración del Frontend
1. Navega al directorio del cliente (en otra pestaña de terminal):
   ```bash
   cd ../frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 📁 Distribución del Directorio

```
AplicacionSoftEmrpesaria/
├── 📁 frontend/               # Código cliente React
│   ├── src/
│   │   ├── views/             # Vistas principales (Clases, Rúbrica, Seguimiento)
│   │   ├── components/        # Componentes UI reutilizables
│   │   ├── services/          # Conexión API Centralizada (api.js)
│   │   └── index.css          # Estilo global y variables de diseño
│   └── vite.config.js
│
└── 📁 backend/                # Código servidor Express.js
    ├── server.js              # Inicialización, APIs y migraciones DB
    ├── package.json
    └── 📁 uploads/            # Archivos locales de fichas didácticas
```
