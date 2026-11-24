# FASE-04 — Datos ficticios, calidad y entrega
> **28 – 30-nov-2026** · Objetivo: producción con datos de demo, aceptación verificada y código congelado el 29-nov.

---

### T-19 — Generador de datos ficticios ⬜
- **Carril:** F · **Depende de:** T-09 (puede empezar con T-03 contra el modelo)
- **Specs:** RF-06-01
- **Hacer:** `scripts/seed.py` con parámetros `--buildings`, `--seed`, `--reset`; Faker `es_CO`; distribución de stickers del Reporte #050; 0–6 personas por edificación; ≈ 20 % con reinspección; respeta RN-01 y RN-06; inserción por lotes
- **Hecho cuando:** carga 6.043 edificaciones en local en menos de 2 minutos y `--reset` no borra usuarios

### T-20 — Documento de análisis algorítmico ⬜
- **Carril:** F · **Depende de:** T-09, T-14, T-16
- **Specs:** RF-06-03; BRIEF §13
- **Hacer:** `specs/arch/ALGORITHMS.md`: control de duplicados (índice B-tree O(log n) frente a recorrido O(n) y tabla hash O(1) promedio), rango etario O(1) por persona y su traducción a intervalo de fechas indexable, agregación de cifras O(n). Cada caso enlaza al código que lo implementa
- **Hecho cuando:** revisado por al menos dos integrantes

### T-21 — Carga de datos en producción ⬜
- **Carril:** E · **Depende de:** T-19 y FASE-03 completa
- **Hacer:** ejecutar `seed.py` contra producción; crear el usuario Inspector y el Administrador de demostración; medir RNF-04 en la consulta
- **Hecho cuando:** las cifras públicas muestran los datos cargados y la consulta responde en < 2 s (Render ya despierto)

### T-22 — Pruebas de aceptación en producción ⬜
- **Carril:** F (con todo el equipo) · **Depende de:** T-21
- **Hacer:** recorrer los criterios de aceptación de MOD-01 a MOD-06 en producción, en escritorio y en celular (RNF-03); registrar los hallazgos como issues; corregir los bloqueantes (cada corrección, su PR)
- **Hecho cuando:** ningún criterio de aceptación queda fallando sin decisión explícita

### T-23 — Congelamiento y entrega ⬜
- **Carril:** E · **Depende de:** T-22
- **Hacer:**
  - **29-nov:** congelar `main` (solo correcciones críticas); etiquetar `v1.0.0`; README final con URLs, cómo correr en local y arquitectura en una página
  - Verificar Render y Supabase activos; enviar al profesor las credenciales de demostración por canal privado (BRIEF §14)
  - **30-nov:** abrir el sitio antes de la sustentación para despertar Render
- **Hecho cuando:** entregado

## Criterio de cierre de la fase
Aplicativo entregado el 30-nov-2026 en producción.
