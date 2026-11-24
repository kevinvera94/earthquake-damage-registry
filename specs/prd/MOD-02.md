# MOD-02 — Edificaciones e inspecciones
> Prioridad: **Debe estar** · Roles: Inspector, Administrador · BRIEF §7, §8.1, §8.2, RN-01 a RN-04, RN-08

## Objetivo
Registrar cada edificación una sola vez, con su cobertura, y llevar el historial de inspecciones con el sticker asignado.

## Requerimientos

### RF-02-01 Buscar edificación por código catastral
- **CA-1** Si el código existe, muestra la edificación y ofrece abrir su ficha
- **CA-2** Si no existe, ofrece crearla con el código ya diligenciado

### RF-02-02 Crear edificación
Campos de BRIEF §8.1: código catastral, dirección, comuna, barrio, sector/uso, número de pisos, asegurada, con hipoteca, con leasing.
- **CA-1** Todos los campos obligatorios se validan en frontend y backend
- **CA-2** Si el código catastral ya existe, el backend responde 409 y no crea un duplicado (RN-01)
- **CA-3** Las tres casillas de cobertura son independientes y por defecto en "No" (RN-08)
- **CA-4** Número de pisos es entero ≥ 1

### RF-02-03 Editar edificación
- **CA-1** Se pueden editar todos los campos excepto el código catastral
- **CA-2** El sticker **no** se edita desde aquí (RN-03)

### RF-02-04 Registrar inspección
Campos: fecha y hora (por defecto, ahora), color de sticker (verde / amarillo / rojo), observaciones (opcional).
- **CA-1** El inspector es el usuario autenticado; no se puede elegir otro (RN-04)
- **CA-2** La fecha no puede ser futura ni anterior al 10-ago-2026
- **CA-3** Tras guardar, la ficha muestra el nuevo sticker vigente

### RF-02-05 Sticker vigente e historial
- **CA-1** El sticker vigente es el de la inspección con la fecha más reciente (RN-02)
- **CA-2** Una edificación sin inspecciones se muestra como "Sin inspeccionar"
- **CA-3** El historial lista todas las inspecciones, de la más reciente a la más antigua, con fecha, inspector, color y observaciones
- **CA-4** No existe opción para editar ni borrar inspecciones

## Fuera de alcance
Evaluaciones A–E, clasificación global, demolición, estados de validación, fotos (BRIEF §14).
