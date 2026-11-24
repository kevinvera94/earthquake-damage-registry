# FASE-03 — Registro: edificaciones, inspecciones y personas
> **25 – 26-nov-2026** · Objetivo: un inspector registra en producción una visita completa (flujo F-1) y una reinspección (F-2).
> Toda tarea de backend entrega pruebas unitarias de sus servicios **y** de integración de sus endpoints (TESTING §2.5).

---

### T-07 — API de edificaciones ⬜
- **Carril:** A · **Depende de:** T-03, T-05
- **Specs:** RF-02-01 a RF-02-03; API §2, §3.3; RN-01, RN-08
- **Hacer:** `POST /api/buildings`, `GET /api/buildings/lookup`, `GET /api/buildings/{id}` (ficha con inspecciones y personas), `PATCH /api/buildings/{id}`; `IntegrityError` → 409
- **Pruebas:** integración `test_buildings.py`: código catastral duplicado → 409; `cadastral_code` no editable; `floors < 1` → 422; sin token → 401
- **Hecho cuando:** pruebas en verde y endpoints visibles en `/docs`

### T-08 — API de inspecciones ⬜
- **Carril:** A · **Depende de:** T-07
- **Specs:** RF-02-04, RF-02-05; DATA-MODEL §4.1; RN-02 a RN-04
- **Hacer:** `POST /api/buildings/{id}/inspections`; inspector = usuario del token; actualizar `current_sticker` y `last_inspection_at` en la misma transacción
- **Pruebas:** unitarias `test_inspection_rules.py` (validación de fechas y si cambia el vigente); integración: fecha futura y anterior al 10-ago-2026 → 422; inspección con fecha anterior a la última **no** cambia el sticker vigente; historial ordenado descendente
- **Hecho cuando:** pruebas en verde

### T-09 — API de personas ⬜
- **Carril:** B · **Depende de:** T-07
- **Specs:** RF-03-01 a RF-03-05; DATA-MODEL §3, §4.2; RN-05 a RN-07
- **Hacer:** `POST /api/buildings/{id}/people`, `PATCH /api/people/{id}`, `DELETE /api/people/{id}`; `services/people.py` (normalización de nombre) y `services/ages.py` (edad, rango, intervalo de fechas por rango)
- **Pruebas:** unitarias `test_ages.py` y `test_people_rules.py` (límites de edad, normalización con mayúsculas/tildes/espacios); integración: duplicado con documento y sin documento (con mayúsculas y tildes distintas) → 409; misma persona en otra edificación → OK; "Sin documento" con número → 422; edades límite 9, 10, 17, 18, 59 y 60
- **Hecho cuando:** pruebas en verde

### T-10 — UI: buscar y crear/editar edificación ⬜
- **Carril:** C · **Depende de:** T-06, T-07
- **Specs:** RF-02-01 a RF-02-03; mockup ajustado (paso 1)
- **Hacer:** búsqueda por código catastral → ficha o formulario de creación prellenado; formulario de edificación con cobertura (crear y editar); mensaje para 409
- **Pruebas:** unitarias de `lib/validation.js` (pisos ≥ 1, obligatorios)
- **Hecho cuando:** en producción se crea y edita una edificación; el duplicado muestra el error

### T-11 — UI: ficha e inspección ⬜
- **Carril:** C · **Depende de:** T-08, T-10
- **Specs:** RF-02-04, RF-02-05, RF-04-03; mockup ajustado (ficha, paso 2)
- **Hacer:** página de ficha (datos, cobertura, `StickerBadge` vigente, historial con observaciones); formulario de nueva inspección con fecha-hora por defecto "ahora"
- **Hecho cuando:** registrar una reinspección cambia el sticker vigente y conserva la anterior en el historial

### T-12 — UI: personas ⬜
- **Carril:** D · **Depende de:** T-09, T-11 (la ficha)
- **Specs:** RF-03-01 a RF-03-05; mockup ajustado (paso 3)
- **Hacer:** tabla de personas en la ficha; formulario agregar/editar (número oculto si "Sin documento"; "Ninguna" excluyente); retirar con confirmación en pantalla
- **Pruebas:** unitarias de `lib/validation.js` ("Sin documento" sin número; "Ninguna" excluyente; fecha no futura)
- **Hecho cuando:** se agregan, editan y retiran personas; edad y rango se ven calculados; el duplicado muestra el error

## Criterio de cierre de la fase
En producción, con un usuario Inspector creado por el admin: flujo F-1 completo y una reinspección F-2.
