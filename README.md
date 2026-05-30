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
- **Diseño Mobile-First:** Totalmente adaptado para pantallas móviles con soporte de gestos táctiles (cerrar menús tocando el fondo) y almacenamiento local.

---

## 🏗️ Arquitectura Limpia (Clean Architecture)

El proyecto ha sido refactorizado implementando los principios de **Clean Architecture** para lograr un acoplamiento débil, alta cohesión y una clara separación de responsabilidades:

### Capas del Backend
1. **Dominio (`src/domain`):** Modelos puros de datos (`index.js`) y utilidades compartidas.
2. **Repositorios (`src/repositories`):** Capa de acceso a datos directa a PostgreSQL (SQL puro, sin acoplamiento a frameworks).
3. **Controladores (`src/controllers`):** Controladores de Express que manejan peticiones HTTP y delegan la lógica al repositorio.
4. **Infraestructura (`src/infrastructure`):** Conexión de base de datos (`postgres.js`), configuraciones de Express, middlewares y punto de inicio.
5. **Entry Point (`server.js`):** Punto de entrada minimalista que inicializa variables de entorno, la base de datos y arranca el servidor.

### Capas del Frontend
1. **Capa de Aplicación (`src/application/hooks`):** Estado y lógica de negocio encapsulados en custom hooks (`useAuth`, `useClases`, `useAlumnos`, `useToast`).
2. **Capa de Infraestructura (`src/infrastructure/api`):** Cliente de red (`apiClient.js`) y servicios específicos (`AuthService`, `ClaseService`, etc.) encargados de la comunicación externa.
3. **Capa de Presentación (`src/presentation`):** Componentes UI (`components`) y páginas (`pages`) puros, desacoplados del estado global de la aplicación.

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
- **Gestión de Paquetes:** `pnpm` (Rápido, eficiente y seguro)

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
- `pnpm` instalado de forma global (`npm install -g pnpm`)
- Servidor PostgreSQL activo con una base de datos creada.

### Paso 1: Configurar Variables de Entorno
Crea un archivo `.env` en la carpeta `backend/` con las siguientes credenciales:

```env
PORT=3000
DATABASE_URL=postgresql://tu_usuario:tu_contraseña@localhost:5432/edu_docente
```

### Paso 2: Configuración del Backend
1. Navega al directorio del servidor:
   ```bash
   cd backend
   ```
2. Instala las dependencias con `pnpm`:
   ```bash
   pnpm install
   ```
3. Ejecuta el servidor en modo desarrollo:
   ```bash
   pnpm run dev
   ```
*Nota: El servidor inicializará las tablas de la base de datos automáticamente si no existen.*

### Paso 3: Configuración del Frontend
1. Navega al directorio del cliente (en otra pestaña de terminal):
   ```bash
   cd ../frontend
   ```
2. Instala las dependencias con `pnpm`:
   ```bash
   pnpm install
   ```
3. Inicia el servidor de desarrollo Vite:
   ```bash
   pnpm run dev
   ```
4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 📁 Distribución del Directorio

```
AplicacionSemillero/
├── 📁 frontend/               # Código cliente React
│   ├── src/
│   │   ├── 📁 application/    # Lógica de Negocio (Custom Hooks)
│   │   ├── 📁 domain/         # Modelos puros y lógica compartida
│   │   ├── 📁 infrastructure/ # Cliente API HTTP y servicios
│   │   ├── 📁 presentation/   # Componentes y Páginas React
│   │   ├── 📁 services/       # Fachada de compatibilidad hacia atrás
│   │   └── index.css          # Estilo global y variables de diseño
│   └── vite.config.js
│
└── 📁 backend/                # Código servidor Express.js
    ├── 📁 src/
    │   ├── 📁 controllers/    # Controladores de peticiones
    │   ├── 📁 domain/         # Modelos de datos
    │   ├── 📁 infrastructure/ # Configuración del servidor y DB
    │   ├── 📁 repositories/   # Consultas directas a base de datos
    │   └── 📁 routes/         # Rutas de la API
    ├── server.js              # Punto de entrada minimalista
    ├── package.json
    └── 📁 public/
        └── 📁 uploads/        # Archivos locales de fichas didácticas
```
