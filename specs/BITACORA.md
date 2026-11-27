# BITACORA.md — Bitácora del proyecto
> Registro oficial del estado de cada tarea: **fecha, persona y estado**.
> Se actualiza **en el mismo PR de la tarea** (CLAUDE.md → Instrucciones operativas).
> Estados: **Pendiente** · **En curso** · **Finalizado**

---

## Cómo se actualiza
1. **Al empezar** una tarea: en el primer commit de la rama, cambiar su fila a `En curso` con la fecha de hoy y el número del PR en borrador
2. **Al terminar**: cambiar la fila a `Finalizado` con la fecha de finalización, en el último commit antes de pedir revisión
3. **Trabajo no planificado** (correcciones, ajustes): agregar una fila al **final de la tabla de tu propia sección**, con ID `X-<persona>-<n>` (p. ej. `X-VS-1`)
4. **Solo se edita la sección propia.** Cada persona tiene su tabla separada: así los PRs de personas distintas nunca chocan en este archivo
5. Fecha en formato `AAAA-MM-DD`, hora de Colombia

> En `main`, una tarea pasa de `Pendiente` a `Finalizado` cuando se fusiona su PR. El estado `En curso` se ve en la rama y en el PR en borrador.

---

## Kevin Vera

| ID | Tarea | Persona | Estado | Fecha | PR |
|---|---|---|---|---|---|
| D-01 | Estructura SDD, BRIEF v0.1, `.gitignore`, CODEOWNERS | Kevin Vera | Finalizado | 2026-10-21 | — |
| D-02 | BRIEF v0.5 (RUFE, área pública/privada, plazo) | Kevin Vera | Finalizado | 2026-10-21 | #1 |
| D-03 | README v0.2 | Kevin Vera | Finalizado | 2026-10-21 | #2 |
| D-05 | BRIEF v1.0 — alcance simplificado | Kevin Vera | Finalizado | 2026-11-23 | #5 |
| D-06 | PRD v1.0 y módulos MOD-01 a MOD-06 | Kevin Vera | Finalizado | 2026-11-23 | #5 |
| D-07 | ARCHITECTURE v1.0 y `arch/` | Kevin Vera | Finalizado | 2026-11-23 | #5 |
| D-08 | TASKS v1.0 | Kevin Vera | Finalizado | 2026-11-23 | #5 |
| D-09 | Mockup ajustado al alcance v1.0 | Kevin Vera | Finalizado | 2026-11-23 | #6 |
| D-10 | PR de documentación v1.0 fusionado en `main` | Kevin Vera | Finalizado | 2026-11-23 | #5 |
| D-11 | Estrategia de pruebas y fase de configuración del despliegue | Kevin Vera | Finalizado | 2026-11-23 | #7 |
| D-12 | Reparto entre 3 personas, CODING-STANDARDS, CLAUDE.md, plantilla de PR y bitácora | Kevin Vera | Finalizado | 2026-11-23 | #8 |
| T-01 | Esqueleto del backend y archivos compartidos | Kevin Vera | Finalizado | 2026-11-26 | #9 |
| T-03 | Modelo de datos y migración inicial | Kevin Vera | Finalizado | 2026-11-26 | #11 |
| T-05 | Autenticación en el backend | Kevin Vera | Pendiente | — | — |
| T-06 | Login en el frontend | Kevin Vera | Pendiente | — | — |
| T-13a | API de usuarios | Kevin Vera | Pendiente | — | — |
| T-13b | UI de usuarios | Kevin Vera | Pendiente | — | — |
| T-16 | API de cifras públicas | Kevin Vera | Pendiente | — | — |
| T-17 | UI del área pública | Kevin Vera | Pendiente | — | — |
| T-19 | Generador de datos ficticios | Kevin Vera | Pendiente | — | — |
| T-20 | Documento de análisis algorítmico | Kevin Vera | Pendiente | — | — |
| T-02 | Esqueleto del frontend y archivos compartidos (reasignada desde Valentina Sepúlveda) | Kevin Vera | Finalizado | 2026-11-26 | #10 |
| T-04a | Cuentas, accesos y secretos (reasignada desde David Calambas) | Kevin Vera | Finalizado | 2026-11-26 | #12 |
| T-01b | Infraestructura de pruebas (reasignada desde David Calambas) | Kevin Vera | Finalizado | 2026-11-26 | #13 |
| T-04b | Despliegue del backend y del frontend (reasignada desde David Calambas) | Kevin Vera | Finalizado | 2026-11-26 | #14, #15 |
| T-04c | Pipeline CI/CD y protección de `main` (reasignada desde David Calambas) | Kevin Vera | Finalizado | 2026-11-26 | #16 |
| X-KV-1 | Guía de ambiente local (`LOCAL-SETUP.md`) y `.gitattributes` con finales LF | Kevin Vera | Finalizado | 2026-11-26 | #18 |

## Valentina Sepúlveda

| ID | Tarea | Persona | Estado | Fecha | PR |
|---|---|---|---|---|---|
| T-02 | Esqueleto del frontend y archivos compartidos (reasignada a Kevin Vera; ver su sección) | Kevin Vera | Finalizado | 2026-11-26 | #10 |
| T-07 | API de edificaciones *(referencia)* | Valentina Sepúlveda | Pendiente | — | — |
| T-10 | UI: buscar y crear/editar edificación *(referencia)* | Valentina Sepúlveda | Pendiente | — | — |
| T-08 | API de inspecciones | Valentina Sepúlveda | Pendiente | — | — |
| T-11 | UI: ficha e inspección | Valentina Sepúlveda | Pendiente | — | — |
| T-14 | API de consulta con filtros | Valentina Sepúlveda | Pendiente | — | — |
| T-15 | UI de consulta | Valentina Sepúlveda | Pendiente | — | — |

## David Calambas

| ID | Tarea | Persona | Estado | Fecha | PR |
|---|---|---|---|---|---|
| D-04 | Mockup navegable de la interfaz (v0.5) | David Calambas | Finalizado | 2026-11-17 | #4 (reemplazado por #6) |
| T-04a | Cuentas, accesos y secretos (reasignada a Kevin Vera; ver su sección) | Kevin Vera | Finalizado | 2026-11-26 | #12 |
| T-01b | Infraestructura de pruebas (reasignada a Kevin Vera; ver su sección) | Kevin Vera | Finalizado | 2026-11-26 | #13 |
| T-04b | Despliegue del backend y del frontend (reasignada a Kevin Vera; ver su sección) | Kevin Vera | Finalizado | 2026-11-26 | #14, #15 |
| T-04c | Pipeline CI/CD y protección de `main` (reasignada a Kevin Vera; ver su sección) | Kevin Vera | Finalizado | 2026-11-26 | #16 |
| T-04d | Verificación post-despliegue y mantener activo | David Calambas | Pendiente | — | — |
| T-04e | Runbook de despliegue y reversión | David Calambas | En curso | 2026-11-26 | — |
| T-09 | API de personas | David Calambas | Pendiente | — | — |
| T-12 | UI: personas | David Calambas | Pendiente | — | — |
| T-18 | Exportación a PDF | David Calambas | Pendiente | — | — |
| T-21 | Carga de datos en producción | David Calambas | Pendiente | — | — |
| T-22a | Revisión de pruebas y cobertura | David Calambas | Pendiente | — | — |
| T-22 | Pruebas de aceptación en producción (coordina; participan los tres) | David Calambas | Pendiente | — | — |
| T-23 | Congelamiento y entrega | David Calambas | Pendiente | — | — |
