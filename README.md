# earthquake-damage-registry

Aplicativo web para registrar y consultar las inspecciones de edificaciones realizadas tras el sismo del 10 de agosto de 2026 en Santiago de Cali, incluyendo las personas asociadas a cada edificación (propietarios y arrendatarios) y la condición de aseguramiento, hipoteca y leasing del inmueble.

Cubre el proceso de inspección: identificación de la edificación → inspección rápida (sticker verde / amarillo / rojo) → evaluación en detalle → reinspección → demolición.

El aplicativo tiene **dos áreas**:

- **Área pública** (sin iniciar sesión): página de entrada con un resumen de cifras del estado general. Solo muestra datos agregados
- **Área privada** (usuario y contraseña): registro de inspecciones y de personas, consulta con filtros, reportes y exportación a PDF por edificación

Proyecto de la clase de **Análisis de Algoritmos**, desarrollado con metodología **SDD (Spec-Driven Development)**.

> **Proyecto académico:** todos los datos registrados, incluso en producción, son **ficticios**. No es una fuente oficial ni está afiliado a la Alcaldía de Cali, la UNGRD ni el IDIGER.

> Descripción completa del problema, contexto, flujo, datos del formulario y reglas de negocio: [`specs/BRIEF.md`](specs/BRIEF.md)

---

## Estado del proyecto

🟡 **Fase de documentación SDD.** Aún no hay código.

- **Fecha de entrega:** 30 de noviembre de 2026, desplegado en un ambiente de producción con capa gratuita
- **Backend:** debe desarrollarse en **Python** (exigencia del curso)

| Documento | Estado |
|---|---|
| `specs/BRIEF.md` | v0.5 — en validación (incorpora el formato RUFE de la UNGRD) |
| `specs/DECISIONS.md` | Iniciado |
| `specs/PRD.md`, `specs/ARCHITECTURE.md`, `specs/DESIGN.md`, `specs/TASKS.md` | Esqueletos pendientes |

> El stack tecnológico es tentativo (Python en el backend). Las secciones de requisitos, setup local, pruebas y despliegue se agregarán cuando se decida (ver [`specs/DECISIONS.md`](specs/DECISIONS.md)).

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

### Flujo de trabajo con Git

`main` está protegida: no se hace push directo. Todo cambio entra por **Pull Request**:

1. Crear una rama desde `main` actualizada (por ejemplo `docs/nombre-del-cambio`)
2. Hacer commits descriptivos en español y subir la rama
3. Abrir el PR hacia `main`
4. El dueño del proyecto lo revisa y aprueba ([`CODEOWNERS`](.github/CODEOWNERS))
5. Se integra con **squash merge** y se borra la rama

---

## Documentación del proyecto

| Documento | Responde a... | Contenido |
|---|---|---|
| [`specs/BRIEF.md`](specs/BRIEF.md) | ¿Qué problema resolvemos? | Fuente de verdad: contexto, requisitos, actores, flujo, datos de los formularios (IDIGER y RUFE), reglas de negocio y preguntas abiertas |
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
  .github/
    CODEOWNERS          ← quién debe aprobar los cambios
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
- **Solo datos ficticios**, en el repositorio y en producción. Nunca se ingresan datos personales reales ni de damnificados (Ley 1581 de 2012, habeas data). Los datos de prueba que se versionen van en `data/sample/`
- Las credenciales de demostración se entregan por un canal privado, nunca en el repositorio
- Para compartir variables de entorno, se versiona solo la plantilla `.env.example`, sin valores reales
- Los commits no deben incluir rutas locales, correos personales ni datos de sesión
