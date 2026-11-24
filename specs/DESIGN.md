# DESIGN.md — Identidad visual
> Estándares visuales del sistema.
> Estado: ⬜ **Pendiente** — se define después de ARCHITECTURE.

---

## Contenido previsto
- Paleta de colores (incluye los colores semánticos de habitabilidad: verde / amarillo / naranja / rojo)
- Tipografía y espaciado
- Componentes base
- Criterios de usabilidad en campo (uso desde celular)

---

## Mockup de referencia
> Propuesta para revisión del grupo; no es el frontend definitivo (el stack se decide en `ARCHITECTURE.md`).

Prototipo navegable en HTML, CSS y JavaScript en [`specs/mockup/`](mockup/). Se abre con doble clic en `index.html`; para entrar al área privada sirve cualquier correo y contraseña. Todos los datos son ficticios y se generan en el navegador.

**Qué muestra** (alcance v1.0 del BRIEF y el PRD)
- **Área pública (MOD-05):** solo cifras agregadas: total de edificaciones inspeccionadas, conteo por sticker vigente, tabla por comuna con columnas por color, personas por rango etario y fecha de la última actualización. Incluye una página estática que explica cada sticker
- **Área privada:**
  - Panel con indicadores e inspecciones recientes
  - Consulta con los filtros combinables de MOD-04 (ubicación, sticker vigente incluido "Sin inspeccionar", rango de fechas, sector, cobertura sí/no/indiferente y filtros de personas que debe cumplir una misma persona), paginada de 20 en 20
  - Ficha de edificación: datos, cobertura, personas (agregar, editar y retirar con confirmación en pantalla), historial de inspecciones con observaciones, reinspección, edición de la edificación y exportación a PDF (simulada)
  - Registro de una edificación nueva en 3 pasos: edificación y cobertura, inspección, personas. Si el código catastral ya existe, remite a la ficha
  - Validación de duplicados: código catastral (RN-01) y persona dentro de la edificación por documento, o por nombre y fecha de nacimiento si no tiene documento (RN-06)
  - Gestión de usuarios: crear y desactivar (solo Administrador)
- **Roles:** el selector "Ver como" alterna entre Administrador e Inspector

**Propuesta visual**
- Estilo institucional sobrio: azul de servicio público sobre blanco, tipografía Public Sans
- Los colores del sticker (verde, amarillo, rojo) son el único acento fuerte y se reservan para la clasificación
- Aviso permanente de "proyecto académico con datos ficticios"; no usa logos ni marca de la Alcaldía, la UNGRD ni el IDIGER (BRIEF RN-12)
