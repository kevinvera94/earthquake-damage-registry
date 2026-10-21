# BRIEF.md
> Fuente de verdad del proyecto. Agnóstico a la herramienta.
> Todos los agentes y archivos de configuración deben referenciar este documento.
> Versión: **v0.1 (borrador para validación)**
> Última actualización: 2026-10-21

---

## 1. Nombre del proyecto
**earthquake-damage-registry** (repositorio: https://github.com/kevinvera94/earthquake-damage-registry)

---

## 2. Descripción
Aplicativo web para **registrar y consultar las inspecciones de edificaciones** que realiza la Secretaría de Gestión del Riesgo de Emergencias y Desastres de Santiago de Cali tras el sismo del **10 de agosto de 2026**. Cada inspección documenta el estado de la edificación (habitabilidad, daños, entorno), su clasificación con sticker (verde / amarillo / rojo) y **las personas que se encontraban en ella** (propietarios y arrendatarios), junto con la condición de aseguramiento del inmueble.

El sistema es la contraparte digital del formulario de inspección en papel y alimenta indicadores equivalentes a los del Reporte Oficial de cifras de gestión de la Alcaldía.

---

## 3. Problema que resuelve
La inspección de miles de edificaciones se apoya en formularios y stickers físicos. Esto dificulta:
- Consolidar en un solo lugar el estado de cada edificación y su historial de inspecciones/reinspecciones
- Relacionar la edificación con las **personas afectadas** (propietarios, arrendatarios, población vulnerable) y con su **cobertura de seguros**
- Generar indicadores oficiales (edificaciones caracterizadas, stickers por color, demoliciones, damnificados) sin consolidación manual
- Priorizar qué edificaciones inspeccionar o reinspeccionar primero

**Magnitud de referencia (Reporte Oficial #050, corte 16-oct-2026):** 6.043 edificaciones caracterizadas, 45.138 familias reportadas como damnificadas (RUD) y todavía existen edificaciones pendientes de revisión.

---

## 4. Contexto

### 4.1 Evento y respuesta institucional
- **Evento:** sismo del 10 de agosto de 2026 que afectó a Cali
- **Entidad responsable de las inspecciones:** Secretaría de Gestión del Riesgo de Emergencias y Desastres (Alcaldía de Santiago de Cali)
- **Lineamientos nacionales:** UNGRD — Circular N.° 73 del 20-ago-2026, que unifica la metodología de evaluación en **dos fases**:
  1. **Inspección rápida** (protocolo **ATC-20**) → instalación de sticker de tres colores
  2. **Evaluación en detalle** → toma como base el **formulario de inspección de edificaciones del IDIGER** (Bogotá, derivado del formulario AIS 2002), dirigida principalmente a edificaciones con sticker amarillo o rojo
- **Fase de la emergencia:** desde el reporte #050 la Alcaldía pasó a la **fase 2 (estabilización y recuperación)** y reporta por tres frentes: infraestructura, atención humanitaria y atención hospitalaria

> **Hallazgo clave:** no se encontró un formulario propio y público de la Secretaría de Cali. Lo que sí está documentado es que la evaluación en detalle se basa en el formulario del IDIGER, por lo que **el formulario de Bogotá es la base válida** para este proyecto. Para la fase de inspección rápida se usa el formulario ATC-20 (Rapid Evaluation Safety Assessment Form), que es de uso libre no comercial.

### 4.2 Alcance del aplicativo
El aplicativo cubre el **registro de la inspección** (ambas fases) y los datos asociados exigidos por el profesor. **No** cubre atención humanitaria, hospitalaria ni integración con el RUD (ver sección 17).

---

## 5. Contexto académico

### 5.1 Curso
Proyecto de la clase de **Análisis de Algoritmos**. El profesor definió que debe tenerse en cuenta en el aplicativo todo el contenido del lado izquierdo del tablero (ver sección 10).

### 5.2 Escala de evaluación entre grupos
Los proyectos se comparan entre grupos; el mejor obtiene la nota máxima:

| Posición | Nota |
|---|---|
| 1.° | 5.0 |
| 2.° | 4.0 |
| 3.° | 3.0 |
| 4.° | 2.9 |

> Implicación: el proyecto se evalúa **de forma relativa**. Importa la completitud frente a los requisitos del profesor y la calidad del resultado frente a los otros grupos.

### 5.3 Herramientas exigidas
| Herramienta | Uso esperado en el proyecto |
|---|---|
| **Markdown** | Toda la documentación SDD (`specs/`) |
| **YAML** | Configuración: pipelines CI, despliegue, contenedores, definiciones de catálogos (si aplica) |
| **Git** | Control de versiones, commits descriptivos, ramas por tarea |

### 5.4 Equipo
- **Grupo:** Python (6 integrantes)
- El tablero rotula a este grupo con **Python**, lo que sugiere que el backend se espera en ese lenguaje (ver sección 14)

---

## 6. Usuarios del sistema (Actores y Roles)

### 6.1 Actores
| Actor | Rol en el proceso |
|---|---|
| **Profesional evaluador (inspector)** | Profesional adscrito a la Secretaría o voluntario acreditado en el Registro Único de Profesionales Evaluadores. Realiza la inspección en campo, diligencia el formulario e instala el sticker. El protocolo UNGRD los clasifica de P1 a P8 |
| **Coordinación de Gestión del Riesgo** | Asigna y prioriza inspecciones, revisa resultados, programa reinspecciones, consolida indicadores |
| **Propietario / Arrendatario** | Ocupantes de la edificación. Se registran como parte de la inspección (no operan el sistema en el MVP) |
| **Aseguradora / copropiedad** | En sticker amarillo/rojo, remiten estudios técnicos particulares para reevaluación. Se registran como dato asociado a la edificación |

### 6.2 Roles en el sistema *(propuesta)*
| Rol | Responsabilidad |
|---|---|
| **Administrador** | Gestiona usuarios y catálogos, asigna inspecciones, valida/cierra inspecciones, programa reinspecciones, consulta todos los reportes |
| **Inspector** | Registra inspecciones y ocupantes de las edificaciones que visita; consulta sus propios registros |
| **Consulta** | Solo lectura de edificaciones, inspecciones e indicadores (p. ej. analista o directivo) |

> **Regla del dominio:** solo personal autorizado de la Secretaría puede cambiar o retirar un sticker; el cambio solo procede tras una **nueva evaluación**. El sistema debe reflejarlo: la clasificación vigente solo cambia mediante una nueva inspección registrada.

---

## 7. Flujo del proceso de inspección

### ETAPA 1 — Identificación de la edificación
1. El inspector ubica la edificación y registra su **identificación catastral** (localidad/comuna, barrio, manzana, predio, construcción) y dirección
2. Si la edificación ya existe en el sistema, se reutiliza el registro (no se duplica)

### ETAPA 2 — Inspección rápida (ATC-20)
3. El inspector realiza la inspección visual y define la clasificación: **Verde (sin restricción) / Amarillo (uso restringido) / Rojo (inseguro)**
4. Registra los **ocupantes** presentes (propietarios y arrendatarios) y la condición de aseguramiento
5. Se instala el sticker (con logo UNGRD y firma del profesional)

### ETAPA 3 — Evaluación en detalle (formulario IDIGER)
6. Para edificaciones con sticker amarillo o rojo, o remitidas desde la fase 1, el inspector diligencia el **formulario completo** (sección 9)
7. El sistema calcula la **clasificación global** = la más crítica entre las evaluaciones A a E

### ETAPA 4 — Reevaluación
8. Para sticker amarillo/rojo, el propietario, la copropiedad o la aseguradora remite estudios técnicos a la Secretaría
9. La Secretaría programa una **reinspección**; si procede, el sticker cambia y se conserva el historial

### ETAPA 5 — Demolición (si aplica)
10. Una edificación no se demuele automáticamente. Solo cuando no es técnicamente viable recuperarla y representa riesgo para la vida
11. El sistema registra: concepto de demolición aprobado → edificación demolida → escombros retirados

---

## 8. Clasificaciones y estados

### 8.1 Habitabilidad
| Origen | Niveles |
|---|---|
| **Sticker (Cali / ATC-20)** | 🟢 Verde: sin restricción · 🟡 Amarillo: uso restringido · 🔴 Rojo: inseguro |
| **Formulario IDIGER** | 1 Habitable (verde) · 2 Uso restringido (amarillo) · 3 No habitable (naranja) · 4 Peligro de colapso (rojo) |

> ⚠️ **Discrepancia por resolver:** el formulario tiene 4 niveles y el sticker de Cali 3. Se propone guardar **ambos**: el nivel detallado del formulario y el color final del sticker, con una tabla de equivalencia (ver pregunta abierta Q-03).

### 8.2 Estados de la inspección *(propuesta)*
```
Pendiente → En inspección → Inspección registrada → Validada
                                  ↓
                  Reinspección solicitada → Reinspeccionada
```

### 8.3 Estados de la edificación
`Sin inspeccionar` → `Inspeccionada (verde | amarillo | rojo)` → `Con concepto de demolición` → `Demolida` → `Escombros retirados`

---

## 9. Datos a registrar — Formulario de inspección

Basado en el **Formulario para Inspección de Edificaciones Después de un Sismo (IDIGER/AIS)**, 2 páginas.

### 9.1 Identificación y tipo de inspección
| Campo | Detalle |
|---|---|
| Identificación catastral | Localidad, barrio, manzana, predio, construcción, código catastral |
| Número de formulario | Consecutivo |
| Tipo de inspección | Completa · Parcial · Exterior solamente |
| Clasificación de habitabilidad | Habitable · Uso restringido · No habitable · Peligro de colapso |

### 9.2 Identificación y descripción de la edificación
| Campo | Detalle |
|---|---|
| Dirección, nombre de la edificación | Texto |
| Uso predominante | 1 Residencial · 2 Comercial · 3 Educacional · 4 Salud · 5 Hotelero · 6 Oficinas · 7 Industrial · 8 Institucional · 9 Bodegas · 10 Estacionamientos · 11 Otros (de la edificación y de la planta baja) |
| Número de pisos | Niveles sobre el terreno y sótanos |
| Dimensiones aproximadas | Frente y fondo (m) |
| Sistema estructural | Concreto reforzado (pórtico, muros, duales, prefabricados) · Mampostería (confinada, reforzada, no reforzada) · Acero · Madera · Bahareque/tapia · Mixta · Precario · Otros |
| Tipo de entrepiso | Placa maciza, aligerada, reticular celular, lámina colaborante, vigas, cerchas, madera, mixta, otros |
| Período de construcción | Antes de 1960 · 1960–1985 · 1986–1999 · 2000–2011 · desde 2012 |

### 9.3 Estado de la edificación (evaluaciones A–E)
| Bloque | Contenido | Clasificación |
|---|---|---|
| **Estado general** | Colapso (no/parcial/total), desviación o inclinación, falla de cimentación | **A** |
| **Problemas geotécnicos** | Falla en talud, asentamiento/licuación, grietas en terreno | **B** |
| **Elementos no estructurales** | Ítems 7–17 (fachadas, vidrios, acabados, divisorios, balcones, cielo rasos, cubierta, escaleras, instalaciones —acueducto, red sanitaria, energía, gas—, ductos, tanques) con grado de daño 1 Ninguno a 5 Severo | **C** |
| **Elementos estructurales** (piso más afectado) | Columnas/muros portantes, vigas, nudos, entrepisos: % por grado (Ninguno/Leve/Moderado/Fuerte/Severo), la suma por elemento debe ser **100 %** | **D** |
| **Problemas del entorno** | Edificio/infraestructura vecina crítica, evento adverso inminente | **E** |
| **Clasificación global** | La más crítica entre A y E + % de área afectada sobre el área construida | — |

### 9.4 Recomendaciones, condiciones y cierre
| Bloque | Contenido |
|---|---|
| Recomendaciones y medidas de seguridad | Visita especializada (estructural, geotécnica, servicios públicos); intervención de entidades (Alcaldía local, Policía/Ejército, Tránsito, Bomberos); medidas (restringir paso, evacuar parcial/total, apuntalar, remover elementos, desconectar energía/gas/agua, etc.) |
| Esquema | Croquis de la edificación |
| Condiciones pre-existentes | Calidad de construcción, posición en la manzana, configuración (planta/altura/estructural), tipo de suelo, cimentación, topografía, cubierta, columna corta, continuidad, anclajes, daños previos, reparaciones y reforzamiento |
| Efecto en los ocupantes | Hubo muertos/heridos; número de fallecidos, heridos y afectados |
| Ocupación | Habitada al momento de la evaluación; número de ocupantes; unidades residenciales/comerciales existentes y calificadas “no habitables” |
| Persona de contacto | Nombre, teléfono, email |
| Comentarios | Texto libre |
| Inspectores | Código y nombre del líder, número de evaluadores, otro inspector, firma |
| Fecha de inspección | Día, mes, año, hora (24 h) |

---

## 10. Requisitos del profesor (tablero de clase)

Transcripción e interpretación del lado izquierdo del tablero, que **debe reflejarse en el aplicativo**:

### 10.1 Sectores afectados
**Economía · Salud · Infraestructura · Educación · Logística y suministros · Vivienda**

- **Vivienda** se subdivide en **vivienda** y **comercial**, y se asocia a la **UGR** (Unidad de Gestión del Riesgo) *(interpretación del rótulo “UDGR” — confirmar)*
- **Aseguradoras** aparecen como actor relacionado con los sectores

### 10.2 Tenencia y cobertura de la edificación
Esquema del tablero: una edificación se relaciona con **propietarios** y **arrendatarios**, y puede estar:

| Condición | Detalle |
|---|---|
| **Asegurada** | Con póliza (se debe poder asociar la aseguradora) |
| **Hipoteca** | Con gravamen hipotecario |
| **No asegurada** | Sin póliza |
| **Leasing** | Bajo contrato de arrendamiento financiero |

### 10.3 Personas presentes en la edificación
Se registran tanto **propietarios como arrendatarios**, con estas categorías:

| Categoría | Detalle |
|---|---|
| Niños | Menores de 10 años y mayores de 10 años |
| Adultos | ≥ 18 años y ≥ 60 años |
| Personas con discapacidad | — |
| Personas vulnerables | — |
| Personas con necesidades especiales | — |

### 10.4 Tipo de población
**Civil · Militar · Carcelaria**

> Esto implica que la edificación (o sus ocupantes) puede pertenecer a un contexto institucional distinto al residencial común. Ver pregunta Q-05.

---

## 11. Reglas de negocio clave
- Una edificación tiene **una identificación catastral única**; puede tener varias inspecciones en el tiempo
- La clasificación **vigente** de una edificación es la de su **última inspección validada**; el historial nunca se sobrescribe
- La clasificación global del formulario es **la más crítica entre las evaluaciones A a E** (se calcula, no se digita)
- En daños estructurales, la suma de porcentajes por elemento debe ser **100 %**
- El cambio de sticker solo ocurre mediante una **nueva inspección** registrada por personal autorizado
- Toda inspección identifica al inspector (código/nombre) y fecha-hora
- Los ocupantes se asocian a la **inspección** (foto del momento) y a la edificación
- Un ocupante es **propietario o arrendatario** (una persona puede tener ambos vínculos con inmuebles distintos)
- Si el sticker es amarillo o rojo, el sistema permite registrar la **recepción de estudios técnicos** y programar la **reinspección**
- Una edificación con concepto de demolición **no** se considera demolida hasta que se registre la demolición
- Datos personales de ocupantes: recolectar solo lo estrictamente necesario (Ley 1581 de 2012, habeas data)

---

## 12. Indicadores y reportes
Basados en el **Reporte Oficial #050** de la Alcaldía de Cali (frente *Infraestructura*, que es el que este aplicativo puede alimentar):

| Indicador | Valor de referencia (16-oct-2026) |
|---|---|
| Total de edificaciones caracterizadas | 6.043 |
| Stickers instalados — rojo (inseguro) | 1.651 |
| Stickers instalados — amarillo (uso restringido) | 2.288 |
| Stickers instalados — verde (sin restricción) | 2.104 |
| Edificaciones con concepto de demolición aprobado por CDGRD | 69 |
| Edificaciones demolidas | 5 |
| Puntos de demolición con escombros retirados | 2 |

> Control: 1.651 + 2.288 + 2.104 = 6.043. El PDF mezcla los números y las etiquetas en la maquetación; la asignación por color debe verificarse contra el documento original (Q-07).

**Reportes adicionales sugeridos por los requisitos del profesor:**
- Edificaciones por clasificación, sector, uso y tenencia/cobertura (asegurada, hipoteca, no asegurada, leasing)
- Personas afectadas por categoría (niños, adultos mayores, discapacidad, vulnerables, necesidades especiales)
- Personas por tipo de población (civil, militar, carcelaria)
- Edificaciones por comuna/barrio
- Edificaciones pendientes de inspección o reinspección
- Historial completo por edificación

---

## 13. Componente algorítmico *(propuesta — por validar)*
La materia es **Análisis de Algoritmos**, por lo que además de la funcionalidad conviene que el proyecto **demuestre decisiones algorítmicas analizables**. Candidatos:

| Problema del dominio | Algoritmo / técnica | Qué se puede analizar |
|---|---|---|
| Priorizar la cola de inspecciones/reinspecciones | Puntaje de prioridad + cola de prioridad (heap) | Complejidad O(log n) por inserción/extracción |
| Buscar y ordenar edificaciones/personas | Índices, búsqueda binaria, ordenamientos | Comparar O(n) vs O(log n) con datos de 6.000+ registros |
| Agrupar edificaciones por zona | Clustering geográfico o agrupación por barrio/manzana | Complejidad vs. calidad del resultado |
| Calcular clasificación global y validar sumas | Reducción sobre evaluaciones A–E | O(1) por formulario |
| Detectar duplicados de edificación | Hashing por código catastral / normalización de direcciones | O(1) promedio |

> Pendiente: confirmar con el profesor si se evaluará el análisis de complejidad explícitamente (Q-01). Es el principal riesgo de **no** alinear el proyecto con la materia.

---

## 14. Stack tecnológico *(tentativo — se decide en ARCHITECTURE.md / DECISIONS.md)*

| Capa | Opción propuesta | Justificación |
|---|---|---|
| Backend | **Python + FastAPI** | El grupo está rotulado “Python”; tipado con Pydantic; OpenAPI automático |
| Base de datos | **PostgreSQL** | Relaciones entre edificación, inspección, ocupantes y seguros; consultas de reporte |
| Frontend | **React + Vite** | Formularios largos con validación; mismo stack que el proyecto anterior |
| Autenticación | Supabase Auth *(o JWT propio)* | Reduce desarrollo; decidir según costo/complejidad |
| Almacenamiento | Supabase Storage | Fotos y esquema de la edificación |
| Despliegue | Vercel (frontend) + Render (backend) | Capa gratuita para el MVP |

> Debe poder usarse **en campo**: considerar diseño *mobile-first* y, a futuro, captura offline (ver Q-08).

---

## 15. Estructura de carpetas (tentativa)
```
earthquake-damage-registry/
  specs/
    BRIEF.md
    PRD.md
    ARCHITECTURE.md
    DESIGN.md
    TASKS.md
    DECISIONS.md
    arch/      ← DATA-MODEL, API, AUTH, INFRA, ENUMS, RNF
    prd/       ← MOD-XX.md (un archivo por módulo)
    tasks/     ← FASE-XX.md (un archivo por fase)
  frontend/
  backend/
  CLAUDE.md
  README.md
```

---

## 16. Convenciones

| Aspecto | Convención |
|---|---|
| Idioma — documentación y specs | Español |
| Idioma — código, variables, funciones | Inglés |
| Idioma — commits | Español |
| Nomenclatura backend | snake_case (Python) |
| Nomenclatura frontend | camelCase para variables/funciones, PascalCase para componentes |
| Estilo código backend | Black + Flake8 |
| Estilo código frontend | ESLint + Prettier |
| Documentación | Markdown; configuración en YAML |
| Control de versiones | Git — una rama por tarea, commits descriptivos en español |

---

## 17. Restricciones y fuera de alcance

**Restricciones**
- Proyecto académico con plazo definido por el curso *(fecha de entrega por confirmar — Q-02)*
- El formulario es de uso institucional: el sistema **no** emite stickers oficiales ni reemplaza el dictamen técnico del profesional
- Datos personales: mínimo necesario y acceso restringido por rol

**Fuera del alcance del MVP**
- Atención humanitaria (RUD, alojamientos, ayudas) y atención hospitalaria
- Integración con sistemas oficiales (RUD, UNGRD, catastro)
- Captura offline y geolocalización avanzada *(a evaluar)*
- Generación de stickers imprimibles con validez oficial

---

## 18. Supuestos y preguntas abiertas

### Supuestos tomados en este borrador
- **S-01** Se usa el formulario IDIGER como base de la evaluación en detalle (respaldado por la Circular 73 de la UNGRD)
- **S-02** En Cali “localidad” del formulario de Bogotá se adapta a **comuna**
- **S-03** El alcance es la ciudad de Cali (el enunciado habla de Colombia en general)
- **S-04** El rótulo “UDGR” del tablero = Unidad de Gestión del Riesgo
- **S-05** Los 6 “sectores” del tablero clasifican el tipo de afectación/edificación

### Preguntas para validar
| ID | Pregunta |
|---|---|
| **Q-01** | ¿El profesor evaluará explícitamente el análisis de complejidad algorítmica? ¿Qué algoritmos espera ver? |
| **Q-02** | ¿Cuál es la fecha de entrega y qué entregables se piden (código, documentación, sustentación)? |
| **Q-03** | ¿Se guarda la clasificación de 4 niveles del formulario **y** el color de sticker de 3 niveles, con tabla de equivalencia? |
| **Q-04** | ¿Se implementan ambas fases (inspección rápida y evaluación en detalle) o solo el formulario completo? |
| **Q-05** | “Civil / militar / carcelaria”: ¿es un atributo de la **edificación** (p. ej. un batallón o cárcel) o de las **personas**? |
| **Q-06** | “Asegurada / hipoteca / no asegurada / leasing”: ¿son excluyentes o una edificación puede estar asegurada **y** con hipoteca? |
| **Q-07** | Asignación exacta de cifras por color de sticker en el reporte (verificar contra el PDF original) |
| **Q-08** | ¿Se requiere uso en campo desde celular y/o modo offline? |
| **Q-09** | ¿Qué roles se necesitan realmente (Administrador / Inspector / Consulta)? |
| **Q-10** | ¿Se usa Supabase o autenticación propia? |

---

## 19. Referencias

| Fuente | Uso |
|---|---|
| Formulario para Inspección de Edificaciones Después de un Sismo — IDIGER / AIS (Bogotá), 2 pp. | Estructura de datos de la evaluación en detalle |
| Reporte Oficial #050 “Cifras de gestión — Sismo en Cali”, corte 16-oct-2026, Alcaldía de Cali | Indicadores y metodología de fase 2 |
| Circular N.° 73 UNGRD (20-ago-2026) — metodología unificada de evaluación de edificaciones | Dos fases; formulario IDIGER como base |
| Alcaldía de Cali — “¿Qué significan los stickers en las fachadas?” (25-ago-2026) y FAQ de stickers | Reglas de sticker, evaluadores P1–P8, reevaluación |
| ATC-20 Rapid / Detailed Evaluation Safety Assessment Forms — Applied Technology Council | Inspección rápida (uso libre no comercial) |
| Tablero de clase (foto, 21-oct-2026) | Requisitos del profesor, escala de evaluación, herramientas |
