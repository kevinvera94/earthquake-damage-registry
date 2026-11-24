# DECISIONS.md — Log de decisiones de diseño
> Registro de decisiones técnicas y de producto tomadas durante el proyecto.
> Formato: ADR (Architecture Decision Record) simplificado.

---

## Plantilla

### DEC-000 — Título de la decisión
- **Fecha:**
- **Estado:** Propuesta | Aceptada | Rechazada | Reemplazada
- **Contexto:** Por qué se necesitaba tomar esta decisión
- **Decisión:** Qué se decidió
- **Consecuencias:** Qué implica esta decisión (pros/contras)

---

## Decisiones

### DEC-001 — Estructura de specs con BRIEF.md central
- **Fecha:** 2026-10-21
- **Estado:** Aceptada
- **Contexto:** Se adopta la metodología SDD usada en `app-degree-projects`: una fuente de verdad agnóstica a la herramienta que soporte múltiples agentes
- **Decisión:** Usar `specs/BRIEF.md` como fuente central; `CLAUDE.md` y otros archivos de agente lo referencian
- **Consecuencias:** Mantenimiento único, portabilidad entre herramientas, overhead mínimo de configuración

### DEC-002 — Formulario IDIGER como base de la evaluación en detalle
- **Fecha:** 2026-10-21
- **Estado:** Reemplazada por DEC-003
- **Contexto:** No existe un formulario público propio de la Secretaría de Gestión del Riesgo de Cali. La Circular 73 de la UNGRD establece que la evaluación en detalle toma como base el formulario del IDIGER
- **Decisión:** Modelar los datos del formulario IDIGER (secciones 9.1–9.4 del BRIEF) y complementarlos con los datos exigidos por el profesor
- **Consecuencias:** Modelo de datos alineado con la práctica oficial; requiere adaptar “localidad” a “comuna” y resolver la equivalencia de 4 niveles de habitabilidad vs. 3 colores de sticker

### DEC-003 — Alcance simplificado: solo sticker, ocupantes y cobertura
- **Fecha:** 2026-11-23
- **Estado:** Aceptada
- **Contexto:** El BRIEF v0.5 modelaba el formulario IDIGER (evaluaciones A–E) y el RUFE ampliado. Con 7 días para la entrega (30-nov-2026), y tras acordar con el profesor un desarrollo lo más simple posible, ese alcance no era viable
- **Decisión:** Registrar solo la inspección rápida (color de sticker) con historial de reinspecciones, las personas ocupantes con los campos del tablero (vínculo, rango etario, condición especial, tipo de población por persona) y la cobertura como tres casillas sí/no. Dos roles (Administrador, Inspector), Supabase Auth, PDF con diseño propio y un análisis algorítmico mínimo documentado
- **Consecuencias:** Modelo de 4 entidades (usuario, edificación, inspección, persona) que se puede construir en el plazo. Se pierde el detalle técnico del IDIGER, la demolición y los catálogos RUFE; el análisis queda en el historial de Git (BRIEF v0.5) por si se retoma

### DEC-004 — Acceso a datos con SQLAlchemy + Alembic desde FastAPI
- **Fecha:** 2026-11-23
- **Estado:** Aceptada
- **Contexto:** El backend debe ser Python y la consulta con filtros requiere subconsultas `EXISTS` y agregaciones. Opciones: `supabase-py` (PostgREST), SQL plano con psycopg, o un ORM
- **Decisión:** SQLAlchemy 2.0 con psycopg y migraciones con Alembic, conectando por el session pooler de Supabase. El frontend no accede a la BD; RLS activado sin políticas
- **Consecuencias:** Consultas complejas expresables y probables con pytest; migraciones versionadas. Contra: la Admin API de Supabase se llama aparte para usuarios. PostgREST queda bloqueado por RLS

### DEC-005 — Sticker vigente desnormalizado en `buildings`
- **Fecha:** 2026-11-23
- **Estado:** Aceptada
- **Contexto:** Casi toda consulta y cifra pública depende del sticker de la inspección más reciente
- **Decisión:** Guardar `current_sticker` y `last_inspection_at` en `buildings`, actualizados en la misma transacción que inserta la inspección
- **Consecuencias:** Filtros y conteos simples e indexables. Es seguro porque las inspecciones son inmutables; si algún día se editan, habría que recalcular

### DEC-006 — Supabase Auth con autorización en el backend
- **Fecha:** 2026-11-23
- **Estado:** Aceptada
- **Contexto:** Construir login y manejo de contraseñas propios no aporta valor en 7 días
- **Decisión:** Supabase Auth emite el JWT; el backend lo verifica (JWKS) y lee rol y estado de la tabla `profiles`. Crear y desactivar usuarios con la Admin API desde el backend
- **Consecuencias:** Desactivar surte efecto inmediato. La `service_role` key queda solo en Render

### DEC-007 — PDF con ReportLab
- **Fecha:** 2026-11-23
- **Estado:** Aceptada
- **Contexto:** WeasyPrint necesita librerías del sistema (Pango, Cairo) que el runtime Python de Render no garantiza
- **Decisión:** ReportLab (Python puro) con un reporte propio
- **Consecuencias:** Despliegue sin sorpresas; el diseño se hace en código, no en HTML/CSS

### DEC-008 — Frontend en JavaScript, sin librerías de estado
- **Fecha:** 2026-11-23
- **Estado:** Aceptada
- **Contexto:** Plazo de 7 días y equipo de 6 con niveles distintos
- **Decisión:** React + Vite en JavaScript, React Router y `fetch` envuelto en `lib/api.js`. Sin TypeScript, Redux ni React Query
- **Consecuencias:** Menos configuración y curva; se pierde el tipado. El contrato queda documentado en OpenAPI (`/docs`)
