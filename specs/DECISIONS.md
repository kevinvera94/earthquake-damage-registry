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
- **Estado:** Propuesta
- **Contexto:** No existe un formulario público propio de la Secretaría de Gestión del Riesgo de Cali. La Circular 73 de la UNGRD establece que la evaluación en detalle toma como base el formulario del IDIGER
- **Decisión:** Modelar los datos del formulario IDIGER (secciones 9.1–9.4 del BRIEF) y complementarlos con los datos exigidos por el profesor
- **Consecuencias:** Modelo de datos alineado con la práctica oficial; requiere adaptar “localidad” a “comuna” y resolver la equivalencia de 4 niveles de habitabilidad vs. 3 colores de sticker
