# MOD-04 — Consulta, ficha y PDF
> Prioridad: **Debe estar** · Roles: Inspector, Administrador · BRIEF §11.2, §11.3, RN-11

## Objetivo
Encontrar edificaciones combinando filtros, ver toda su información y exportarla a PDF.

## Requerimientos

### RF-04-01 Consulta con filtros combinables
Filtros de BRIEF §11.2:

| Grupo | Filtro | Tipo de control |
|---|---|---|
| Ubicación | Comuna | Selección |
| | Barrio | Texto (contiene) |
| | Código catastral | Texto (contiene) |
| Inspección | Sticker vigente | Selección múltiple (incluye "Sin inspeccionar") |
| | Fecha de la última inspección | Rango desde–hasta |
| Edificación | Sector / uso | Selección |
| Cobertura | Asegurada · Con hipoteca · Con leasing | Sí / No / Indiferente (cada uno) |
| Personas | Vínculo · Rango etario · Condición especial · Tipo de población | Selección |

- **CA-1** Los filtros se combinan con **Y** (todos se cumplen)
- **CA-2** Los filtros de personas se cumplen si **al menos una** persona de la edificación cumple **todos** los filtros de personas a la vez (p. ej. "arrendatario" + "adulto mayor" = un arrendatario que es adulto mayor)
- **CA-3** Sin filtros, lista todas las edificaciones
- **CA-4** Botón "Limpiar filtros"

### RF-04-02 Resultados
- **CA-1** Tabla con código catastral, dirección, comuna, barrio, sector, sticker vigente, fecha de la última inspección y número de personas
- **CA-2** Paginación de 20 en 20 y conteo total de resultados
- **CA-3** Orden por defecto: última inspección más reciente primero
- **CA-4** Cada fila abre la ficha de la edificación

### RF-04-03 Ficha de la edificación
- **CA-1** Muestra datos y cobertura (MOD-02), sticker vigente e historial (RF-02-05) y personas (RF-03-05)
- **CA-2** Desde la ficha se accede a: editar edificación, nueva inspección, agregar persona y exportar PDF

### RF-04-04 Exportar PDF
Contenido de BRIEF §11.3.
- **CA-1** Lo genera el backend; solo con sesión válida (RN-11)
- **CA-2** Incluye fecha-hora de generación, el usuario que lo generó y el aviso "Datos ficticios con fines académicos"
- **CA-3** Nombre del archivo: `edificacion-<codigo-catastral>-<AAAAMMDD>.pdf`
- **CA-4** Una edificación sin inspecciones o sin personas genera el PDF indicando "Sin registros" en esa sección

## Fuera de alcance
Exportar el resultado de la consulta (CSV/Excel), reportes adicionales, ordenar por cualquier columna.
