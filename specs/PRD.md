# PRD.md — Product Requirements Document (Índice)
> Fuente de verdad del producto. Se construye sobre `specs/BRIEF.md` v1.0.
> Los requerimientos funcionales detallados están en `specs/prd/MOD-XX.md`.
> Versión: **v1.0** — Última actualización: 2026-11-23

---

## 1. Visión del producto
Un aplicativo web, simple y desplegado en producción, en el que los inspectores de la Secretaría de Gestión del Riesgo de Cali registran el **sticker** que asignan a cada edificación tras el sismo del 10-ago-2026, junto con su **cobertura** y las **personas que la ocupan**. El personal autorizado consulta con filtros y exporta un PDF por edificación, y la ciudadanía ve un resumen de cifras sin iniciar sesión.

**Éxito para la entrega (30-nov-2026):**
- Todo lo del tablero del profesor está cubierto (BRIEF §9)
- El profesor puede entrar a producción, ver las cifras públicas, iniciar sesión, registrar, filtrar y exportar un PDF con datos ficticios, sin errores

---

## 2. Usuarios y permisos

| Acción | Visitante | Inspector | Administrador |
|---|:-:|:-:|:-:|
| Ver cifras públicas | ✅ | ✅ | ✅ |
| Iniciar sesión | — | ✅ | ✅ |
| Crear / editar edificaciones | — | ✅ | ✅ |
| Registrar inspecciones | — | ✅ | ✅ |
| Crear / editar / retirar personas | — | ✅ | ✅ |
| Consultar con filtros y ver fichas | — | ✅ | ✅ |
| Exportar PDF | — | ✅ | ✅ |
| Crear / desactivar usuarios | — | — | ✅ |

> Decisión de simplicidad: el Inspector puede editar cualquier edificación, no solo las suyas. Las inspecciones **no** se editan ni se borran (BRIEF RN-02); un error se corrige registrando una nueva inspección.

---

## 3. Módulos del MVP

| ID | Módulo | Archivo | Prioridad |
|---|---|---|---|
| MOD-01 | Autenticación y usuarios | [`prd/MOD-01.md`](prd/MOD-01.md) | Debe estar |
| MOD-02 | Edificaciones e inspecciones | [`prd/MOD-02.md`](prd/MOD-02.md) | Debe estar |
| MOD-03 | Personas ocupantes | [`prd/MOD-03.md`](prd/MOD-03.md) | Debe estar |
| MOD-04 | Consulta, ficha y PDF | [`prd/MOD-04.md`](prd/MOD-04.md) | Debe estar |
| MOD-05 | Área pública | [`prd/MOD-05.md`](prd/MOD-05.md) | Debe estar |
| MOD-06 | Datos ficticios y aviso académico | [`prd/MOD-06.md`](prd/MOD-06.md) | Debe estar |

**Convención de IDs:** `RF-<módulo>-<n>` para requerimientos funcionales (p. ej. `RF-02-03`). Cada RF tiene criterios de aceptación verificables.

---

## 4. Flujos principales

### F-1 Registrar una visita
`Login` → `Buscar por código catastral` → (no existe) `Crear edificación` → `Registrar inspección` → `Agregar personas` → `Ficha de la edificación`

### F-2 Reinspección
`Buscar edificación` → `Ficha` → `Nueva inspección` → la ficha muestra el nuevo sticker vigente y el historial

### F-3 Consulta y PDF
`Consulta` → aplicar filtros → `Ficha` → `Exportar PDF`

### F-4 Ciudadano
`Página de entrada` (cifras públicas) → (opcional) `Iniciar sesión`

---

## 5. Requerimientos no funcionales (resumen)
| ID | Requerimiento |
|---|---|
| RNF-01 | Desplegado en producción en capa gratuita (Vercel + Render + Supabase) |
| RNF-02 | Backend en Python (FastAPI); toda regla de negocio y de permisos se valida en el backend |
| RNF-03 | Interfaz responsive: usable en celular (≥ 360 px) y escritorio |
| RNF-04 | La consulta con filtros responde en < 2 s con ≈ 6.000 edificaciones y ≈ 20.000 personas (sin contar el arranque en frío de Render) |
| RNF-05 | Sin credenciales ni datos reales en el repositorio; configuración por variables de entorno |
| RNF-06 | Pruebas automáticas del backend para las reglas de negocio (RN-01 a RN-11) ejecutadas en CI antes de desplegar |

---

## 6. Si sobra tiempo (no comprometido)
- Exportación CSV del resultado de la consulta
- Gráficos en el área pública (por ahora, tarjetas y tablas)
- Edición de la propia contraseña desde el aplicativo

## 7. Fuera de alcance
Ver BRIEF §14.
