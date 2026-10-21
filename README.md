# earthquake-damage-registry

Aplicativo web para registrar y consultar las inspecciones de edificaciones realizadas tras el sismo del 10 de agosto de 2026 en Santiago de Cali, incluyendo las personas que se encontraban en ellas (propietarios y arrendatarios) y la condición de aseguramiento del inmueble.

Cubre el proceso de inspección: identificación de la edificación → inspección rápida (sticker verde / amarillo / rojo) → evaluación en detalle → reinspección → demolición.

Proyecto de la clase de **Análisis de Algoritmos**, desarrollado con metodología **SDD (Spec-Driven Development)**.

> Descripción completa del problema, contexto, flujo, datos del formulario y reglas de negocio: [`specs/BRIEF.md`](specs/BRIEF.md)

---

## Estado del proyecto

🟡 **Fase de documentación SDD.** Aún no hay código.

| Documento | Estado |
|---|---|
| `specs/BRIEF.md` | v0.1 — en validación |
| `specs/DECISIONS.md` | Iniciado |
| `specs/PRD.md`, `specs/ARCHITECTURE.md`, `specs/DESIGN.md`, `specs/TASKS.md` | Esqueletos pendientes |

> El stack tecnológico aún no está definido. Las secciones de requisitos, setup local, pruebas y despliegue se agregarán cuando se decida (ver [`specs/DECISIONS.md`](specs/DECISIONS.md)).

---

## Metodología SDD

**Spec-Driven Development:** primero se escribe y se valida toda la documentación (las *specs*), y solo después se escribe código, tarea por tarea. Cada documento responde una pregunta distinta, y las decisiones quedan escritas en lugar de perderse en el chat del grupo.

### Orden en que se construye

1. **BRIEF** — qué problema resolvemos y en qué contexto (se valida con el grupo)
2. **PRD** y módulos — qué debe hacer el sistema
3. **ARCHITECTURE** y `arch/` — cómo lo construimos
4. **DESIGN** — cómo se ve
5. **TASKS** y fases — qué tareas concretas hay
6. **Construcción** — una tarea por sesión, marcando los criterios de aceptación al terminar

`DECISIONS.md` se llena durante todo el proceso.

### Reglas de convivencia

- **Antes de tocar algo, se revisa la spec.** Si algo cambia, primero se actualiza el documento y después el código
- **Una tarea por rama y por sesión:** no se avanza a la siguiente sin confirmar la anterior
- **Idioma:** specs, comentarios y commits en español; código en inglés
- **Herramientas del curso:** Markdown (documentación), YAML (configuración) y Git (control de versiones)

---

## Documentación del proyecto

| Documento | Responde a... | Contenido |
|---|---|---|
| [`specs/BRIEF.md`](specs/BRIEF.md) | ¿Qué problema resolvemos? | Fuente de verdad: contexto, requisitos, actores, flujo, datos del formulario, reglas de negocio y preguntas abiertas |
| [`specs/PRD.md`](specs/PRD.md) | ¿Qué debe hacer el sistema? | Visión, roles, permisos y lista de módulos (`specs/prd/MOD-XX.md`) |
| [`specs/ARCHITECTURE.md`](specs/ARCHITECTURE.md) | ¿Cómo lo construimos? | Stack, diagrama y principios técnicos; detalle en `specs/arch/` (modelo de datos, API, auth, enums, infraestructura, requerimientos no funcionales) |
| [`specs/DESIGN.md`](specs/DESIGN.md) | ¿Cómo se ve? | Paleta de colores y estándares visuales |
| [`specs/TASKS.md`](specs/TASKS.md) | ¿En qué vamos? | Plan de tareas por fases (`specs/tasks/FASE-XX.md`) y estado del proyecto |
| [`specs/DECISIONS.md`](specs/DECISIONS.md) | ¿Por qué decidimos esto? | Registro de decisiones (ADR): contexto, decisión y consecuencias |
| [`CLAUDE.md`](CLAUDE.md) | ¿Cómo trabaja el agente? | Instrucciones para el asistente de IA: qué leer, cómo trabajar y qué reglas respetar |

---

## Estructura del repositorio

```
earthquake-damage-registry/
  specs/                ← documentación completa del proyecto
    BRIEF.md
    PRD.md
    ARCHITECTURE.md
    DESIGN.md
    TASKS.md
    DECISIONS.md
    prd/                ← requerimientos funcionales por módulo (MOD-XX)
    arch/               ← arquitectura técnica (datos, API, auth, enums, infra, RNF)
    tasks/              ← detalle de tareas por fase (FASE-XX)
  CLAUDE.md             ← instrucciones para el agente Claude Code
  README.md
```

> Las carpetas de código (`frontend/`, `backend/`, etc.) se agregarán cuando se defina el stack.

---

## Seguridad

Este repositorio es **público**. Reglas para todo el equipo:

- Nunca se suben claves, tokens, archivos `.env` ni credenciales. El `.gitignore` los bloquea, pero solo protege archivos que aún no se han subido
- Si alguien sube un secreto por error, hay que **rotarlo de inmediato**: borrarlo del último commit no lo quita del historial
- Nunca se suben datos personales ni datos reales de damnificados (Ley 1581 de 2012, habeas data). Los datos de prueba son **ficticios**
- Para compartir variables de entorno, se versiona solo la plantilla `.env.example`, sin valores reales
- Los commits no deben incluir rutas locales, correos personales ni datos de sesión
