# BRIEF.md
> Fuente de verdad del proyecto. Agnóstico a la herramienta.
> Todos los agentes y archivos de configuración deben referenciar este documento.
> Versión: **v1.0 (validada — alcance simplificado)** — v0.5 modelaba el formulario IDIGER y el RUFE completos; por acuerdo con el profesor, la v1.0 reduce el alcance a lo mínimo que cumple el tablero de clase (ver DEC-003)
> Última actualización: 2026-11-23

---

## 1. Nombre del proyecto
**earthquake-damage-registry** (repositorio: https://github.com/kevinvera94/earthquake-damage-registry)

---

## 2. Descripción
Aplicativo web para **registrar y consultar las inspecciones de edificaciones** que realiza la Secretaría de Gestión del Riesgo de Emergencias y Desastres de Santiago de Cali tras el sismo del **10 de agosto de 2026**.

Cada inspección registra el **color de sticker** (verde / amarillo / rojo) de la edificación. Cada edificación guarda sus datos básicos, su **cobertura** (asegurada, hipoteca, leasing) y las **personas que la ocupan** (propietarios y arrendatarios).

El aplicativo tiene **dos áreas**:
- **Área pública (sin inicio de sesión):** es la página de entrada y muestra un **resumen de cifras** agregadas
- **Área privada (usuario y contraseña):** registro de edificaciones, inspecciones y personas, **consulta con filtros** y **exportación a PDF** de una edificación

---

## 3. Problema que resuelve
La inspección de miles de edificaciones se apoya en formularios y stickers físicos. Esto dificulta:
- Consolidar en un solo lugar el estado de cada edificación y su historial de inspecciones
- Relacionar la edificación con las **personas que la ocupan** y con su **cobertura**
- Obtener cifras (edificaciones por sticker, por comuna, personas por rango de edad) sin consolidación manual
- Informar a la ciudadanía el estado general de forma pública y actualizada

**Magnitud de referencia (Reporte Oficial #050, corte 16-oct-2026):** 6.043 edificaciones caracterizadas (1.651 rojo · 2.288 amarillo · 2.104 verde).

---

## 4. Contexto

### 4.1 Evento y respuesta institucional
- **Evento:** sismo del 10 de agosto de 2026 que afectó a Cali
- **Entidad responsable:** Secretaría de Gestión del Riesgo de Emergencias y Desastres (Alcaldía de Santiago de Cali)
- **Metodología:** la UNGRD (Circular N.° 73, 20-ago-2026) define una **inspección rápida** (protocolo ATC-20) que termina en un sticker de tres colores, y una evaluación en detalle posterior (formulario IDIGER)
- **Este proyecto** digitaliza solo la **inspección rápida** (el sticker) y la información de los ocupantes. La evaluación en detalle queda fuera de alcance (sección 13)

### 4.2 Áreas del sistema
El profesor exige una parte pública y una privada.

| | **Área pública** | **Área privada** |
|---|---|---|
| **Acceso** | Libre, sin inicio de sesión. Es la página de entrada | Usuario y contraseña |
| **Para quién** | Ciudadanía | Administrador e inspectores |
| **Qué ofrece** | Resumen de cifras | Registro, consulta con filtros y exportación a PDF |
| **Datos que ve** | **Solo cifras agregadas** | Información detallada |

---

## 5. Contexto académico

### 5.1 Curso
Proyecto de la clase de **Análisis de Algoritmos**. El aplicativo debe reflejar el contenido del lado izquierdo del tablero (sección 9). El profesor aceptó que el proyecto se haga **de la forma más simple posible**.

### 5.2 Escala de evaluación entre grupos
| Posición | Nota |
|---|---|
| 1.° | 5.0 |
| 2.° | 4.0 |
| 3.° | 3.0 |
| 4.° | 2.9 |

> La evaluación es relativa entre grupos: importa cumplir **todo** lo del tablero y que funcione bien en producción, más que la cantidad de funciones.

### 5.3 Herramientas exigidas
| Herramienta | Uso en el proyecto |
|---|---|
| **Markdown** | Documentación SDD (`specs/`) |
| **YAML** | Pipelines de CI y configuración de despliegue |
| **Git** | Una rama por tarea, commits descriptivos, PR a `main` |

### 5.4 Plazo y condiciones de entrega
| Condición | Detalle |
|---|---|
| **Fecha límite** | **30 de noviembre de 2026** (lunes) |
| **Estado de la entrega** | Desplegado en **producción** |
| **Infraestructura** | **Capa gratuita** (sección 12.1) |
| **Backend** | **Python** (exigencia del profesor) |
| **Datos** | **Ficticios.** El profesor valida con datos de prueba |
| **Tiempo disponible** | **7 días** desde el 23-nov-2026 |

### 5.5 Equipo
- **Grupo:** Python (6 integrantes)

---

## 6. Usuarios y roles

| Rol | Área | Qué puede hacer |
|---|---|---|
| **Visitante** *(sin cuenta)* | Pública | Ver el resumen de cifras |
| **Administrador** | Privada | Todo lo del inspector + crear y desactivar usuarios |
| **Inspector** | Privada | Registrar y editar edificaciones, inspecciones y personas; consultar con filtros; exportar PDF de cualquier edificación |

- No hay auto-registro: las cuentas las crea el Administrador
- El primer Administrador se crea con un script de carga inicial

---

## 7. Flujo principal

1. **Identificar la edificación:** el inspector busca la edificación por código catastral. Si existe, la reutiliza; si no, la crea con sus datos básicos y su cobertura
2. **Registrar la inspección:** fecha y hora, color de sticker y observaciones. El inspector queda registrado automáticamente
3. **Registrar a los ocupantes:** agrega, edita o retira las personas asociadas a la edificación
4. **Reinspección:** cuando se vuelve a visitar la edificación se registra una **nueva inspección**; la anterior se conserva en el historial
5. **Consultar:** el personal filtra edificaciones y abre su ficha
6. **Exportar:** desde la ficha genera el PDF de la edificación
7. **Área pública:** las cifras se recalculan a partir de los datos registrados

---

## 8. Datos a registrar

### 8.1 Edificación
| Campo | Tipo / valores | Obligatorio |
|---|---|---|
| Código catastral | Texto, **único** | Sí |
| Dirección | Texto | Sí |
| Comuna | Catálogo de comunas de Cali (1–22) + "Rural" | Sí |
| Barrio | Texto | Sí |
| Sector / uso | Vivienda · Comercial · Salud · Educación · Infraestructura · Logística y suministros · Economía (sección 9.1) | Sí |
| Número de pisos | Entero ≥ 1 | Sí |
| Asegurada | Sí / No | Sí (por defecto No) |
| Con hipoteca | Sí / No | Sí (por defecto No) |
| Con leasing | Sí / No | Sí (por defecto No) |

### 8.2 Inspección
| Campo | Tipo / valores | Obligatorio |
|---|---|---|
| Edificación | Referencia | Sí |
| Fecha y hora | Fecha-hora | Sí |
| Color de sticker | 🟢 Verde (sin restricción) · 🟡 Amarillo (uso restringido) · 🔴 Rojo (inseguro) | Sí |
| Observaciones | Texto libre | No |
| Inspector | Usuario autenticado (automático) | Sí |

### 8.3 Persona ocupante
| Campo | Tipo / valores | Obligatorio |
|---|---|---|
| Edificación | Referencia | Sí |
| Nombres y apellidos | Texto | Sí |
| Tipo de documento | Cédula de ciudadanía · Tarjeta de identidad · Registro civil · Cédula de extranjería · Pasaporte · Sin documento | Sí |
| Número de documento | Texto (vacío si "Sin documento") | Condicional |
| Vínculo | Propietario · Arrendatario | Sí |
| Fecha de nacimiento | Fecha → el sistema calcula **edad** y **rango etario** | Sí |
| Condición especial | Selección múltiple: Discapacidad · Persona vulnerable · Necesidad especial · Ninguna | Sí (por defecto Ninguna) |
| Tipo de población | Civil · Militar · Carcelaria | Sí (por defecto Civil) |

**Rangos etarios** (mutuamente excluyentes, calculados):

| Rango | Edades |
|---|---|
| Niños menores de 10 | 0–9 |
| Niños y adolescentes | 10–17 |
| Adultos | 18–59 |
| Adultos mayores | 60 o más |

---

## 9. Requisitos del profesor (tablero de clase) y cómo se cubren

| Requisito del tablero | Cómo se cubre |
|---|---|
| **9.1 Sectores:** Economía · Salud · Infraestructura · Educación · Logística y suministros · Vivienda (vivienda / comercial) | Campo "Sector / uso" de la edificación (8.1); Vivienda se divide en Vivienda y Comercial |
| **9.2 Tenencia y cobertura:** propietarios, arrendatarios; asegurada / no asegurada, hipoteca, leasing | Vínculo de la persona (8.3) y tres casillas independientes en la edificación (8.1) |
| **9.3 Rangos etarios:** < 10, > 10, ≥ 18, ≥ 60 | Rango calculado desde la fecha de nacimiento (8.3) |
| **9.4 Condiciones:** discapacidad, vulnerable, necesidad especial | Condición especial de selección múltiple (8.3) |
| **9.5 Tipo de población:** civil, militar, carcelaria | Atributo de la **persona** (8.3) |
| **9.6 Área pública y privada** | Sección 4.2 |
| **9.7 Herramientas:** Markdown, YAML, Git | Sección 5.3 |

---

## 10. Reglas de negocio
- **RN-01** El código catastral es único: no se crean dos edificaciones con el mismo código
- **RN-02** Una edificación puede tener **varias inspecciones**. La clasificación **vigente** es la de la inspección con fecha más reciente; el historial no se sobrescribe ni se borra
- **RN-03** El sticker solo cambia registrando una **nueva inspección**
- **RN-04** Toda inspección guarda el inspector y la fecha-hora
- **RN-05** Las personas se asocian a la **edificación**, no a cada inspección. Se editan cuando cambian los ocupantes
- **RN-06** Dentro de una misma edificación no se repite una persona: se compara por tipo y número de documento; si es "Sin documento", por nombre completo + fecha de nacimiento
- **RN-07** La edad y el rango etario se **calculan**; no se digitan
- **RN-08** Asegurada, hipoteca y leasing son **independientes** (una edificación puede tener varias a la vez)
- **RN-09** El área pública **solo** devuelve cifras agregadas: nunca nombres, documentos, direcciones ni códigos catastrales
- **RN-10** Todo el área privada exige autenticación; las acciones de administración de usuarios exigen rol Administrador, validado en el backend
- **RN-11** El PDF solo lo genera un usuario autenticado e incluye la fecha de generación y el usuario que lo generó
- **RN-12** En producción solo hay **datos ficticios**. El sistema muestra un aviso visible de "datos ficticios con fines académicos" y no usa logos de la Alcaldía, la UNGRD ni el IDIGER

---

## 11. Consulta, cifras y PDF

### 11.1 Área pública — resumen de cifras
- Total de edificaciones inspeccionadas
- Edificaciones por color de sticker vigente
- Edificaciones por comuna
- Personas por rango etario
- Fecha y hora de la última actualización
- Aviso de datos ficticios

### 11.2 Área privada — consulta con filtros
Filtros **combinables** (todos se cumplen a la vez):

| Grupo | Filtros |
|---|---|
| Ubicación | Comuna, barrio, código catastral |
| Inspección | Color de sticker vigente, rango de fechas de la última inspección |
| Edificación | Sector / uso |
| Cobertura | Asegurada, con hipoteca, con leasing |
| Personas | Vínculo, rango etario, condición especial, tipo de población (la edificación cumple si **al menos una** de sus personas cumple) |

Resultados en tabla con **paginación y conteo total**.

### 11.3 Ficha y PDF de la edificación
Reporte propio (no replica el formulario IDIGER) con:
- Datos de la edificación y cobertura
- Sticker vigente e **historial de inspecciones** (fecha, inspector, color, observaciones)
- Personas ocupantes (nombre, documento, vínculo, edad, rango, condición, tipo de población)
- Fecha-hora de generación y usuario que lo generó

---

## 12. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Backend | **Python + FastAPI** | Exigencia del profesor; OpenAPI automático; ya conocido por el equipo |
| Base de datos | **PostgreSQL (Supabase)** | Relaciones edificación–inspección–persona; consultas con filtros |
| Autenticación | **Supabase Auth** | Evita construir el login y el manejo de contraseñas; el backend valida el JWT y el rol |
| Frontend | **React + Vite** | Mismo stack del proyecto previo; diseño responsive (sirve en celular, sin modo offline) |
| PDF | Librería Python (ReportLab o WeasyPrint; se decide en ARCHITECTURE) | Generación en el backend |
| Despliegue | **Vercel** (frontend) + **Render** (backend) + **Supabase** (BD y Auth) | Capa gratuita; esquema ya probado por el equipo |

> Supabase **no** ejecuta la lógica de negocio (sus Edge Functions no son Python). Toda la lógica va en FastAPI. No se usa Supabase Storage: no hay fotos.

### 12.1 Límites de la capa gratuita
| Servicio | Límite relevante | Mitigación |
|---|---|---|
| **Render** | Se duerme tras 15 min sin tráfico; tarda ≈ 1 min en despertar | Despertarlo antes de la demo; indicador de carga en el frontend |
| **Render Postgres** | Expira a los 30 días | **No se usa**; la BD va en Supabase |
| **Supabase** | 500 MB de BD; se pausa tras 7 días sin actividad | Volumen muy inferior al límite; verificar que esté activo antes de entregar |
| **Vercel Hobby** | Una cuenta personal, sin colaboración | Un integrante administra el despliegue |

---

## 13. Componente algorítmico (mínimo, documentado)
Se documenta en `specs/arch/ALGORITHMS.md` el análisis de complejidad de dos operaciones reales del sistema, sin benchmarks:

| Operación | Técnica | Complejidad |
|---|---|---|
| Evitar duplicados de edificación (RN-01) y de persona (RN-06) | Índice único / búsqueda por clave hash (código catastral; documento o nombre + fecha) | O(1) promedio por búsqueda frente a O(n) de recorrer la lista |
| Calcular el rango etario (RN-07) y agregar las cifras públicas (11.1) | Cálculo directo por persona + agregación con `GROUP BY` | O(1) por persona; O(n) por agregación completa |

---

## 14. Restricciones y fuera de alcance

**Restricciones**
- Entrega el **30-nov-2026** desplegada en producción, en capa gratuita y con backend en Python
- Solo datos ficticios, en producción y en el repositorio. El repositorio es **público**: las credenciales de demostración se entregan por un canal privado
- El sistema no emite stickers oficiales ni reemplaza el dictamen del profesional

**Fuera de alcance** (estaba en v0.5 y se retira)
- Evaluación en detalle del formulario IDIGER: evaluaciones A–E, clasificación global, daños estructurales y no estructurales, condiciones preexistentes, recomendaciones, croquis
- Campos y catálogos ampliados del RUFE: género, etnia, parentesco, hogar, alojamiento actual, estado declarado del bien, estado tras el sismo
- Estados de validación de la inspección y flujo de estudios técnicos
- Registro de demolición
- Rol Consulta
- Reportes adicionales, exportación CSV/Excel, fotos
- Benchmarks y algoritmos adicionales (cola de prioridad, clustering)
- Captura offline, notificaciones, integración con RUD/UNGRD/catastro
- Ocultar o agrupar conteos bajos en el área pública

### 14.1 Hitos
| Fecha | Hito |
|---|---|
| 23 nov | BRIEF v1.0, PRD, ARCHITECTURE y TASKS |
| 24 nov | **Esqueleto desplegado en producción** (frontend, backend y BD conectados) + autenticación |
| 25 – 26 nov | Registro de edificaciones, inspecciones y personas; área pública |
| 27 nov | Consulta con filtros y PDF |
| 28 nov | Generador de datos ficticios, pruebas, documento de algoritmos |
| 29 nov | Congelamiento; verificar que producción esté activa |
| **30 nov** | **Entrega** |

---

## 15. Estructura de carpetas
```
earthquake-damage-registry/
  specs/
    BRIEF.md · PRD.md · ARCHITECTURE.md · DESIGN.md · TASKS.md · DECISIONS.md
    arch/      ← DATA-MODEL, API, AUTH, INFRA, ALGORITHMS
    prd/       ← MOD-XX.md
    tasks/     ← FASE-XX.md
  frontend/
  backend/
  CLAUDE.md
  README.md
```

---

## 16. Convenciones
| Aspecto | Convención |
|---|---|
| Idioma — documentación, comentarios y commits | Español |
| Idioma — código | Inglés |
| Nomenclatura backend | snake_case |
| Nomenclatura frontend | camelCase (variables/funciones), PascalCase (componentes) |
| Estilo | Black + Flake8 (backend) · ESLint + Prettier (frontend) |
| Control de versiones | Una rama por tarea, PR a `main` |

---

## 17. Supuestos y pendientes

### Supuestos
- **S-01** "Localidad" del formulario de Bogotá se adapta a **comuna** de Cali
- **S-02** El alcance es la ciudad de Cali
- **S-03** "UDGR" del tablero = Unidad de Gestión del Riesgo; no genera un campo propio
- **S-04** El catálogo de tipo de documento es una versión reducida del RUFE
- **S-05** La capa gratuita es suficiente para la entrega y la sustentación

### Pendientes (no bloquean el PRD)
| ID | Pendiente | Responsable |
|---|---|---|
| **P-01** | Entregables además del aplicativo (sustentación, informe) | Equipo, con el profesor |
| **P-02** | Integrante dueño de las cuentas de Vercel, Render y Supabase | Equipo |
| **P-03** | Si la demo se hace sobre producción, quién la "despierta" antes | Equipo |

---

## 18. Referencias
| Fuente | Uso |
|---|---|
| Reporte Oficial #050 "Cifras de gestión — Sismo en Cali", 16-oct-2026, Alcaldía de Cali | Cifras de referencia por sticker |
| Circular N.° 73 UNGRD (20-ago-2026) | Metodología de inspección en dos fases |
| Alcaldía de Cali — "¿Qué significan los stickers en las fachadas?" (25-ago-2026) | Significado y reglas del sticker |
| ATC-20 Rapid Evaluation Safety Assessment Form | Inspección rápida |
| RUFE, UNGRD, FR-1703-SMD-69 v01 | Catálogo de tipo de documento (reducido) |
| Tablero de clase (foto, 21-oct-2026) | Requisitos del profesor |
| BRIEF v0.5 (historial de Git) | Análisis completo del IDIGER y el RUFE, por si se retoma el alcance ampliado |
