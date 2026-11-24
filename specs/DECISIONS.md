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
