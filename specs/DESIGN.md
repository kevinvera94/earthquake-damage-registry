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

Prototipo navegable en HTML, CSS y JavaScript en [`specs/mockup/`](mockup/). Se abre con doble clic en `index.html`; para entrar al área privada sirve cualquier usuario y contraseña. Todos los datos son ficticios y se generan en el navegador.

**Qué muestra**
- **Área pública:** resumen de cifras agregadas (stickers, demoliciones, comunas, personas por edad y cobertura) y la explicación de cada sticker
- **Área privada:** panel con cola de prioridad, consulta con filtros combinables, ficha de edificación con exportación a PDF, registro de inspección en 5 pasos, reportes y gestión de usuarios
- **Roles:** el selector "Ver como" muestra qué menú y permisos tiene cada rol (Administrador, Inspector, Consulta)

**Propuesta visual**
- Estilo institucional sobrio: azul de servicio público sobre blanco, tipografía Public Sans
- Los colores del sticker (verde, amarillo, rojo) son el único acento fuerte y se reservan para la clasificación
- Aviso permanente de "proyecto académico con datos ficticios"; no usa logos ni marca de la Alcaldía, la UNGRD ni el IDIGER (BRIEF §11)
