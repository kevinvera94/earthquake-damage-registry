# Plan de construcción — earthquake-damage-registry
> Para: **Kevin Vera, Valentina Sepúlveda y David Calambas**
> Entrega: **lunes 30 de noviembre de 2026**, desplegado en producción
> Detalle completo: [`specs/TASKS.md`](TASKS.md) · Reglas de código: [`specs/arch/CODING-STANDARDS.md`](arch/CODING-STANDARDS.md) · Estado: [`specs/BITACORA.md`](BITACORA.md)

---

## La idea en una frase
El **primer día** nos repartimos por capa para construir la base que todos vamos a usar. Desde la **tarde del primer día**, cada uno toma **módulos completos** (API + pantalla + pruebas), para que nadie tenga que esperar a otro para terminar su parte.

---

## 1. Roles

| Persona | Se encarga de |
|---|---|
| **Kevin Vera** | Backend base, modelo de datos y migraciones (**solo Kevin crea migraciones**), autenticación, usuarios, área pública, datos ficticios y documento de algoritmos. **Aprueba todos los PRs** |
| **Valentina Sepúlveda** | Frontend base; edificaciones, inspecciones y consulta con filtros. Su módulo de **edificaciones es el molde** que copian los demás módulos |
| **David Calambas** | Infraestructura y despliegue (**dueño de las cuentas** de Supabase, Render y Vercel), base de pruebas, personas, PDF, aceptación y entrega |

---

## 2. Plan día a día

| Día | Kevin | Valentina | David |
|---|---|---|---|
| **24 mañana** | T-01 Backend base · T-03 Modelo y migración | T-02 Frontend base | T-04a Cuentas · T-01b Base de pruebas · T-04b Despliegue |
| **24 tarde** | T-05 + T-06 Autenticación (API y login) | T-07 + T-10 Edificaciones *(molde)* | T-04c CI/CD · T-04d Prueba de humo · T-04e Runbook |
| **25** | T-13a + T-13b Usuarios | T-08 + T-11 Inspecciones y ficha | T-09 + T-12 Personas |
| **26** | T-16 + T-17 Área pública | T-14 + T-15 Consulta con filtros | T-18 PDF |
| **27** | T-19 Datos ficticios · T-20 Algoritmos | Corrección de errores y apoyo | T-21 Carga en producción · T-22a Cobertura |
| **28** | Pruebas de aceptación en producción y correcciones — **los tres** | ← | ← |
| **29** | Congelamiento del código; David verifica producción | ← | ← |
| **30** | **Entrega** | ← | ← |

> Las parejas como "T-07 + T-10" son la API y la pantalla del mismo módulo, hechas por la misma persona. Pueden ir en un PR o en dos seguidos.

---

## 3. Día 1: la base que evita conflictos
Es lo más importante del plan. Cada tarea base deja **completos** los archivos que todos vamos a tocar, para que nadie tenga que reescribirlos después:

- **Kevin (T-01, T-03):**
  - el modelo de datos completo en una sola migración;
  - todos los routers del backend registrados, aunque estén vacíos;
  - las excepciones de error;
  - las firmas de la autenticación.
- **Valentina (T-02):**
  - todas las rutas del frontend;
  - el catálogo completo de etiquetas en español;
  - el cliente de la API;
  - los estilos del mockup.
- **David (T-01b, T-04):**
  - todas las *fixtures* de pruebas, incluida **`as_user`**, que permite probar un módulo **sin esperar** la autenticación real;
  - el **despliegue automático**: cada PR fusionado llega solo a producción si pasan las pruebas.

Gracias a `as_user`, Valentina puede empezar edificaciones el 24 en la tarde, en paralelo con la autenticación de Kevin.

---

## 4. Dónde dependemos unos de otros
Si alguno de estos se atrasa, bloquea a otra persona. Son los puntos a revisar en las reuniones.

| Quién espera | Qué necesita | De quién | Para cuándo |
|---|---|---|---|
| Valentina y David | Modelo de datos y *fixture* `as_user` | Kevin / David | 24 a mediodía |
| David (personas) | Edificaciones fusionada | Valentina | 24 en la noche |
| Valentina (consulta) | Personas fusionada | David | 25 en la noche |
| David (PDF) | Ficha de la edificación fusionada | Valentina | 25 en la noche |
| Kevin (datos ficticios) | Personas fusionada | David | 25 en la noche |

---

## 5. Cómo se trabaja cada tarea
1. Partir de `main` actualizado y crear la rama `feat/T-XX-descripcion`:
   ```bash
   git checkout main && git pull
   git checkout -b feat/T-XX-descripcion
   ```
2. En el **primer commit**, marcar la tarea **En curso** en tu sección de `specs/BITACORA.md` y abrir el PR en **borrador**
3. Implementar con Claude Code. Claude lee `CLAUDE.md`, `CODING-STANDARDS.md` y, cuando ya exista, el módulo de edificaciones como referencia
4. Marcar la tarea **Finalizado** con la fecha y el número del PR en la bitácora; hacer `git pull --rebase origin main`, correr las pruebas y `/code-review`
5. Pedir revisión a **Kevin**, que aprueba. Los PRs de Kevin los revisa Valentina o David, y Kevin los fusiona
6. Al fusionar, el cambio **se despliega solo** y la prueba de humo verifica producción

---

## 6. Reglas de coordinación
- **Bitácora obligatoria:** en `specs/BITACORA.md`, cada uno edita **solo su sección**. Sin la bitácora actualizada, el PR no se aprueba
- **Máximo un PR abierto por persona**
- **Revisión en menos de 2 horas.** Como todo pasa por Kevin, Kevin revisa en bloques fijos: al final de la mañana, de la tarde y de la noche
- **Archivos compartidos** (lista en `CODING-STANDARDS.md` §3): solo se agregan líneas, en un PR pequeño y avisando antes en el grupo
- **Migraciones:** solo Kevin. Si necesitas un cambio en la base de datos, pídeselo
- **No usar datos reales ni subir secretos.** El repositorio es público
- **Si Claude propone algo distinto a lo que dice `CODING-STANDARDS.md`**, gana el estándar. Si crees que el estándar está mal, se propone el cambio en el grupo; no se implementa una variante

### Reuniones (15 minutos cada una)
| Cuándo | Qué se habla |
|---|---|
| **Mañana** | Qué toma cada uno hoy y qué archivo compartido va a tocar |
| **Noche** | Qué se fusionó, qué está bloqueado y quién revisa qué |

---

## 7. Antes de empezar (cada uno)
1. Tener acceso como colaborador al repositorio: https://github.com/kevinvera94/earthquake-damage-registry
2. Clonar o actualizar `main` y leer, en este orden:
   - `CLAUDE.md`
   - `specs/BRIEF.md`
   - `specs/arch/CODING-STANDARDS.md`
   - tu primera tarea en `specs/tasks/FASE-01.md`
3. Abrir Claude Code **en la carpeta del repositorio**, para que lea el `CLAUDE.md` del proyecto
4. Pedirle a Claude la tarea por su ID, por ejemplo: *"Haz la tarea T-02 según specs/tasks/FASE-01.md"*

---

## 8. En resumen
- La funcionalidad queda lista el **27-nov**; el 28 y el 29 son para aceptación y corrección
- **El riesgo principal es el día 1:** si la base llega tarde, nos atrasamos los tres
- **El segundo riesgo son las revisiones:** todo pasa por Kevin, así que hay que revisar rápido
