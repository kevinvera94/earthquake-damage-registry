# MOD-05 — Área pública
> Prioridad: **Debe estar** · Rol: Visitante · BRIEF §4.2, §11.1, RN-09

## Objetivo
Mostrar a cualquier persona, sin iniciar sesión, el estado general de las edificaciones con cifras agregadas.

## Requerimientos

### RF-05-01 Página de entrada con cifras
Es la ruta raíz (`/`) del aplicativo.
- **CA-1** Tarjetas: total de edificaciones inspeccionadas y conteo por sticker vigente (verde, amarillo, rojo)
- **CA-2** Tabla de edificaciones por comuna, con columnas por color de sticker y total
- **CA-3** Personas por rango etario (cuatro rangos de RF-03-03)
- **CA-4** Fecha y hora de la última actualización (la inspección o el cambio de persona más reciente)
- **CA-5** Botón "Iniciar sesión" visible

### RF-05-02 Solo datos agregados (RN-09)
- **CA-1** El endpoint público no requiere token y solo devuelve conteos
- **CA-2** La respuesta nunca contiene nombres, documentos, direcciones ni códigos catastrales (verificado por prueba automática)

### RF-05-03 Coherencia de cifras
- **CA-1** La suma por color es igual al total de edificaciones inspeccionadas
- **CA-2** Las cifras reflejan lo registrado sin intervención manual

## Fuera de alcance
Gráficos (ver PRD §6), ocultar conteos bajos, mapas.
