# TASKS.md — Plan de tareas del proyecto
> Índice de fases. El detalle de cada fase está en `specs/tasks/FASE-XX.md`.
> Convención: una tarea = una sesión de agente = una rama = un PR (atómica, verificable, independiente).
> Versión: **v1.1** — agrega la fase de configuración del despliegue (FASE-01) y la estrategia de pruebas (`arch/TESTING.md`) · Última actualización: 2026-11-23

---

## Estado actual

**Tarea activa:** —
**Fase activa:** FASE-00 (documentación SDD) → cierre
**Próxima tarea:** T-01 Esqueleto del backend y T-02 Esqueleto del frontend (FASE-01, en paralelo)

---

## Fases del proyecto

| Fase | Nombre | Fechas | Archivo | Estado |
|---|---|---|---|---|
| FASE-00 | Documentación SDD | 21-oct – 23-nov | [`tasks/FASE-00.md`](tasks/FASE-00.md) | 🔄 |
| FASE-01 | **Configuración del despliegue a producción** (esqueletos, pruebas, CI/CD) | 24-nov (mañana) | [`tasks/FASE-01.md`](tasks/FASE-01.md) | ⬜ |
| FASE-02 | Autenticación y usuarios | 24-nov (tarde) – 25-nov | [`tasks/FASE-02.md`](tasks/FASE-02.md) | ⬜ |
| FASE-03 | Registro: edificaciones, inspecciones y personas | 25 – 26-nov | [`tasks/FASE-03.md`](tasks/FASE-03.md) | ⬜ |
| FASE-04 | Consulta, área pública y PDF | 27-nov | [`tasks/FASE-04.md`](tasks/FASE-04.md) | ⬜ |
| FASE-05 | Datos ficticios, calidad y entrega | 28 – 30-nov | [`tasks/FASE-05.md`](tasks/FASE-05.md) | ⬜ |

---

## Carriles de trabajo (6 integrantes)
Cada integrante toma un carril para trabajar en paralelo sin pisarse. Los nombres se asignan en la reunión del equipo.

| Carril | Responsable | Tareas |
|---|---|---|
| **A — Backend núcleo** | *por asignar* | T-01, T-07, T-08, T-14 |
| **B — Backend personas y auth** | *por asignar* | T-05, T-13a, T-09, T-16, T-18 |
| **C — Frontend registro** | *por asignar* | T-02, T-10, T-11 |
| **D — Frontend consulta y público** | *por asignar* | T-06, T-13b, T-12, T-15, T-17 |
| **E — Infraestructura y despliegue** | *por asignar* (dueño de las cuentas, BRIEF P-02) | T-03, T-04a – T-04e, T-21, T-23 |
| **F — Pruebas, datos y documentación** | *por asignar* | T-01b, T-19, T-20, T-22a, T-22, revisión de PR |

> Si el carril B se retrasa, T-18 (PDF) pasa al carril F.

## Mapa de dependencias

```mermaid
flowchart LR
  subgraph F1[FASE-01 Despliegue]
    T01[T-01 Backend base] --> T01b[T-01b Pruebas base]
    T02[T-02 Frontend base] --> T01b
    T01 --> T03[T-03 Migración inicial]
    T04a[T-04a Cuentas y secretos] --> T04b[T-04b Despliegue]
    T03 --> T04b
    T02 --> T04b
    T01b --> T04c[T-04c CI/CD y protección]
    T04b --> T04c
    T04c --> T04d[T-04d Smoke y keep-alive]
    T04c --> T04e[T-04e Runbook y rollback]
  end
  subgraph F2[FASE-02 Auth]
    T05[T-05 Auth backend] --> T06[T-06 Login UI]
    T05 --> T13a[T-13a API usuarios] --> T13b[T-13b UI usuarios]
  end
  subgraph F3[FASE-03 Registro]
    T07[T-07 API edificaciones] --> T08[T-08 API inspecciones]
    T07 --> T09[T-09 API personas]
    T07 --> T10[T-10 UI edificación]
    T08 --> T11[T-11 UI ficha + inspección]
    T09 --> T12[T-12 UI personas]
  end
  subgraph F4[FASE-04 Consulta]
    T14[T-14 API consulta] --> T15[T-15 UI consulta]
    T16[T-16 API cifras] --> T17[T-17 UI pública]
    T18[T-18 PDF]
  end
  subgraph F5[FASE-05 Cierre]
    T19[T-19 Datos ficticios] --> T21[T-21 Carga en producción]
    T19 --> T20[T-20 ALGORITHMS.md]
    T22a[T-22a Cobertura] --> T22[T-22 Aceptación]
    T21 --> T22 --> T23[T-23 Entrega]
  end
  T01b --> T05
  T03 --> T05
  T05 --> T07
  T06 --> T10
  T08 --> T14
  T09 --> T14
  T08 --> T16
  T09 --> T18
  T11 --> T18
  T09 --> T19
```

## Reglas de trabajo
- Rama `feat/T-XX-descripcion` desde `main`; PR con CI en verde y **una** aprobación de otro integrante. Desde T-04c, GitHub lo exige
- **Pruebas obligatorias** (TESTING §5): toda tarea que toca `backend/app/` entrega pruebas unitarias de sus servicios y de integración de sus endpoints; toda tarea que toca `frontend/src/lib/` entrega pruebas con Vitest. Sin pruebas no se aprueba el PR
- **Cobertura mínima** en CI: 80 % global y 90 % en `app/services/`
- Al fusionar en `main`, el cambio se despliega solo; el *smoke* (T-04d) debe quedar en verde. Si falla, se revierte primero y se investiga después (INFRA §7.4)
- El PR referencia los RF/RN que cubre (p. ej. "Cubre RF-02-02, RN-01")
- Al fusionar: marcar la tarea ✅ en su `FASE-XX.md` y actualizar "Estado actual" de este archivo
- Si una tarea se bloquea más de medio día, se avisa en el grupo y se replanifica

---

## Leyenda de estado

| Símbolo | Significado |
|---|---|
| ⬜ | Pendiente |
| 🔄 | En progreso |
| ✅ | Completada |
| ⏸ | Bloqueada (esperando dependencia) |

---

## Completadas
Ver `tasks/FASE-00.md`.
