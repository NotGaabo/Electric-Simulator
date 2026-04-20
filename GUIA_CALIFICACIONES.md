# SISTEMA DE ENTREGAS Y CALIFICACIONES
## Guía de Implementación

### 📋 Lo que se implementó

Se creó un sistema similar a Google Classroom donde:
1. Los profesores pueden ver las entregas de los estudiantes en un modal inline
2. No se abre una nueva pestaña, sino que se visualiza dentro de la misma aplicación
3. Los profesores pueden calificar y dejar comentarios directamente en el modal
4. El sistema guarda las calificaciones en Supabase

---

## 🗄️ TABLAS DE SUPABASE NECESARIAS

Copia y pega las SQL del archivo `SUPABASE_TABLES.txt` en la consola de Supabase.

**Ya tienes:** `assignment_submissions` ✅

**Solo necesitas crear:** `assignment_submissions_grades`

Primero agregar el campo:
```sql
ALTER TABLE public.assignment_submissions 
ADD COLUMN screenshot_url text;
```

Luego crear la tabla de calificaciones en `SUPABASE_TABLES.txt`

---

## 📁 COMPONENTES CREADOS/MODIFICADOS

### Nuevos archivos:
1. **SubmissionViewer.tsx** (`src/components/assignments/`)
   - Componente modal que muestra la entrega con imagen grande
   - Panel de calificación al lado derecho
   - Campos para score y feedback
   - Botón para guardar calificación

2. **useGradeSubmission.ts** (`src/hooks/`)
   - Hook personalizado para manejar la lógica de calificación
   - Se conecta con Supabase para guardar/actualizar calificaciones

### Archivos modificados:
1. **SubmissionsPanel.tsx** (`src/components/assignments/`)
   - Cambió el botón "Ver →" de un `<a>` a un `<button>`
   - Al hacer click abre el modal SubmissionViewer en lugar de nueva pestaña
   - Ahora recibe props para: `totalPoints`, `onGradeSubmit`, `isTeacher`

2. **assignment/[assignmentId]/page.tsx** (`src/app/(dashboard)/classes/[classId]/`)
   - Importa el hook `useGradeSubmission`
   - Pasa los props necesarios a `SubmissionsPanel`
   - Conecta la funcionalidad de calificación

---

## 🎯 FLUJO DE USO

### Para Profesores:
1. Van a una asignación que crearon
2. Ven la sección "Entregas" con la lista de estudiantes
3. Hacen click en el botón "Ver →"
4. Se abre un modal mostrando:
   - Lado izquierdo: Imagen de la entrega en grande
   - Lado derecho: Panel de calificación
5. Ingresan:
   - Puntuación (0 a X puntos)
   - Comentarios/feedback
6. Hacen click en "Guardar"
7. La calificación se guarda en Supabase

---

## 🔌 CONEXIÓN CON SUPABASE

El hook `useGradeSubmission` maneja:
- Verificar si ya existe una calificación
- Si existe: actualiza el score y feedback
- Si no existe: crea una nueva calificación
- Usa el usuario autenticado como `teacher_id`

**Nota**: Asegúrate de que:
- Los registros de `profiles` existan para cada usuario
- El usuario esté autenticado en Supabase
- Las claves de conexión de Supabase estén configuradas

---

## 📊 CONSULTAS SQL ÚTILES

Ver todas las entregas con calificaciones:
```sql
SELECT 
  s.id as submission_id,
  a.title as assignment_title,
  p.full_name as student_name,
  s.submitted_at,
  g.score,
  g.feedback,
  g.graded_at
FROM assignment_submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN profiles p ON s.student_id = p.id
LEFT JOIN assignment_submissions_grades g ON s.id = g.submission_id
WHERE a.id = 'assignment_id_here'
ORDER BY s.submitted_at DESC;
```

Ver promedio de calificaciones por estudiante:
```sql
SELECT 
  p.full_name,
  COUNT(DISTINCT s.assignment_id) as total_asignaciones,
  ROUND(AVG(g.score), 2) as promedio
FROM profiles p
LEFT JOIN assignment_submissions s ON p.id = s.student_id
LEFT JOIN assignment_submissions_grades g ON s.id = g.submission_id
WHERE g.score IS NOT NULL
GROUP BY p.id, p.full_name
ORDER BY promedio DESC;
```

---

## 🎨 CARACTERÍSTICAS DEL DISEÑO

- **Modal overlay**: Fondo oscuro semitransparente
- **Animaciones**: Fade-in y slide-up suave
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Botón "Guardado"**: Cambia color al guardar exitosamente
- **Validación**: No permite guardar sin puntuación
- **Loading state**: Muestra estado mientras se guarda

---

## ⚙️ PRÓXIMAS MEJORAS SUGERIDAS

1. Notificar al estudiante cuando se califica su entrega
2. Historial de cambios en las calificaciones
3. Rubrica de calificación predefinida
4. Exportar calificaciones a CSV/Excel
5. Estadísticas de entregas por clase

---

## 🐛 TROUBLESHOOTING

### Error "No authenticated user"
- Asegúrate de que el usuario está logueado en la aplicación

### La calificación no se guarda
- Verifica que las tablas existan en Supabase
- Revisa los permisos de RLS en Supabase
- Asegúrate de que `submission_id` es válido

### El modal no abre
- Verifica que `SubmissionViewer.tsx` esté en la ruta correcta
- Revisa la consola del navegador para errores

---

Creado con ❤️ para Electric Simulator
