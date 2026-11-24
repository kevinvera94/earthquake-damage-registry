# FASE-04 — Consulta, área pública y PDF
> **27-nov-2026** · Objetivo: flujos F-3 (consulta y PDF) y F-4 (ciudadano) funcionando en producción.

---

### T-14 — API de consulta con filtros ⬜
- **Responsable:** Valentina Sepúlveda · **Depende de:** T-08, T-09
- **Specs:** RF-04-01, RF-04-02; API §3.2; DATA-MODEL §4.2, §4.3
- **Hacer:** `GET /api/buildings` con todos los filtros, un único `EXISTS` para los filtros de personas, paginación, orden y `people_count`
- **Pruebas:** unitarias `test_filters.py` (parámetros → condiciones); integración `test_search.py`: combinación Y entre grupos; caso "arrendatario + adulto mayor" con dos personas distintas que cumplen cada una un filtro → **no** aparece; `sticker=none`; filtros de cobertura indiferente/sí/no; conteo total correcto con paginación
- **Hecho cuando:** pruebas en verde y respuesta < 2 s con los datos ficticios (RNF-04; medir tras T-21)

### T-15 — UI de consulta ⬜
- **Responsable:** Valentina Sepúlveda · **Depende de:** T-14
- **Specs:** RF-04-01, RF-04-02; mockup ajustado (consulta)
- **Hacer:** panel de filtros (controles de RF-04-01), tabla de resultados con paginación de 20 y conteo total, "Limpiar filtros", fila → ficha. Los filtros se reflejan en la URL (query string) para poder compartir y recargar
- **Pruebas:** unitarias de `lib/filters.js` (filtros ⇄ query string, ida y vuelta)
- **Hecho cuando:** cada filtro cambia los resultados como en el PRD

### T-16 — API de cifras públicas ⬜
- **Responsable:** Kevin Vera · **Depende de:** T-08
- **Specs:** RF-05-01 a RF-05-03; API §3.1; RN-09
- **Hacer:** `GET /api/public/stats` sin autenticación, con un esquema de respuesta cerrado
- **Pruebas:** unitarias `test_stats.py`; integración `test_public_stats.py`: la suma por color = total; la respuesta no contiene claves ni valores de datos personales (nombres, documentos, direcciones, códigos catastrales sembrados en la prueba); funciona sin token
- **Hecho cuando:** pruebas en verde

### T-17 — UI del área pública ⬜
- **Responsable:** Kevin Vera · **Depende de:** T-16, T-02
- **Specs:** RF-05-01; mockup ajustado (inicio)
- **Hacer:** página `/` con tarjetas por sticker, tabla por comuna, personas por rango etario, última actualización y botón "Iniciar sesión"
- **Hecho cuando:** en producción, sin sesión, se ven las cifras

### T-18 — Exportación a PDF ⬜
- **Responsable:** David Calambas · **Depende de:** T-09, T-11
- **Specs:** RF-04-04; BRIEF §11.3; DEC-007
- **Hacer:** `pdf.py` con ReportLab y `GET /api/buildings/{id}/pdf`; botón en la ficha que descarga con `fetch` + `Blob` (API §2, nota)
- **Pruebas:** integración `test_pdf.py`: devuelve `application/pdf` con el nombre de RF-04-04 CA-3; sin token → 401; edificación sin inspecciones ni personas → PDF con "Sin registros"
- **Hecho cuando:** en producción se descarga y abre el PDF de una edificación con historial y personas

## Criterio de cierre de la fase
Todos los módulos MOD-01 a MOD-05 funcionando en producción.
