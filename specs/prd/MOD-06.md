# MOD-06 — Datos ficticios y aviso académico
> Prioridad: **Debe estar** · BRIEF §5.4, RN-12, §13

## Objetivo
Poblar producción con datos de prueba creíbles para la demo y dejar claro que el sistema no es una fuente oficial.

## Requerimientos

### RF-06-01 Generador de datos ficticios
Script en Python, ejecutable por línea de comandos.
- **CA-1** Parámetros: número de edificaciones (por defecto 6.043) y semilla aleatoria (resultado reproducible)
- **CA-2** Distribución de stickers aproximada a la del Reporte #050 (≈ 27 % rojo, 38 % amarillo, 35 % verde)
- **CA-3** Entre 0 y 6 personas por edificación, con todos los rangos etarios, vínculos, condiciones y tipos de población representados
- **CA-4** Parte de las edificaciones con más de una inspección (reinspecciones)
- **CA-5** Datos inventados (p. ej. con Faker `es_CO`); los documentos no corresponden a personas reales
- **CA-6** Respeta las reglas de duplicados (RN-01, RN-06)
- **CA-7** Puede limpiar los datos previos antes de cargar, sin borrar los usuarios

### RF-06-02 Aviso de datos ficticios
- **CA-1** Banda visible en todas las páginas, públicas y privadas: "Datos ficticios con fines académicos — no es una fuente oficial"
- **CA-2** El aplicativo no usa logos de la Alcaldía, la UNGRD ni el IDIGER

### RF-06-03 Documento de análisis algorítmico
- **CA-1** `specs/arch/ALGORITHMS.md` documenta las dos operaciones de BRIEF §13 con su complejidad y la referencia al código que las implementa
