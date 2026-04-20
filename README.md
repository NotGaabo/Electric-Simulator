# Voltify ⚡

## Nombre del Proyecto

Voltify (Electric Simulator)

## Descripción del Proyecto

Voltify es una plataforma educativa web diseñada para la gestión de clases, tareas y simuladores eléctricos interactivos. Permite a profesores crear y administrar clases, publicar asignaciones y revisar entregas, mientras que los estudiantes pueden completar actividades usando varios módulos de simulador y enviar capturas de sus resultados.

## Tecnologías Utilizadas

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Supabase (Autenticación, Realtime y Base de Datos)
- Tailwind CSS 4
- Zustand
- html2canvas
- Konva / react-konva
- Three.js / @react-three/fiber
- Vitest
- ESLint

## Características del Sistema

- Gestión de clases: crear clases, unirse a clases y administrar miembros.
- Asignaciones: crear, listar y gestionar tareas por módulo de simulador.
- Comentarios y discusiones dentro de las asignaciones.
- Entregas con captura de simulador.
- Múltiples simuladores:
  - Circuito eléctrico
  - Simulación de casa
  - Simulación de máquina industrial
  - Simulación de sensor y automatización
  - Simulación de oficinas industriales
- Actualizaciones en tiempo real mediante Supabase Realtime.
- Validación de entradas y permisos basados en roles de usuario.

## Requisitos del Sistema

- Node.js 18 o superior
- npm 10 o superior
- Navegador moderno con soporte para ES Modules y WebGL
- Cuenta en Supabase para la base de datos y autenticación

## Instalación del Proyecto

1. Clonar el repositorio desde GitHub:

```bash
git clone https://github.com/<TU_USUARIO>/Electric-Simulator.git
```

2. Acceder al directorio del proyecto:

```bash
cd Electric-Simulator
```

3. Instalar dependencias:

```bash
npm install
```

## Configuración

1. Crear el archivo `.env.local` en la raíz del proyecto.
2. Añadir las variables de entorno de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Asegurarse de que las tablas y políticas de Supabase contemplen:
- `classes`
- `class_members`
- `assignments`
- `assignment_submissions`
- `assignment_submissions_grades`
- `profiles`

4. Verificar que el proyecto pueda leer las variables en `src/lib/supabase/client.ts` y `src/lib/supabase/server.ts`.

## Paso de ejecución del proyecto paso a paso

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar el servidor de desarrollo:

```bash
npm run dev
```

3. Abrir el navegador en:

```bash
http://localhost:3000
```

4. Registrarse o iniciar sesión.
5. Crear o unirse a una clase desde el dashboard.
6. Crear asignaciones y seleccionar un módulo de simulador.
7. Abrir el simulador correspondiente y completar la actividad.
8. Enviar la entrega con la captura del simulador.

## Estructura del Proyecto

```
app/                    # Rutas de Next.js (app router), páginas y API
  globals.css
  layout.tsx
  page.tsx
  (auth)/               # Autenticación: login y registro
  (dashboard)/          # Panel de clases y gestión
  api/                  # API routes para clases y asignaciones
    assignments/
    classes/
  circuitSimulator/     # Página y layout del simulador de circuitos
  houseSimulator/       # Página y componentes del simulador de casa
  IndustrialOffices/    # Página y simulador de oficinas industriales
  machineSimulator/     # Página y validación de máquinas
  sensorSimulation/     # Página y componentes de sensores
components/             # Componentes reutilizables y paneles UI
hooks/                  # Hooks personalizados para datos, simuladores y comentarios
lib/                    # Utilidades y clientes, incluyendo Supabase
store/                  # Estado global con Zustand
utils/                  # Funciones auxiliares
public/                 # Archivos estáticos
```

## Uso del Sistema

- El profesor puede crear clases y asignaciones.
- El estudiante puede unirse a una clase usando el código de clase.
- Las asignaciones se publican con fecha de entrega y módulo de simulador.
- El estudiante accede al simulador correspondiente y crea una solución.
- Las entregas se registran con una captura de pantalla del simulador.
- El profesor puede revisar las entregas y calificar al estudiante.

## Credenciales relevantes

- No se incluyen credenciales predeterminadas en el repositorio.
- Es necesario registrarse con un usuario nuevo en la aplicación.
- La autenticación se gestiona con Supabase Auth.
- Los permisos de creación de asignaciones dependen del rol en `class_members`.

## API utilizada y su implementación paso a paso

### API principal

El proyecto usa Supabase para:
- Autenticación de usuario
- Realtime
- Consultas y manipulaciones de datos en la base de datos

### Rutas API de Next.js

- `src/app/api/classes/route.ts`
  - `GET`: devuelve las clases del usuario autenticado.
  - `POST`: crea una nueva clase y agrega al creador como profesor.
- `src/app/api/classes/[id]/route.ts`
  - Maneja datos de una clase específica.
- `src/app/api/classes/join/route.ts`
  - Permite a usuarios unirse a una clase existente.
- `src/app/api/assignments/route.ts`
  - `GET`: lista las asignaciones de una clase.
  - `POST`: crea una nueva asignación si el usuario es profesor.
- `src/app/api/assignments/[assignmentId]/route.ts`
  - Maneja operaciones específicas sobre una asignación.

### Implementación paso a paso

1. Configurar variables de entorno de Supabase en `.env.local`.
2. Usar `src/lib/supabase/client.ts` para crear un cliente Supabase en el navegador.
3. Usar `src/lib/supabase/server.ts` para crear un cliente Supabase en el servidor y mantener cookies.
4. En cada ruta API, se obtiene el usuario con `supabase.auth.getUser()`.
5. Las consultas a la base de datos se realizan con `supabase.from('<tabla>').select(...)`, `insert(...)`, `eq(...)` y otros métodos.
6. Las respuestas de API devuelven JSON con `NextResponse.json(...)` y estados HTTP adecuados.
7. El frontend consume estas rutas para listar clases, crear asignaciones y mostrar detalles del simulador.

## Autor y administración del proyecto

- Desarrolladores:
  - Yoensi M. Arias O.
  - Delanny M. Mauro A.
  - Greimi Feliz
- Administrador de proyecto:
  - Rijo

## Scripts disponibles

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
```

## Notas finales

Este `README.md` ha sido actualizado para reflejar la estructura real del proyecto y la configuración actual de las rutas y dependencias. Asegúrate de completar las variables de entorno de Supabase antes de ejecutar la aplicación.
