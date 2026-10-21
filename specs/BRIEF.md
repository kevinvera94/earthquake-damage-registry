# BRIEF.md
> Fuente de verdad del proyecto. Agnóstico a la herramienta.
> Todos los agentes y archivos de configuración deben referenciar este documento.
> Versión: **v0.5 (borrador para validación)** — v0.2 agregó área pública/privada y registro de personas; v0.3 agregó plazo (30-nov-2026), capa gratuita y backend en Python; v0.4 aclara que en producción solo hay datos ficticios; v0.5 incorpora el formato oficial **RUFE** (UNGRD) que diligencian los afectados
> Última actualización: 2026-10-21

---

## 1. Nombre del proyecto
**earthquake-damage-registry** (repositorio: https://github.com/kevinvera94/earthquake-damage-registry)

---

## 2. Descripción
Aplicativo web para **registrar y consultar las inspecciones de edificaciones** que realiza la Secretaría de Gestión del Riesgo de Emergencias y Desastres de Santiago de Cali tras el sismo del **10 de agosto de 2026**. Cada inspección documenta el estado de la edificación (habitabilidad, daños, entorno), su clasificación con sticker (verde / amarillo / rojo) y **las personas que se encontraban en ella** (propietarios y arrendatarios), junto con la condición de aseguramiento del inmueble.

El sistema es la contraparte digital del formulario de inspección en papel y alimenta indicadores equivalentes a los del Reporte Oficial de cifras de gestión de la Alcaldía.

El aplicativo tiene **dos áreas**:
- **Área pública (sin inicio de sesión):** al ingresar muestra un **resumen de cifras** de consulta para que la ciudadanía conozca el estado general
- **Área privada (usuario y contraseña):** registro de inspecciones y de las personas asociadas a cada edificación, **consulta con filtros**, reportes y **exportación a PDF** de la información completa de una edificación

---

## 3. Problema que resuelve
La inspección de miles de edificaciones se apoya en formularios y stickers físicos. Esto dificulta:
- Consolidar en un solo lugar el estado de cada edificación y su historial de inspecciones/reinspecciones
- Relacionar la edificación con las **personas afectadas** (propietarios, arrendatarios, población vulnerable) y con su **cobertura de seguros**
- Generar indicadores oficiales (edificaciones caracterizadas, stickers por color, demoliciones, damnificados) sin consolidación manual
- Priorizar qué edificaciones inspeccionar o reinspeccionar primero
- Informar a la ciudadanía, de forma pública y actualizada, el estado general de las edificaciones
- Consultar y filtrar la información (por clasificación, zona, tipo de personas afectadas, cobertura de seguros, etc.) y entregar un reporte completo por edificación

**Magnitud de referencia (Reporte Oficial #050, corte 16-oct-2026):** 6.043 edificaciones caracterizadas, 45.138 familias reportadas como damnificadas (RUD) y todavía existen edificaciones pendientes de revisión.

---

## 4. Contexto

### 4.1 Evento y respuesta institucional
- **Evento:** sismo del 10 de agosto de 2026 que afectó a Cali
- **Entidad responsable de las inspecciones:** Secretaría de Gestión del Riesgo de Emergencias y Desastres (Alcaldía de Santiago de Cali)
- **Lineamientos nacionales:** UNGRD — Circular N.° 73 del 20-ago-2026, que unifica la metodología de evaluación en **dos fases**:
  1. **Inspección rápida** (protocolo **ATC-20**) → instalación de sticker de tres colores
  2. **Evaluación en detalle** → toma como base el **formulario de inspección de edificaciones del IDIGER** (Bogotá, derivado del formulario AIS 2002), dirigida principalmente a edificaciones con sticker amarillo o rojo
- **Registro de afectados:** las familias damnificadas diligencian el **RUFE** (Registro Unifamiliar de Emergencias, UNGRD, formato FR-1703-SMD-69, versión 01), que alimenta el RUD. Es el formato real que llenó una persona afectada en Cali y la mejor referencia para el **registro de personas** de este aplicativo (ver sección 10.6)
- **Fase de la emergencia:** desde el reporte #050 la Alcaldía pasó a la **fase 2 (estabilización y recuperación)** y reporta por tres frentes: infraestructura, atención humanitaria y atención hospitalaria

> **Hallazgo clave:** no se encontró un formulario propio y público de la Secretaría de Cali. Lo que sí está documentado es que la evaluación en detalle se basa en el formulario del IDIGER, por lo que **el formulario de Bogotá es la base válida** para este proyecto. Para la fase de inspección rápida se usa el formulario ATC-20 (Rapid Evaluation Safety Assessment Form), que es de uso libre no comercial.

### 4.2 Alcance del aplicativo
El aplicativo cubre el **registro de la inspección** (ambas fases), el **registro de las personas asociadas a cada edificación** y su **cobertura** (seguros, hipoteca, leasing), la **consulta y los reportes**, y una **vista pública de cifras**. **No** cubre atención humanitaria, hospitalaria ni integración con el RUD (ver sección 17).

### 4.3 Áreas del sistema: pública y privada
El profesor exige que el aplicativo tenga una parte pública y una privada.

| | **Área pública** | **Área privada** |
|---|---|---|
| **Acceso** | Libre, sin inicio de sesión. Es la **página de entrada** | Usuario y contraseña |
| **Para quién** | Ciudadanía en general | Personal autorizado (administrador, inspectores, consulta) |
| **Qué ofrece** | Resumen de cifras del estado general, solo de consulta | Registro de inspecciones, registro de personas, consulta con filtros, reportes y exportación a PDF por edificación |
| **Datos que ve** | **Solo cifras agregadas**; nunca datos personales ni de una edificación identificable | Información detallada según el rol |

> **Regla clave:** el área pública no devuelve información de personas ni de edificaciones individuales. Más detalle en las secciones 11 y 12.

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

### 5.4 Plazo y condiciones de entrega
| Condición | Detalle |
|---|---|
| **Fecha límite** | **30 de noviembre de 2026** (lunes), a más tardar |
| **Estado de la entrega** | El aplicativo debe estar **desplegado en un ambiente de producción** |
| **Infraestructura** | **Capa gratuita** de los proveedores (ver sección 14.1) |
| **Backend** | Debe desarrollarse en **Python** (exigencia del profesor) |
| **Datos** | **Ficticios.** Aunque el ambiente es productivo, no se registra información real: el profesor validará la herramienta con datos de prueba |
| **Tiempo disponible** | ≈ 40 días desde el 21-oct-2026 (≈ 5,7 semanas) |

> **Implicación:** el alcance, la arquitectura y las tecnologías se eligen para **poder cumplirlos a tiempo**, no para cubrir todo lo posible. Se prioriza lo que el profesor exige (secciones 4.3, 10 y 12) y se deja lo demás como deseable (sección 17). Referencia interna: un proyecto previo con un stack similar se construyó y desplegó en ≈ 1,5 semanas.

### 5.5 Equipo
- **Grupo:** Python (6 integrantes)
- El tablero rotula a este grupo con **Python**: el profesor exige que el backend se desarrolle en ese lenguaje (ver 5.4 y sección 14)

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
| Rol | Área | Responsabilidad |
|---|---|---|
| **Visitante** *(no es un rol; no tiene cuenta)* | Pública | Consulta el resumen de cifras del estado general |
| **Administrador** | Privada | Gestiona usuarios y catálogos, asigna inspecciones, valida/cierra inspecciones, programa reinspecciones, consulta todos los reportes y exporta PDF |
| **Inspector** | Privada | Registra inspecciones y las personas asociadas a las edificaciones que visita; consulta sus propios registros y exporta el PDF de ellos |
| **Consulta** | Privada | Solo lectura de edificaciones, inspecciones, reportes e indicadores; puede filtrar y exportar (p. ej. analista o directivo) |

> Las cuentas del área privada **las crea el Administrador**; no hay registro público de usuarios *(supuesto S-07)*.

> **Regla del dominio:** solo personal autorizado de la Secretaría puede cambiar o retirar un sticker; el cambio solo procede tras una **nueva evaluación**. El sistema debe reflejarlo: la clasificación vigente solo cambia mediante una nueva inspección registrada.

---

## 7. Flujo del proceso de inspección

### ETAPA 1 — Identificación de la edificación
1. El inspector ubica la edificación y registra su **identificación catastral** (localidad/comuna, barrio, manzana, predio, construcción) y dirección
2. Si la edificación ya existe en el sistema, se reutiliza el registro (no se duplica)

### ETAPA 2 — Inspección rápida (ATC-20)
3. El inspector realiza la inspección visual y define la clasificación: **Verde (sin restricción) / Amarillo (uso restringido) / Rojo (inseguro)**
4. Registra las **personas asociadas a la edificación** (propietarios y arrendatarios, ver sección 10.3) y su **cobertura**: asegurada, hipoteca, leasing (ver sección 10.2)
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

### ETAPA 6 — Consulta, reportes y exportación
12. El personal autorizado consulta las edificaciones con **filtros combinables** (sección 12.2)
13. Desde la ficha de una edificación, exporta un **PDF con toda su información**: identificación, inspecciones, clasificación, personas asociadas, cobertura y demolición (sección 12.4)
14. En paralelo, el **área pública** muestra automáticamente las cifras agregadas (sección 12.1)

---

## 8. Clasificaciones y estados

### 8.1 Habitabilidad
| Origen | Niveles |
|---|---|
| **Sticker (Cali / ATC-20)** | 🟢 Verde: sin restricción · 🟡 Amarillo: uso restringido · 🔴 Rojo: inseguro |
| **Formulario IDIGER** | 1 Habitable (verde) · 2 Uso restringido (amarillo) · 3 No habitable (naranja) · 4 Peligro de colapso (rojo) |
| **RUFE — “Estado del bien”** *(lo declara la familia/CMGRD, no el inspector)* | Habitable · No habitable · Averiado · Destruido · No informa |

> El estado del RUFE es una **tercera clasificación**, declarada por el afectado y no técnica. No reemplaza la del inspector; si se registra, se guarda aparte como “estado declarado” (ver 10.6 y Q-19).

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
| Ubicación urbana o rural *(RUFE)* | Urbano · Rural; si es rural, **corregimiento** y **vereda/sector** (Cali tiene zona rural) |
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
Esquema del tablero: una edificación se relaciona con **propietarios** y **arrendatarios**, y se debe poder **categorizar** según su situación de cobertura. En cada edificación se registra:

| Atributo | Valores | Datos asociados *(propuesta)* |
|---|---|---|
| **Aseguramiento** | Asegurada · No asegurada | Aseguradora y número de póliza (opcional) |
| **Hipoteca** | Sí · No | Entidad financiera (opcional) |
| **Leasing** | Sí · No | Entidad / locador (opcional) |

> Se proponen como **atributos independientes** (una edificación puede estar asegurada **y** con hipoteca). Así se pueden filtrar por cada uno o combinados. Ver pregunta Q-06.

> **RUFE:** el formato oficial registra la **forma de tenencia** con 5 valores (arrendatario · ocupante · poseedor · propietario · no informa), no solo propietario/arrendatario. El RUFE **no** pregunta por seguros, hipoteca ni leasing: esa cobertura es un requisito propio del profesor (ver 10.6).

### 10.3 Personas asociadas a la edificación
En **cada edificación** se registra la información de las **personas asociadas** a ella, tanto **propietarios como arrendatarios**, para poder **categorizarlas y filtrarlas** con las características que pide el profesor.

**Campos propuestos por persona**

| Campo | Valores / detalle | Uso |
|---|---|---|
| **Vínculo / tenencia** | Propietario · Arrendatario · *(RUFE, opcional)* Poseedor · Ocupante · No informa | Filtro y reportes |
| **Identificación** | Nombre(s) y apellido(s); **tipo de documento** (catálogo RUFE de 10 valores) y número | Evitar duplicados; ver nota sobre personas sin documento |
| **Fecha de nacimiento** *(RUFE)* | Día/mes/año; el sistema calcula la **edad** y el **rango etario** (si no se conoce la fecha, se admite la edad en años) | Filtro por rango |
| **Género** *(RUFE)* | Masculino · Femenino · Transgénero | Filtro y reportes |
| **Pertenencia étnica** *(RUFE)* | Indígena · Gitano-ROM · Raizal · Palenquero · Negro/mulato/afrodescendiente/afrocolombiano · No aplica | Reportes (dato sensible) |
| **Parentesco con el jefe de hogar** *(RUFE, opcional)* | Catálogo de 15 valores (jefe de hogar, pareja, hijo(a), abuelo(a)…) | Agrupar a las personas por hogar (Q-19) |
| **Presencia** | Se encontraba en la edificación al momento del sismo / de la inspección: sí · no | Distinguir quién estaba ahí |
| **Condición especial** *(selección múltiple)* | Discapacidad (con tipo opcional) · Persona vulnerable · Necesidad especial (con descripción) · Ninguna | Filtro por condición |
| **Tipo de población** | Civil · Militar · Carcelaria (ver 10.4) | Filtro |
| **Estado tras el sismo** *(propuesta)* | Ileso · Afectado · Herido · Fallecido | Alimenta “Efecto en los ocupantes” del formulario |
| **Contacto** | Teléfono (el RUFE solo pide teléfono); correo opcional | Seguimiento |

> **Personas sin documento:** el RUFE admite los tipos “Menor sin identificación”, “Adulto sin identificación” y “No informa”. Por eso el documento **no siempre existe**: la detección de duplicados por documento solo aplica cuando hay un número; en los demás casos se apoya en nombre completo + fecha de nacimiento + edificación (afecta la sección 13 y la regla de negocio de duplicados).

**Rangos etarios** (tomados del tablero, con los límites aclarados):

| Rango | Edades | Observación |
|---|---|---|
| Niños menores de 10 | 0–9 años | El tablero dice “< 10 años” |
| Niños y adolescentes | 10–17 años | El tablero dice “> 10 años”; aquí se incluyen los 10 |
| Adultos | 18–59 años | “Adulto ≥ 18” |
| Adultos mayores | 60 años o más | “Adulto ≥ 60” |

> Una persona adulta de 60 años o más cuenta también como adulta (≥ 18). Los rangos del sistema son **mutuamente excluyentes** para que las cifras sumen el total; ver supuesto S-08.

**Qué debe poderse hacer con este registro**
- Filtrar y contar personas por **rango de edad**, **vínculo**, **condición especial**, **tipo de población** y **estado**
- Filtrar **edificaciones** por las características de las personas asociadas (por ejemplo, edificaciones con niños menores de 10 o con personas con discapacidad)
- Cruzar con la **cobertura** (por ejemplo, personas afectadas en edificaciones no aseguradas)

> **Datos sensibles:** la discapacidad y otras condiciones de salud son **datos sensibles** (Ley 1581 de 2012) y los menores de edad tienen protección especial. Se registran solo si el profesional los obtiene con autorización y **nunca** se exponen en el área pública. Ver regla de negocio y pregunta Q-13.

### 10.4 Tipo de población
**Civil · Militar · Carcelaria**

> Esto implica que la edificación (o sus ocupantes) puede pertenecer a un contexto institucional distinto al residencial común. Ver pregunta Q-05.

### 10.5 Relación con el formulario IDIGER
El formulario trae dos bloques que **se pueden derivar del registro de personas** en lugar de digitarse dos veces:

| Bloque del formulario | Cómo se obtiene |
|---|---|
| **Efecto en los ocupantes** (hubo muertos o heridos; número de fallecidos, heridos y afectados) | Conteo de las personas según su **estado** tras el sismo |
| **Ocupación** (habitada al momento de la evaluación; número de ocupantes) | Conteo de las personas con **presencia** registrada |

> Sigue siendo posible digitar los totales cuando no se registró a cada persona. El RUFE confirma que la práctica oficial es registrar **persona por persona** (ver 10.6 y S-15).

### 10.6 Registro Unifamiliar de Emergencias (RUFE) — formato real de un afectado
**Fuente:** formato **FR-1703-SMD-69**, versión 01 (vigente desde 11-abr-2025), de la UNGRD (proceso SMD – ERE). Es el que diligenció una persona afectada por el sismo en Cali. *Nota: el archivo recibido es la plantilla en blanco; los campos de abajo salen de su estructura, no de datos reales.*

**Qué es:** una hoja por **familia/bien afectado**, con la identificación del evento, el bien, hasta **10 personas** y el sector agropecuario. Lo llena el afectado (o el CMGRD) y recibe el **Vo.Bo. del CMGRD/CDGRD**. Incluye aviso de tratamiento de datos personales (UNGRD, habeas data).

| Bloque RUFE | Campos | Cómo se refleja en este proyecto |
|---|---|---|
| **Evento** | Departamento, municipio, evento, fecha del evento, fecha del RUFE | Fijos para este proyecto (Valle del Cauca · Cali · sismo del 10-ago-2026); la fecha del registro la pone el sistema |
| **Ubicación del bien** | Urbano / rural, corregimiento, vereda-sector-barrio, dirección | Ampliar la identificación de la edificación (9.1) |
| **Alojamiento actual** | Lugar habitual de su residencia · Evacuado fuera de su residencia | **Nuevo** atributo del hogar/persona: dónde está alojada tras el sismo |
| **Forma de tenencia** | Arrendatario · ocupante · poseedor · propietario · no informa | Amplía “vínculo” (10.3) |
| **Estado del bien** | Habitable · no habitable · destruido · averiado · no informa | Estado **declarado** (ver 8.1 y Q-19); no sustituye al sticker |
| **Tipo de bien** | Vivienda · finca · local comercial · fábrica · bodega · lote · centro de bienestar · centro educativo/escuela · centro de bienestar/adulto mayor · hospital · estadio · iglesia/institución religiosa · alcaldía municipal · estación de policía | Se cruza con el **uso predominante** del IDIGER y con los **sectores** del profesor (10.1): vivienda y comercial, educación, salud. Se propone usarlo como catálogo de tipo de bien |
| **Información demográfica** (hasta 10 filas) | Nombres, apellidos, tipo y número de documento, parentesco, género, fecha de nacimiento, pertenencia étnica, teléfono | Base del registro de personas (10.3) |
| **Sector agropecuario** | Tipo de cultivo, unidad de medida, área; sector pecuario (especie) y cantidad | **Fuera del alcance** de esta entrega (zona rural); queda como “podría estar” |
| **Vo.Bo. CMGRD/CDGRD y observaciones** | Visto bueno del consejo de gestión del riesgo; texto libre | Se alinea con el estado “Validada” (8.2) y las observaciones/comentarios |

**Catálogos del RUFE** (se adoptan tal cual en `arch/ENUMS.md`)

| Catálogo | Valores |
|---|---|
| Tipo de documento (10) | Registro civil · Tarjeta de identidad · Cédula de ciudadanía · Cédula de extranjería · Pasaporte · Menor sin identificación · Adulto sin identificación · No informa · NIT · Otro |
| Parentesco (15) | Jefe(a) o cabeza del hogar · Pareja/esposo(a) · Hijo(a)/hijastro(a) · Abuelo(a) · Sobrino(a) · Nieto(a) · Tío(a) · Otro pariente · Padre/madre/suegro(a) · Hermano(a)/hermanastro(a) · Yerno/nuera · Cuñado(a) · Otro no pariente · Primo(a) · No informa |
| Género (3) | Masculino · Femenino · Transgénero |
| Pertenencia étnica (6) | Indígena · Gitano-ROM · Raizal · Palenquero(a) · Negro(a), mulato(a), afrodescendiente, afrocolombiano(a) · No aplica |

**Contraste con los requisitos del profesor**

| Dato | ¿Lo pide el RUFE? | ¿Lo pide el profesor? | Decisión |
|---|---|---|---|
| Propietario / arrendatario | Sí (y 3 formas más de tenencia) | Sí | Usar el catálogo RUFE; propietario y arrendatario son los dos valores obligatorios |
| Edad / rango etario | Indirecto (fecha de nacimiento) | Sí (0–9, 10–17, 18–59, 60+) | Guardar fecha de nacimiento y **calcular** el rango |
| Discapacidad, vulnerable, necesidad especial | **No** | Sí | Se agrega como extensión propia |
| Civil / militar / carcelaria | **No** | Sí | Extensión propia (sigue abierta Q-05) |
| Asegurada / hipoteca / leasing | **No** | Sí | Extensión propia |
| Estado tras el sismo (ileso / herido / fallecido) | **No** | No (viene del IDIGER) | Extensión propia; alimenta “Efecto en los ocupantes” |
| Género, pertenencia étnica, parentesco, alojamiento actual | Sí | No | Se adoptan del RUFE: dan más valor al registro y a los reportes |
| Correo electrónico | **No** | No | Opcional |

> **Conclusión:** el aplicativo nace de la **inspección** (IDIGER/ATC-20), pero el registro de personas debe verse como un **RUFE ampliado**: los campos oficiales de la UNGRD más los que pidió el profesor. Así los datos son comparables con los que ya recolecta la entidad.

---

## 11. Reglas de negocio clave
- Una edificación tiene **una identificación catastral única**; puede tener varias inspecciones en el tiempo
- La clasificación **vigente** de una edificación es la de su **última inspección validada**; el historial nunca se sobrescribe
- La clasificación global del formulario es **la más crítica entre las evaluaciones A a E** (se calcula, no se digita)
- En daños estructurales, la suma de porcentajes por elemento debe ser **100 %**
- El cambio de sticker solo ocurre mediante una **nueva inspección** registrada por personal autorizado
- Toda inspección identifica al inspector (código/nombre) y fecha-hora
- Las personas se asocian a la **edificación** y a la **inspección** en que se registraron (foto del momento)
- Cada persona tiene un vínculo: **propietario o arrendatario** (una misma persona puede tener vínculos distintos con inmuebles distintos; se identifica por su documento para no duplicarla). Si la persona **no tiene documento** (tipos “sin identificación” o “no informa” del RUFE), se compara por nombre completo + fecha de nacimiento
- La **edad y el rango etario** se calculan a partir de la fecha de nacimiento; no se digitan (si se desconoce la fecha, se admite la edad en años)
- Los **catálogos** de tipo de documento, parentesco, género, pertenencia étnica y forma de tenencia son los del **RUFE** de la UNGRD
- Una persona puede tener **varias condiciones especiales** a la vez
- Una edificación se categoriza por **aseguramiento, hipoteca y leasing** de forma independiente
- Si el sticker es amarillo o rojo, el sistema permite registrar la **recepción de estudios técnicos** y programar la **reinspección**
- Una edificación con concepto de demolición **no** se considera demolida hasta que se registre la demolición
- Datos personales de las personas asociadas: recolectar solo lo estrictamente necesario (Ley 1581 de 2012, habeas data). Los datos de salud/discapacidad son sensibles y los de menores requieren protección especial
- **Área pública:** solo muestra **cifras agregadas**. Nunca devuelve nombres, documentos, contactos, direcciones exactas ni datos de una edificación o persona identificable
- Para evitar identificar personas en cifras muy pequeñas, el área pública puede **ocultar o agrupar conteos bajos** (umbral por definir, Q-12)
- **Área privada:** todo acceso exige autenticación; lo que ve cada usuario depende de su rol
- La **exportación a PDF** incluye datos personales: solo disponible para usuarios autenticados con permiso y se registra quién la generó y cuándo
- Las cuentas privadas las crea el Administrador; no existe auto-registro
- **Datos ficticios:** en producción solo se registran datos de prueba (personas, documentos, direcciones y contactos inventados). Aun así, el sistema se **diseña como si los datos fueran reales** (protección por rol, área pública solo agregada), porque es la práctica correcta y lo que se valida
- El sistema debe **dejar claro que no es una fuente oficial**: muestra un aviso visible de “datos ficticios con fines académicos” y no usa logos ni marca de la Alcaldía, la UNGRD ni el IDIGER

---

## 12. Indicadores, consulta y reportes

### 12.1 Área pública — resumen de cifras
Es la **página de entrada** del aplicativo. Muestra, **solo de consulta** y sin iniciar sesión, un resumen del estado general, con un **aviso visible** de que los datos son ficticios y académicos (no oficiales). Se propone tomar como base el **Reporte Oficial #050** de la Alcaldía de Cali (frente *Infraestructura*, que es el que este aplicativo puede alimentar):

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

**Cifras públicas adicionales sugeridas** *(solo agregadas; por validar en Q-11)*:
- Edificaciones por clasificación y por comuna
- Edificaciones por uso o sector
- Edificaciones por cobertura (aseguradas / no aseguradas) y personas asociadas por rango etario, sin identificar a nadie
- Fecha y hora de la última actualización

### 12.2 Área privada — consulta con filtros
Consulta de edificaciones con **filtros combinables**, que se pueden aplicar de forma conjunta (todos se cumplen a la vez):

| Grupo | Filtros |
|---|---|
| **Ubicación** | Comuna, barrio, manzana, predio, dirección |
| **Inspección** | Clasificación (sticker verde/amarillo/rojo), nivel de habitabilidad, fase (rápida / detallada), tipo de inspección, rango de fechas, inspector, estado de la inspección |
| **Edificación** | Uso predominante, sector, sistema estructural, período de construcción, número de pisos |
| **Cobertura** | Asegurada / no asegurada, con hipoteca, con leasing, aseguradora |
| **Personas asociadas** | Vínculo (propietario / arrendatario), rango etario, género, pertenencia étnica, condición especial, tipo de población, estado tras el sismo, alojamiento actual |
| **Demolición** | Sin concepto · concepto aprobado · demolida · escombros retirados |

Los resultados se muestran en tabla con **orden, paginación y conteo total**.

### 12.3 Área privada — reportes
- Edificaciones por clasificación, sector, uso y cobertura (asegurada, hipoteca, no asegurada, leasing)
- Personas por rango etario, vínculo, condición especial y tipo de población (civil, militar, carcelaria)
- Edificaciones por comuna/barrio
- Edificaciones pendientes de inspección o reinspección
- Historial completo por edificación
- Los indicadores del Reporte Oficial (sección 12.1) con detalle por zona

### 12.4 Exportación a PDF de una edificación
Desde la ficha de cada edificación se genera un **PDF con toda su información**:
- Identificación catastral, dirección, uso, sistema estructural, número de pisos y período de construcción
- Clasificación vigente y **historial de inspecciones** (fecha, inspector, resultado)
- Evaluaciones A–E del formulario, recomendaciones y medidas de seguridad
- **Personas asociadas** (vínculo, edad, condiciones, estado)
- **Cobertura** (aseguramiento, hipoteca, leasing)
- Estado de demolición, comentarios y datos de la persona de contacto
- Fecha y hora de generación y usuario que lo generó

> Pendiente definir si el PDF replica el diseño del formulario IDIGER o es un reporte propio (Q-15).

---

## 13. Componente algorítmico *(propuesta — por validar)*
La materia es **Análisis de Algoritmos**, por lo que además de la funcionalidad conviene que el proyecto **demuestre decisiones algorítmicas analizables**. Candidatos:

| Problema del dominio | Algoritmo / técnica | Qué se puede analizar |
|---|---|---|
| Priorizar la cola de inspecciones/reinspecciones | Puntaje de prioridad + cola de prioridad (heap) | Complejidad O(log n) por inserción/extracción |
| Buscar y ordenar edificaciones/personas | Índices, búsqueda binaria, ordenamientos | Comparar O(n) vs O(log n) con datos de 6.000+ registros |
| Agrupar edificaciones por zona | Clustering geográfico o agrupación por barrio/manzana | Complejidad vs. calidad del resultado |
| Calcular clasificación global y validar sumas | Reducción sobre evaluaciones A–E | O(1) por formulario |
| Detectar duplicados de edificación y de personas | Hashing por código catastral / por documento; normalización de direcciones; para personas **sin documento** (RUFE), clave compuesta nombre + fecha de nacimiento | O(1) promedio; comparar contra coincidencia aproximada de nombres |
| Consulta con muchos filtros combinados | Índices por atributo + intersección de conjuntos de resultados | Costo según el orden de aplicación de los filtros y su selectividad |
| Contar cifras agregadas del área pública | Agregación incremental / caché de totales | Recalcular O(n) vs actualizar O(1) por registro |

> **Datos para medir:** como los datos son ficticios, el **generador de datos de prueba** puede producir volúmenes del orden del reporte oficial (≥ 6.000 edificaciones y decenas de miles de personas). Esto permite comparar tiempos con tamaños crecientes de entrada y sustentar el análisis de complejidad con mediciones reales.

> Pendiente: confirmar con el profesor si se evaluará el análisis de complejidad explícitamente (Q-01). Es el principal riesgo de **no** alinear el proyecto con la materia.

---

## 14. Stack tecnológico *(tentativo — se decide en ARCHITECTURE.md / DECISIONS.md)*

| Capa | Opción propuesta | Justificación |
|---|---|---|
| Backend | **Python + FastAPI** | **Python es exigencia del profesor.** FastAPI: tipado con Pydantic, OpenAPI automático y ya conocido por el equipo |
| Base de datos | **PostgreSQL** | Relaciones entre edificación, inspección, ocupantes y seguros; consultas de reporte |
| Frontend | **React + Vite** | Formularios largos con validación; mismo stack que el proyecto anterior |
| Autenticación | Supabase Auth *(o JWT propio)* | Reduce desarrollo; decidir según costo/complejidad |
| Almacenamiento | Supabase Storage | Fotos y esquema de la edificación |
| Exportación PDF | Librería de PDF en Python (p. ej. ReportLab o WeasyPrint) | Generar el PDF por edificación en el backend |
| Despliegue | **Vercel** (frontend) + **Render** (backend FastAPI) + **Supabase** (BD, Auth y Storage) | Capa gratuita; mismo esquema del proyecto previo, que se desplegó en ≈ 1,5 semanas |

> Debe poder usarse **en campo**: considerar diseño *mobile-first* y, a futuro, captura offline (ver Q-08).

> **Separación pública / privada:** los endpoints del área pública no requieren token y solo leen **cifras agregadas** (idealmente una vista o tabla de agregados distinta de las tablas con datos personales). Los endpoints del área privada exigen autenticación y validan el rol en el backend. Esto se detalla en `arch/AUTH.md`.

> **Supabase no ejecuta Python:** sus Edge Functions usan TypeScript/Deno, así que no cumplen la exigencia del profesor. Supabase se usa solo como **base de datos PostgreSQL, autenticación y almacenamiento**; la lógica de negocio va en el backend Python (FastAPI) desplegado aparte.

### 14.1 Límites de la capa gratuita y cómo afectan al proyecto
*Cifras según la documentación de cada proveedor consultada el 2026-10-21; pueden cambiar. Las de Supabase provienen de un resumen de mayo de 2026: verificar en supabase.com/pricing antes de decidir.*

| Servicio | Límites relevantes (gratuito) | Riesgo para el proyecto | Mitigación |
|---|---|---|---|
| **Render** (backend) | Se **duerme tras 15 min** sin tráfico; el primer request tarda **≈ 1 min** en despertar; 750 horas de instancia al mes | Primera consulta lenta, p. ej. durante la sustentación | “Despertar” el servicio antes de la demo; ping periódico opcional; mostrar un estado de carga en el frontend |
| **Render Postgres** | La BD gratuita **expira a los 30 días** | Pérdida de datos | **No usarla**: la base de datos va en Supabase |
| **Supabase** | 500 MB de BD, 1 GB de almacenamiento, 5 GB de ancho de banda, 50.000 usuarios activos/mes; el proyecto se **pausa tras 7 días sin actividad** | Proyecto pausado el día de la entrega | Mantener actividad periódica y verificar que esté activo antes de entregar |
| **Vercel Hobby** (frontend) | Gratis para uso **personal y no comercial**; sin funciones de colaboración de equipo | Despliega la cuenta de un solo integrante | Un integrante administra el despliegue; el uso académico es no comercial |

**Volumen esperado:** miles de edificaciones y personas ocupan muy por debajo de los 500 MB de la BD. Las **fotos y esquemas** son lo que más almacenamiento consumen: comprimirlas o limitarlas.

> **Regla de despliegue:** desplegar un **esqueleto funcional en producción en la primera semana** (backend, frontend y BD conectados) y desplegar de forma continua desde ahí. Dejar el despliegue para el final es el mayor riesgo de no llegar al 30 de noviembre.

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
- **Plazo: 30 de noviembre de 2026**, con el aplicativo desplegado en producción (ver 5.4)
- **Capa gratuita** de la infraestructura (ver 14.1)
- **Backend en Python** (exigencia del profesor)
- El formulario es de uso institucional: el sistema **no** emite stickers oficiales ni reemplaza el dictamen técnico del profesional
- Datos personales: mínimo necesario y acceso restringido por rol; nunca en el área pública
- **Producción con datos ficticios:** no se ingresa información real de personas ni de edificaciones, ni en producción ni en el repositorio
- El repositorio es **público**: los datos de prueba que se versionen (por ejemplo en `data/sample/`) son ficticios, y las **credenciales de demostración** del profesor se entregan por un canal privado, nunca en el repo ni en la documentación

**Fuera del alcance de esta entrega**
- Atención humanitaria (RUD, alojamientos, ayudas) y atención hospitalaria
- Integración con sistemas oficiales (RUD, UNGRD, catastro)
- Captura offline y geolocalización avanzada
- Notificaciones (correo, push)
- Generación de stickers imprimibles con validez oficial
- Sector agropecuario del RUFE (cultivos y especies pecuarias) y reemplazo del RUFE oficial: el aplicativo **no** envía datos al RUD

### Alcance por prioridad *(propuesta, para llegar al 30-nov)*
| Prioridad | Qué incluye |
|---|---|
| **Debe estar** | Autenticación y roles · área pública con cifras · registro de edificación e inspección (identificación, uso, sistema estructural, clasificaciones A–E y clasificación global calculada) · registro de personas y cobertura (aseguramiento, hipoteca, leasing) · consulta con filtros · exportación a PDF por edificación · **generador de datos ficticios** (script de carga) y aviso de “datos de prueba” · despliegue en producción |
| **Debería estar** | Detalle fino del formulario (porcentajes de daño estructural, elementos no estructurales ítem por ítem, condiciones preexistentes) · reinspección con historial · registro de demolición · reportes de la sección 12.3 · análisis algorítmico documentado (sección 13) |
| **Podría estar** | Fotos y croquis · exportación CSV · caché de cifras agregadas · seguimiento de estudios técnicos |

### Hitos propuestos
| Fechas | Hito |
|---|---|
| 21 – 28 oct | Documentación SDD completa (BRIEF validado, PRD, ARCHITECTURE, DESIGN, TASKS), repositorio con reglas, **esqueleto desplegado en producción** |
| 29 oct – 19 nov | Construcción por fases, con revisión por PR y análisis de calidad |
| 20 – 25 nov | Integración, pruebas, corrección de *code smells*, datos de prueba ficticios |
| 26 – 29 nov | Colchón y congelamiento del código; verificar que producción esté activa |
| **30 nov** | **Entrega** |

---

## 18. Supuestos y preguntas abiertas

### Supuestos tomados en este borrador
- **S-01** Se usa el formulario IDIGER como base de la evaluación en detalle (respaldado por la Circular 73 de la UNGRD)
- **S-02** En Cali “localidad” del formulario de Bogotá se adapta a **comuna**
- **S-03** El alcance es la ciudad de Cali (el enunciado habla de Colombia en general)
- **S-04** El rótulo “UDGR” del tablero = Unidad de Gestión del Riesgo
- **S-05** Los 6 “sectores” del tablero clasifican el tipo de afectación/edificación
- **S-06** El área pública no requiere autenticación y solo muestra datos agregados
- **S-07** Las cuentas del área privada las crea el Administrador (sin auto-registro)
- **S-08** Los rangos etarios son 0–9, 10–17, 18–59 y 60+, calculados a partir de la edad
- **S-09** Aseguramiento, hipoteca y leasing son atributos independientes de la edificación
- **S-10** El stack se mantiene igual al del proyecto previo (React + FastAPI + Supabase + Vercel/Render) para reutilizar patrones y llegar a tiempo
- **S-11** Producción en capa gratuita es suficiente para la entrega y la sustentación (con las mitigaciones de 14.1)
- **S-12** En producción solo se registran **datos ficticios**; el profesor valida la herramienta con datos de prueba
- **S-13** Aunque los datos son ficticios, la protección de datos personales se diseña **como si fueran reales** (menor prioridad que las funciones exigidas, pero sin eliminarla)
- **S-14** El registro de personas adopta los **campos y catálogos del RUFE** (UNGRD) y agrega los que pidió el profesor (condición especial, tipo de población, cobertura, estado tras el sismo)
- **S-15** Las personas se registran **una por una** (como en el RUFE, hasta 10 por hogar en papel); los totales del formulario IDIGER se derivan del conteo, y se permite digitar totales solo si no hay registro individual
- **S-16** Datos mínimos por persona: nombres, apellidos, tipo de documento, vínculo y fecha de nacimiento (o edad). El resto es opcional. Es lo que pide el RUFE, sin correo electrónico

### Preguntas para validar
| ID | Pregunta |
|---|---|
| **Q-01** | ¿El profesor evaluará explícitamente el análisis de complejidad algorítmica? ¿Qué algoritmos espera ver? |
| **Q-02** | La fecha de entrega es el **30-nov-2026**, desplegado en producción. ¿Qué entregables se piden además (código, documentación, sustentación, informe de análisis de complejidad)? |
| **Q-03** | ¿Se guarda la clasificación de 4 niveles del formulario **y** el color de sticker de 3 niveles, con tabla de equivalencia? |
| **Q-04** | ¿Se implementan ambas fases (inspección rápida y evaluación en detalle) o solo el formulario completo? |
| **Q-05** | “Civil / militar / carcelaria”: ¿es un atributo de la **edificación** (p. ej. un batallón o cárcel) o de las **personas**? *(El RUFE no lo trae; su “tipo de bien” solo incluye estación de policía, alcaldía y centros de bienestar, así que no lo resuelve)* |
| **Q-06** | “Asegurada / hipoteca / no asegurada / leasing”: ¿son excluyentes o una edificación puede estar asegurada **y** con hipoteca? |
| **Q-07** | Asignación exacta de cifras por color de sticker en el reporte (verificar contra el PDF original) |
| **Q-08** | ¿Se requiere uso en campo desde celular y/o modo offline? |
| **Q-09** | ¿Qué roles se necesitan realmente (Administrador / Inspector / Consulta)? |
| **Q-10** | ¿Se usa Supabase o autenticación propia? |
| **Q-11** | ¿Qué cifras exactas debe mostrar el área pública? ¿Solo las del reporte oficial o también cifras de personas y cobertura? |
| **Q-12** | *(prioridad baja: datos ficticios)* ¿Se ocultan o agrupan conteos pequeños en el área pública? ¿Con qué umbral? |
| **Q-13** | ✅ *Respondida con el RUFE (S-16), por confirmar con el profesor.* Datos obligatorios y opcionales de las personas: el RUFE pide nombres, documento, parentesco, género, fecha de nacimiento, etnia y teléfono. *(Con datos ficticios, la autorización puede ser solo una casilla informativa)* |
| **Q-14** | ✅ *Respondida con el RUFE (S-15).* La práctica oficial es registrar a **cada persona**; los totales se derivan del conteo. Falta decidir si “estado” (ileso/herido/fallecido) es obligatorio: el RUFE no lo trae |
| **Q-15** | ¿El PDF de la edificación debe replicar el formulario IDIGER o puede ser un reporte propio? |
| **Q-16** | ¿Los filtros de la consulta son los de este brief o el profesor espera otros? ¿Hay exportaciones adicionales (Excel/CSV)? |
| **Q-17** | ¿Quién crea y administra las cuentas de Vercel, Render y Supabase? (Vercel Hobby no permite colaboración de equipo; conviene definir un responsable del despliegue) |
| **Q-18** | ¿La demo y la sustentación se harán sobre producción? Si sí, ¿cómo se asegura que Render y Supabase estén activos ese día? |
| **Q-19** | ¿Se registra también el **hogar o familia** (como el RUFE: una hoja por familia, con parentesco y alojamiento actual) o solo las personas asociadas a la edificación? ¿Y el **estado del bien declarado** por el afectado? |
| **Q-20** | ¿El profesor espera que el registro de personas reproduzca el RUFE o basta con los campos del tablero? ¿Se registra el campo “alojamiento actual”? |

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
| **Registro Unifamiliar de Emergencias (RUFE)**, UNGRD, formato FR-1703-SMD-69 v01 (11-abr-2025) — el que diligenció un afectado en Cali | Campos y catálogos del registro de personas (sección 10.6) |
