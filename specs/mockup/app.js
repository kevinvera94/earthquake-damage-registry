/* ==========================================================
   Registro de Edificaciones — lógica del mockup (alcance v1.0)
   Todo es ficticio: los datos se generan con una semilla fija
   para que el mockup siempre muestre lo mismo.
   ========================================================== */
"use strict";

/* ---------------- Utilidades ---------------- */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const fmt = (n) => n.toLocaleString("es-CO");
const pct = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : 0).toLocaleString("es-CO") + " %";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n, d) => String(n).padStart(d, "0");
const HOY = new Date();
const FECHA_SISMO = new Date("2026-08-10T00:00:00");

// Generador pseudoaleatorio con semilla (mulberry32): mismos datos en cada carga
function semilla(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = semilla(20260810);
const entre = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const uno = (lista) => lista[Math.floor(rnd() * lista.length)];
function pesado(pares) {
  const total = pares.reduce((s, [, p]) => s + p, 0);
  let r = rnd() * total;
  for (const [v, p] of pares) { if ((r -= p) <= 0) return v; }
  return pares[pares.length - 1][0];
}

function edad(nacimiento, ref = HOY) {
  const n = new Date(nacimiento + "T00:00:00");
  let e = ref.getFullYear() - n.getFullYear();
  const m = ref.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < n.getDate())) e--;
  return e;
}
// Rangos excluyentes y calculados (BRIEF §8.3, RN-07)
const RANGOS = ["Niños menores de 10", "Niños y adolescentes", "Adultos", "Adultos mayores"];
function rangoEtario(e) {
  if (e < 10) return RANGOS[0];
  if (e < 18) return RANGOS[1];
  if (e < 60) return RANGOS[2];
  return RANGOS[3];
}

const fechaLarga = (d) => new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
const fechaCorta = (d) => new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const fechaHora = (d) => new Date(d).toLocaleString("es-CO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
// Compara nombres sin distinguir mayúsculas ni tildes (RF-03-02)
const normalizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/* ---------------- Catálogos (BRIEF §8) ---------------- */
const STICKER = {
  rojo: { nombre: "Rojo", titulo: "Inseguro", texto: "No se puede ingresar ni habitar. Riesgo para la vida." },
  amarillo: { nombre: "Amarillo", titulo: "Uso restringido", texto: "Solo se permite el ingreso a zonas autorizadas o por tiempo limitado." },
  verde: { nombre: "Verde", titulo: "Sin restricción", texto: "La edificación puede usarse con normalidad." },
};
const ORDEN_COLORES = ["rojo", "amarillo", "verde"];

const COMUNAS = [...Array.from({ length: 22 }, (_, i) => String(i + 1)), "Rural"];
const comunaTxt = (c) => (c === "Rural" ? "Rural" : `Comuna ${c}`);
// Barrios ficticios solo para las comunas que usa el generador
const BARRIOS = {
  1: ["Terrón Colorado", "Aguacatal", "Vista Hermosa"],
  2: ["San Vicente", "Granada", "Santa Mónica", "Versalles"],
  3: ["San Antonio", "El Peñón", "San Pedro", "La Merced"],
  4: ["Popular", "Manzanares", "Salomia"],
  9: ["Alameda", "Guayaquil", "Junín", "Sucre"],
  10: ["Panamericano", "Departamental", "Santa Elena", "Las Acacias"],
  11: ["San Carlos", "La Fortaleza", "Aguablanca"],
  13: ["El Vergel", "Ulpiano Lloreda", "El Poblado"],
  17: ["El Ingenio", "Caney", "Limonar"],
  18: ["Meléndez", "Los Chorros", "Alto Jordán"],
  19: ["San Fernando", "El Lido", "Tequendama", "Cristales"],
  20: ["Siloé", "Lleras Camargo", "Belén", "Tierra Blanca"],
  Rural: ["Pance", "La Buitrera", "Montebello", "Los Andes"],
};
const PESO_COMUNA = [["1", 6], ["2", 11], ["3", 13], ["4", 6], ["9", 10], ["10", 9], ["11", 6], ["13", 7], ["17", 6], ["18", 8], ["19", 12], ["20", 14], ["Rural", 3]];

const SECTORES = ["Vivienda", "Comercial", "Salud", "Educación", "Infraestructura", "Logística y suministros", "Economía"];
const TIPOS_DOC = ["Cédula de ciudadanía", "Tarjeta de identidad", "Registro civil", "Cédula de extranjería", "Pasaporte", "Sin documento"];
const VINCULOS = ["Propietario", "Arrendatario"];
const CONDICIONES = ["Discapacidad", "Persona vulnerable", "Necesidad especial"];
const POBLACIONES = ["Civil", "Militar", "Carcelaria"];
const OBSERVACIONES = ["", "", "", "Fisuras en muros de fachada.", "Desprendimiento de acabados en el primer piso.", "Daño en cubierta; se recomienda no usar el último piso.", "Grietas diagonales en muros portantes.", "Sin daños visibles en elementos estructurales."];

const NOMBRES = ["María", "Luisa", "Valentina", "Daniela", "Camila", "Sofía", "Ana", "Carolina", "Gloria", "Martha", "Juan", "Carlos", "Andrés", "Santiago", "Luis", "Jorge", "Felipe", "Diego", "Mateo", "Samuel", "José", "Óscar", "Héctor", "Julián"];
const APELLIDOS = ["García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Gómez", "Díaz", "Vargas", "Ramírez", "Castillo", "Mosquera", "Valencia", "Caicedo", "Rengifo", "Ospina", "Zapata", "Cuero", "Angulo", "Bermúdez", "Quintero", "Muñoz", "Restrepo", "Hurtado"];

const USUARIOS = [
  { nombre: "Mariana Ortiz", correo: "mortiz@ejemplo.test", rol: "Administrador", activo: true },
  { nombre: "Laura Méndez", correo: "lmendez@ejemplo.test", rol: "Inspector", activo: true },
  { nombre: "Andrés Cárdenas", correo: "acardenas@ejemplo.test", rol: "Inspector", activo: true },
  { nombre: "Paola Quintero", correo: "pquintero@ejemplo.test", rol: "Inspector", activo: true },
  { nombre: "Julián Rengifo", correo: "jrengifo@ejemplo.test", rol: "Inspector", activo: true },
  { nombre: "Catalina Mejía", correo: "cmejia@ejemplo.test", rol: "Inspector", activo: false },
];
const INSPECTORES = USUARIOS.filter((u) => u.rol === "Inspector");

// Dos roles (BRIEF §6, PRD §2): el inspector puede todo salvo gestionar usuarios
const ROLES = {
  admin: { etiqueta: "Administrador", usuario: "Mariana Ortiz", permisos: ["panel", "edificaciones", "ficha", "registrar", "usuarios"] },
  inspector: { etiqueta: "Inspector", usuario: "Laura Méndez", permisos: ["panel", "edificaciones", "ficha", "registrar"] },
};

/* ---------------- Datos ficticios (MOD-06) ---------------- */
function fechaAleatoria(desde, hasta) {
  const a = new Date(desde).getTime(), b = new Date(hasta).getTime();
  return new Date(a + rnd() * (b - a));
}

function generarPersona(vinculoHogar) {
  const rango = pesado([[0, 12], [1, 16], [2, 54], [3, 18]]);
  const [min, max] = [[0, 9], [10, 17], [18, 59], [60, 92]][rango];
  const anios = entre(min, max);
  const nac = new Date(2026, entre(0, 10), entre(1, 28));
  nac.setFullYear(nac.getFullYear() - anios - 1);
  const nacimiento = nac.toISOString().slice(0, 10);
  const e = edad(nacimiento);
  let tipoDoc = e < 7 ? "Registro civil" : e < 18 ? "Tarjeta de identidad" : pesado([["Cédula de ciudadanía", 97], ["Cédula de extranjería", 2], ["Pasaporte", 1]]);
  if (rnd() < 0.03) tipoDoc = "Sin documento";
  const condiciones = [];
  if (rnd() < 0.045) condiciones.push("Discapacidad");
  if (rnd() < 0.06 || e >= 75) condiciones.push("Persona vulnerable");
  if (rnd() < 0.02) condiciones.push("Necesidad especial");
  return {
    nombres: uno(NOMBRES),
    apellidos: `${uno(APELLIDOS)} ${uno(APELLIDOS)}`,
    tipoDoc,
    documento: tipoDoc === "Sin documento" ? "" : String(entre(10000000, 1199999999)),
    nacimiento,
    vinculo: e < 18 || rnd() < 0.9 ? vinculoHogar : uno(VINCULOS),
    condiciones,
    poblacion: pesado([["Civil", 980], ["Militar", 15], ["Carcelaria", 5]]),
  };
}

function generarEdificaciones(n) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    const comuna = i === 0 ? "1" : pesado(PESO_COMUNA);
    const sector = pesado([["Vivienda", 70], ["Comercial", 15], ["Educación", 3], ["Salud", 2], ["Infraestructura", 4], ["Logística y suministros", 3], ["Economía", 3]]);
    // Una parte queda sin inspeccionar; las demás tienen una o más inspecciones
    const stickerFinal = i === 0 ? "amarillo" : pesado([[null, 3], ["rojo", 26.5], ["amarillo", 38.4], ["verde", 35.1]]);
    const nInsp = !stickerFinal ? 0 : stickerFinal === "verde" ? pesado([[1, 85], [2, 15]]) : pesado([[1, 55], [2, 35], [3, 10]]);
    const inspecciones = [];
    let fecha = fechaAleatoria("2026-08-11", nInsp > 1 ? "2026-09-10" : "2026-11-20");
    for (let k = 0; k < nInsp; k++) {
      const ultimaInsp = k === nInsp - 1;
      // Antes de una reinspección el sticker era igual o peor
      const peores = ORDEN_COLORES.slice(0, ORDEN_COLORES.indexOf(stickerFinal) + 1);
      inspecciones.push({
        fecha: fecha.toISOString(),
        sticker: ultimaInsp ? stickerFinal : uno(peores),
        observaciones: uno(OBSERVACIONES),
        inspector: uno(INSPECTORES).nombre,
      });
      fecha = new Date(fecha.getTime() + entre(12, 50) * 86400000);
      if (fecha > HOY) fecha = new Date(HOY.getTime() - entre(1, 5) * 86400000);
    }

    const vinculoHogar = rnd() < 0.62 ? "Propietario" : "Arrendatario";
    const nPersonas = sector === "Vivienda" ? pesado([[0, 4], [1, 12], [2, 22], [3, 24], [4, 20], [5, 12], [6, 6]]) : pesado([[0, 40], [1, 30], [2, 20], [3, 10]]);
    const via = pesado([["Calle", 45], ["Carrera", 40], ["Diagonal", 6], ["Transversal", 5], ["Avenida", 4]]);
    const numComuna = comuna === "Rural" ? 0 : +comuna;

    lista.push({
      id: i + 1,
      codigo: i === 0 ? "7600101020041" : `76001${pad(numComuna, 2)}${pad(100000 + i * 3 + entre(0, 2), 6)}`,
      direccion: `${via} ${entre(1, 72)}${rnd() < 0.2 ? uno(["A", "B", "C"]) : ""} # ${entre(1, 99)}-${entre(2, 98)}`,
      comuna,
      barrio: uno(BARRIOS[comuna]),
      sector,
      pisos: sector === "Vivienda" ? pesado([[1, 35], [2, 38], [3, 17], [4, 6], [5, 3], [8, 1]]) : entre(1, 6),
      cobertura: { asegurada: rnd() < 0.24, hipoteca: rnd() < 0.19, leasing: rnd() < 0.032 },
      inspecciones,
      personas: Array.from({ length: nPersonas }, () => generarPersona(vinculoHogar)),
    });
  }
  return lista;
}

const EDIFICACIONES = generarEdificaciones(6043);

// Índice hash por código catastral: búsqueda de duplicados en O(1) promedio (BRIEF §13, RN-01)
const INDICE_CATASTRAL = new Map(EDIFICACIONES.map((e) => [e.codigo, e]));

// Sticker vigente = inspección con la fecha más reciente (RN-02)
const vigente = (e) => e.inspecciones.reduce((m, i) => (!m || new Date(i.fecha) > new Date(m.fecha) ? i : m), null);
const stickerDe = (e) => vigente(e)?.sticker || null;
const fechaDe = (e) => vigente(e)?.fecha || null;

/* ---------------- Estado de sesión ---------------- */
const estado = {
  rol: "admin",
  conSesion: false,
  pagina: 1,
  pasoActual: 1,
  personasNuevas: [],
  fichaId: null,
  retirando: null,
  personaCtx: null,
  ultimaActualizacion: EDIFICACIONES.reduce((m, e) => { const f = fechaDe(e); return f && new Date(f) > m ? new Date(f) : m; }, FECHA_SISMO),
};
try {
  estado.conSesion = sessionStorage.getItem("sesion") === "1";
  estado.rol = ROLES[sessionStorage.getItem("rol")] ? sessionStorage.getItem("rol") : "admin";
} catch (_) { /* almacenamiento bloqueado: el mockup funciona igual */ }

function guardarSesion() {
  try {
    sessionStorage.setItem("sesion", estado.conSesion ? "1" : "0");
    sessionStorage.setItem("rol", estado.rol);
  } catch (_) {}
}
const puede = (permiso) => ROLES[estado.rol].permisos.includes(permiso);
const usuarioActual = () => ROLES[estado.rol].usuario;
const marcarCambio = () => { estado.ultimaActualizacion = new Date(); pintarPublico(); };

/* ---------------- Aviso emergente ---------------- */
let temporizador;
function aviso(texto) {
  const t = $("#toast");
  t.textContent = texto;
  t.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (t.hidden = true), 3800);
}

/* ---------------- Piezas reutilizables ---------------- */
const etiquetaSticker = (s) => (s ? `<span class="etq etq--${s}">${STICKER[s].nombre}</span>` : '<span class="etq etq--neutro">Sin inspeccionar</span>');
const condicionTxt = (p) => (p.condiciones.length ? p.condiciones.join(", ") : "Ninguna");
const documentoTxt = (p) => (p.documento ? `${p.tipoDoc}<br><small>${esc(p.documento)}</small>` : p.tipoDoc);
const opcionesHtml = (lista, valor, etiqueta = (v) => v) => lista.map((v) => `<option value="${esc(v)}" ${v === valor ? "selected" : ""}>${esc(etiqueta(v))}</option>`).join("");

function barrasH(contenedor, filas) {
  const max = Math.max(...filas.map((f) => f[1]), 1);
  contenedor.innerHTML = filas.map(([etq, v]) => `
    <div class="barra-h">
      <span>${etq}</span>
      <span class="barra-h__pista" aria-hidden="true"><span class="barra-h__relleno" style="width:${(v / max) * 100}%"></span></span>
      <span class="barra-h__valor">${fmt(v)}</span>
    </div>`).join("");
}

function marcarError(input, mensaje) {
  const raiz = input.closest(".campo, .grupo") || input.parentElement;
  let p = raiz.querySelector(".campo__error[data-auto]");
  if (!mensaje) {
    input.removeAttribute("aria-invalid");
    if (p) p.remove();
    return true;
  }
  if (!p) {
    p = document.createElement("p");
    p.className = "campo__error";
    p.dataset.auto = "1";
    p.id = (input.id || input.name) + "-error";
    raiz.append(p);
  }
  p.textContent = mensaje;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", p.id);
  return false;
}
const limpiarErrores = (raiz) => $$("[aria-invalid]", raiz).forEach((i) => marcarError(i, ""));

/* ---------- Campos compartidos: edificación (RF-02-02) e inspección (RF-02-04) ----------
   Se pintan con un prefijo para reutilizarlos en el registro por pasos y en los diálogos. */
function camposEdificacion(p, e = {}) {
  const c = e.cobertura || {};
  return `
    <div class="rejilla">
      <div class="campo"><label for="${p}-direccion">Dirección</label><input id="${p}-direccion" value="${esc(e.direccion || "")}" placeholder="Ej.: Carrera 24 # 9-15"></div>
      <div class="campo"><label for="${p}-comuna">Comuna</label><select id="${p}-comuna">${opcionesHtml(COMUNAS, e.comuna || "1", comunaTxt)}</select></div>
      <div class="campo"><label for="${p}-barrio">Barrio</label><input id="${p}-barrio" value="${esc(e.barrio || "")}"></div>
      <div class="campo"><label for="${p}-sector">Sector / uso</label><select id="${p}-sector">${opcionesHtml(SECTORES, e.sector || "Vivienda")}</select></div>
      <div class="campo"><label for="${p}-pisos">Número de pisos</label><input id="${p}-pisos" type="number" min="1" max="60" step="1" value="${e.pisos || 1}"></div>
    </div>
    <fieldset class="grupo">
      <legend>Cobertura</legend>
      <p class="campo__ayuda">Cada opción es independiente: una edificación puede estar asegurada y tener hipoteca al mismo tiempo.</p>
      <label class="check"><input type="checkbox" id="${p}-asegurada" ${c.asegurada ? "checked" : ""}> Está asegurada</label>
      <label class="check"><input type="checkbox" id="${p}-hipoteca" ${c.hipoteca ? "checked" : ""}> Tiene hipoteca</label>
      <label class="check"><input type="checkbox" id="${p}-leasing" ${c.leasing ? "checked" : ""}> Está en leasing</label>
    </fieldset>`;
}

function validarEdificacion(p) {
  let ok = true;
  const dir = $(`#${p}-direccion`), bar = $(`#${p}-barrio`), pisos = $(`#${p}-pisos`);
  ok = marcarError(dir, dir.value.trim() ? "" : "Escriba la dirección.") && ok;
  ok = marcarError(bar, bar.value.trim() ? "" : "Escriba el barrio.") && ok;
  const n = Number(pisos.value);
  ok = marcarError(pisos, Number.isInteger(n) && n >= 1 ? "" : "El número de pisos debe ser un entero mayor o igual a 1.") && ok;
  return ok;
}

function leerEdificacion(p) {
  return {
    direccion: $(`#${p}-direccion`).value.trim(),
    comuna: $(`#${p}-comuna`).value,
    barrio: $(`#${p}-barrio`).value.trim(),
    sector: $(`#${p}-sector`).value,
    pisos: +$(`#${p}-pisos`).value,
    cobertura: { asegurada: $(`#${p}-asegurada`).checked, hipoteca: $(`#${p}-hipoteca`).checked, leasing: $(`#${p}-leasing`).checked },
  };
}

function camposInspeccion(p) {
  const ahora = new Date(); ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return `
    <div class="rejilla">
      <div class="campo"><label for="${p}-fecha">Fecha y hora</label><input id="${p}-fecha" type="datetime-local" value="${ahora.toISOString().slice(0, 16)}"></div>
      <div class="campo"><span class="campo__ayuda">Inspector</span><strong>${esc(usuarioActual())}</strong><span class="campo__ayuda">Se toma del usuario que inició sesión.</span></div>
    </div>
    <fieldset class="grupo">
      <legend>Sticker instalado</legend>
      <div class="elige-sticker">${["verde", "amarillo", "rojo"].map((s) => `
        <div class="opcion-sticker opcion-sticker--${s}">
          <input type="radio" name="${p}-sticker" id="${p}-st-${s}" value="${s}">
          <label for="${p}-st-${s}"><span class="sticker__banda">${STICKER[s].nombre}: ${STICKER[s].titulo.toLowerCase()}</span><span class="desc">${STICKER[s].texto}</span></label>
        </div>`).join("")}
      </div>
    </fieldset>
    <div class="campo"><label for="${p}-obs">Observaciones (opcional)</label><textarea id="${p}-obs" rows="3"></textarea></div>`;
}

function validarInspeccion(p) {
  let ok = true;
  const f = $(`#${p}-fecha`);
  const fecha = new Date(f.value);
  let msg = "";
  if (!f.value || isNaN(fecha)) msg = "Indique la fecha y hora.";
  else if (fecha > new Date()) msg = "La fecha no puede ser futura.";
  else if (fecha < FECHA_SISMO) msg = "La fecha no puede ser anterior al sismo (10 de agosto de 2026).";
  ok = marcarError(f, msg) && ok;
  const radio = $(`input[name=${p}-sticker]`);
  ok = marcarError(radio, $(`input[name=${p}-sticker]:checked`) ? "" : "Elija el sticker que instaló.") && ok;
  return ok;
}

function leerInspeccion(p) {
  return {
    fecha: new Date($(`#${p}-fecha`).value).toISOString(),
    sticker: $(`input[name=${p}-sticker]:checked`).value,
    observaciones: $(`#${p}-obs`).value.trim(),
    inspector: usuarioActual(),
  };
}

/* =========================================================
   ÁREA PÚBLICA: solo cifras agregadas (MOD-05, RN-09)
   ========================================================= */
function pintarPublico() {
  const porSticker = { rojo: 0, amarillo: 0, verde: 0 };
  const porComuna = {};
  const porRango = Object.fromEntries(RANGOS.map((r) => [r, 0]));

  // Un solo recorrido O(n) para todas las cifras
  for (const e of EDIFICACIONES) {
    for (const p of e.personas) porRango[rangoEtario(edad(p.nacimiento))]++;
    const s = stickerDe(e);
    if (!s) continue; // solo se cuentan las edificaciones inspeccionadas
    porSticker[s]++;
    (porComuna[e.comuna] ||= { rojo: 0, amarillo: 0, verde: 0 })[s]++;
  }
  const total = porSticker.rojo + porSticker.amarillo + porSticker.verde;

  $("#fecha-actualizacion").textContent = `Última actualización: ${fechaHora(estado.ultimaActualizacion)}`;
  $("#total-edif").textContent = fmt(total);

  const barra = $("#barra-stickers");
  barra.innerHTML = ORDEN_COLORES.map((s) => `<span class="barra__seg barra__seg--${s}" style="flex:${porSticker[s]}">${pct(porSticker[s], total)}</span>`).join("");
  barra.setAttribute("aria-label", ORDEN_COLORES.map((s) => `${STICKER[s].nombre}: ${fmt(porSticker[s])}`).join(", "));
  $("#leyenda-barra").innerHTML = ORDEN_COLORES.map((s) => `<li><span class="punto punto--${s}"></span>${STICKER[s].nombre}, ${STICKER[s].titulo.toLowerCase()}: <strong>${fmt(porSticker[s])}</strong></li>`).join("");

  $("#tarjetas-sticker").innerHTML = ORDEN_COLORES.map((s) => `
    <article class="sticker sticker--${s}">
      <div class="sticker__banda">${STICKER[s].titulo}</div>
      <div class="sticker__cuerpo">
        <p class="sticker__num">${fmt(porSticker[s])}</p>
        <p class="sticker__pct">${pct(porSticker[s], total)} de las edificaciones inspeccionadas</p>
        <p class="sticker__texto">${STICKER[s].texto}</p>
      </div>
    </article>`).join("");

  const filas = Object.entries(porComuna).map(([c, v]) => ({ c, ...v, t: v.rojo + v.amarillo + v.verde })).sort((a, b) => b.t - a.t);
  $("#tabla-comunas tbody").innerHTML = filas.map((f) => `<tr><th scope="row">${comunaTxt(f.c)}</th><td class="num">${fmt(f.rojo)}</td><td class="num">${fmt(f.amarillo)}</td><td class="num">${fmt(f.verde)}</td><td class="num"><strong>${fmt(f.t)}</strong></td></tr>`).join("");
  $("#tabla-comunas tfoot").innerHTML = `<tr><th scope="row">Total</th><td class="num">${fmt(porSticker.rojo)}</td><td class="num">${fmt(porSticker.amarillo)}</td><td class="num">${fmt(porSticker.verde)}</td><td class="num">${fmt(total)}</td></tr>`;

  barrasH($("#barras-edad"), RANGOS.map((r) => [r, porRango[r]]));

  $("#explica-stickers").innerHTML = ORDEN_COLORES.map((s) => `
    <article class="sticker sticker--${s}">
      <div class="sticker__banda">${STICKER[s].nombre}: ${STICKER[s].titulo.toLowerCase()}</div>
      <div class="sticker__cuerpo"><p>${STICKER[s].texto}</p></div>
    </article>`).join("");
}

/* =========================================================
   ÁREA PRIVADA
   ========================================================= */
const ICONOS = {
  panel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
  edificaciones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01"/></svg>',
  registrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15h6"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a5 5 0 0 0-4-4.9"/></svg>',
};

function pintarMenu(rutaActiva) {
  const items = [
    ["panel", "#panel", "Panel"],
    ["edificaciones", "#edificaciones", "Edificaciones"],
    ["registrar", "#nueva", "Registrar edificación"],
    ["usuarios", "#usuarios", "Usuarios"],
  ].filter(([perm]) => puede(perm));
  const mapa = { panel: "panel", edificaciones: "edificaciones", ficha: "edificaciones", nueva: "registrar", usuarios: "usuarios" };
  $("#menu-privado").innerHTML = items.map(([perm, href, txt]) =>
    `<li><a href="${href}" ${mapa[rutaActiva] === perm ? 'aria-current="page"' : ""}>${ICONOS[perm]}${txt}</a></li>`).join("");
  $("#nombre-usuario").textContent = usuarioActual();
  $("#selector-rol").value = estado.rol;
}

/* ---------- Panel: indicadores e inspecciones recientes ---------- */
function pintarPanel() {
  const cuenta = (s) => EDIFICACIONES.filter((e) => stickerDe(e) === s).length;
  const tarjetas = [
    ["", fmt(EDIFICACIONES.length), "Edificaciones registradas"],
    ["rojo", fmt(cuenta("rojo")), "Con sticker rojo"],
    ["amarillo", fmt(cuenta("amarillo")), "Con sticker amarillo"],
    ["", fmt(cuenta(null)), "Sin inspeccionar"],
  ];
  $("#indicadores-panel").innerHTML = tarjetas.map(([c, n, t]) => `<div class="indicador ${c ? "indicador--" + c : ""}"><span class="indicador__num">${n}</span><span class="indicador__txt">${t}</span></div>`).join("");

  const recientes = EDIFICACIONES.filter(fechaDe).sort((a, b) => new Date(fechaDe(b)) - new Date(fechaDe(a))).slice(0, 8);
  $("#recientes").innerHTML = recientes.map((e) => `
    <li>
      <span><a href="#ficha-${e.id}">${esc(e.direccion)}</a><small>${fechaCorta(fechaDe(e))}, ${esc(vigente(e).inspector)}</small></span>
      ${etiquetaSticker(stickerDe(e))}
    </li>`).join("");
}

/* ---------- Consulta con filtros combinables (RF-04-01, RF-04-02) ---------- */
const POR_PAGINA = 20;

function leerFiltros() {
  const tri = (id) => $(id).value; // "" indiferente, "si", "no"
  return {
    codigo: $("#f-codigo").value.trim(),
    comuna: $("#f-comuna").value,
    barrio: normalizar($("#f-barrio").value),
    sector: $("#f-sector").value,
    stickers: $$("input[name=f-sticker]:checked").map((c) => c.value),
    desde: $("#f-desde").value ? new Date($("#f-desde").value + "T00:00:00") : null,
    hasta: $("#f-hasta").value ? new Date($("#f-hasta").value + "T23:59:59") : null,
    asegurada: tri("#f-asegurada"),
    hipoteca: tri("#f-hipoteca"),
    leasing: tri("#f-leasing"),
    vinculo: $("#f-vinculo").value,
    rango: $("#f-rango").value,
    condicion: $("#f-condicion").value,
    poblacion: $("#f-poblacion").value,
  };
}

const cumpleTri = (valor, filtro) => !filtro || (filtro === "si") === valor;

// La persona debe cumplir todos los filtros de personas a la vez (RF-04-01 CA-2)
function personaCumple(p, f) {
  if (f.vinculo && p.vinculo !== f.vinculo) return false;
  if (f.rango && rangoEtario(edad(p.nacimiento)) !== f.rango) return false;
  if (f.condicion === "Ninguna" && p.condiciones.length) return false;
  if (f.condicion && f.condicion !== "Ninguna" && !p.condiciones.includes(f.condicion)) return false;
  if (f.poblacion && p.poblacion !== f.poblacion) return false;
  return true;
}

function cumple(e, f) {
  // Primero los filtros baratos; al final los que recorren personas
  if (f.comuna && e.comuna !== f.comuna) return false;
  if (f.sector && e.sector !== f.sector) return false;
  if (f.codigo && !e.codigo.includes(f.codigo)) return false;
  if (f.barrio && !normalizar(e.barrio).includes(f.barrio)) return false;
  if (!cumpleTri(e.cobertura.asegurada, f.asegurada) || !cumpleTri(e.cobertura.hipoteca, f.hipoteca) || !cumpleTri(e.cobertura.leasing, f.leasing)) return false;
  const s = stickerDe(e);
  if (f.stickers.length && !f.stickers.includes(s || "sin")) return false;
  if (f.desde || f.hasta) {
    const fecha = fechaDe(e);
    if (!fecha) return false;
    const d = new Date(fecha);
    if ((f.desde && d < f.desde) || (f.hasta && d > f.hasta)) return false;
  }
  if ((f.vinculo || f.rango || f.condicion || f.poblacion) && !e.personas.some((p) => personaCumple(p, f))) return false;
  return true;
}

function pintarConsulta() {
  const f = leerFiltros();
  // Orden fijo: última inspección más reciente primero; las no inspeccionadas al final
  const res = EDIFICACIONES.filter((e) => cumple(e, f)).sort((a, b) => (fechaDe(b) ? new Date(fechaDe(b)) : 0) - (fechaDe(a) ? new Date(fechaDe(a)) : 0));

  const paginas = Math.max(1, Math.ceil(res.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const desde = (estado.pagina - 1) * POR_PAGINA;
  const visibles = res.slice(desde, desde + POR_PAGINA);

  $("#conteo").textContent = res.length
    ? `${fmt(res.length)} edificaciones encontradas. Mostrando ${fmt(desde + 1)} a ${fmt(desde + visibles.length)}.`
    : "Ninguna edificación cumple todos los filtros.";

  $("#tabla-edif tbody").innerHTML = visibles.length ? visibles.map((e) => `
    <tr>
      <td><a href="#ficha-${e.id}">${e.codigo}</a></td>
      <td><strong>${esc(e.direccion)}</strong></td>
      <td>${comunaTxt(e.comuna)}<br><small>${esc(e.barrio)}</small></td>
      <td>${e.sector}</td>
      <td>${etiquetaSticker(stickerDe(e))}</td>
      <td>${fechaDe(e) ? fechaCorta(fechaDe(e)) : "—"}</td>
      <td class="num">${e.personas.length}</td>
      <td><a class="btn btn--fantasma btn--chico" href="#ficha-${e.id}">Ver ficha</a></td>
    </tr>`).join("")
    : `<tr class="vacio"><td colspan="8">Ninguna edificación cumple todos los filtros. Quite alguno o use <strong>Limpiar filtros</strong>.</td></tr>`;

  // Paginación compacta: primera, vecinas y última
  const nums = new Set([1, paginas, estado.pagina - 1, estado.pagina, estado.pagina + 1].filter((n) => n >= 1 && n <= paginas));
  const lista = [...nums].sort((a, b) => a - b);
  let html = `<button type="button" data-pag="${estado.pagina - 1}" ${estado.pagina === 1 ? "disabled" : ""} aria-label="Página anterior">‹</button>`;
  lista.forEach((n, i) => {
    if (i && n - lista[i - 1] > 1) html += `<span aria-hidden="true" style="align-self:center">…</span>`;
    html += `<button type="button" data-pag="${n}" ${n === estado.pagina ? 'aria-current="page"' : ""} aria-label="Página ${n}">${n}</button>`;
  });
  html += `<button type="button" data-pag="${estado.pagina + 1}" ${estado.pagina === paginas ? "disabled" : ""} aria-label="Página siguiente">›</button>`;
  $("#paginas").innerHTML = html;
}

/* ---------- Ficha de la edificación (RF-04-03) ---------- */
const buscarEdificacion = (id) => EDIFICACIONES.find((x) => x.id === +id);

function filaPersona(p, i) {
  const a = edad(p.nacimiento);
  if (estado.retirando === i) {
    // Confirmación dentro de la tabla (RF-03-04 CA-2): el mockup no usa confirm()
    return `<tr class="confirmar"><td colspan="7">
      <span>¿Retirar a <strong>${esc(p.nombres)} ${esc(p.apellidos)}</strong> de esta edificación?</span>
      <span class="confirmar__acciones">
        <button class="btn btn--peligro btn--chico" type="button" data-retirar-si="${i}">Sí, retirar</button>
        <button class="btn btn--fantasma btn--chico" type="button" data-retirar-no>Cancelar</button>
      </span></td></tr>`;
  }
  return `<tr>
    <td>${esc(p.nombres)} ${esc(p.apellidos)}</td>
    <td>${documentoTxt(p)}</td>
    <td>${p.vinculo}</td>
    <td>${a} años<br><small>${rangoEtario(a)}</small></td>
    <td>${condicionTxt(p)}</td>
    <td>${p.poblacion}</td>
    <td class="acciones-fila">
      <button class="btn btn--fantasma btn--chico" type="button" data-editar-persona="${i}">Editar</button>
      <button class="btn btn--fantasma btn--chico" type="button" data-retirar="${i}">Retirar</button>
    </td>
  </tr>`;
}

function pintarFicha(id) {
  const e = buscarEdificacion(id);
  if (!e) {
    $("#ficha").innerHTML = `<div class="vacio-grande"><h1 id="t-ficha">No encontramos esta edificación</h1><p>Puede que el enlace no sea correcto.</p><a class="btn btn--primario" href="#edificaciones">Volver a la consulta</a></div>`;
    return;
  }
  if (estado.fichaId !== e.id) estado.retirando = null;
  estado.fichaId = e.id;
  const s = stickerDe(e);
  const c = e.cobertura;
  const sino = (v) => (v ? "Sí" : "No");
  const historial = [...e.inspecciones].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  $("#ficha").innerHTML = `
    <a class="volver" href="#edificaciones">‹ Volver a la consulta</a>
    <p class="marca-pdf"><strong>Registro de Edificaciones.</strong> Reporte generado por ${esc(usuarioActual())} el ${new Date().toLocaleString("es-CO")}. Datos ficticios con fines académicos.</p>
    <div class="ficha-cab">
      <div class="sticker-mini sticker-mini--${s || "sin"}" role="img" aria-label="Sticker vigente: ${s ? `${STICKER[s].nombre}, ${STICKER[s].titulo}` : "sin inspeccionar"}">
        <div class="sticker-mini__banda">${s ? STICKER[s].nombre : "Sin sticker"}</div>
        <div class="sticker-mini__txt">${s ? STICKER[s].titulo : "Sin inspeccionar"}</div>
      </div>
      <div>
        <h1 id="t-ficha">${esc(e.direccion)}</h1>
        <p>${comunaTxt(e.comuna)}, ${esc(e.barrio)}. Código catastral ${e.codigo}</p>
      </div>
      <div class="ficha-acciones">
        <button class="btn btn--fantasma" type="button" id="btn-editar-edif">Editar edificación</button>
        <button class="btn btn--secundario" type="button" id="btn-nueva-insp">${s ? "Registrar reinspección" : "Registrar inspección"}</button>
        <button class="btn btn--primario" type="button" id="btn-pdf">Exportar PDF</button>
      </div>
    </div>

    <div class="ficha-rejilla">
      <section class="caja" aria-labelledby="t-ident">
        <h2 id="t-ident">Datos de la edificación</h2>
        <dl class="datos">
          <dt>Sector / uso</dt><dd>${e.sector}</dd>
          <dt>Número de pisos</dt><dd>${e.pisos}</dd>
          <dt>Comuna</dt><dd>${comunaTxt(e.comuna)}</dd>
          <dt>Barrio</dt><dd>${esc(e.barrio)}</dd>
        </dl>
      </section>

      <section class="caja" aria-labelledby="t-cob">
        <h2 id="t-cob">Cobertura</h2>
        <dl class="datos">
          <dt>Asegurada</dt><dd>${sino(c.asegurada)}</dd>
          <dt>Con hipoteca</dt><dd>${sino(c.hipoteca)}</dd>
          <dt>Con leasing</dt><dd>${sino(c.leasing)}</dd>
        </dl>
      </section>

      <section class="caja ancho" aria-labelledby="t-pers">
        <div class="caja__cab">
          <h2 id="t-pers">Personas ocupantes (${e.personas.length})</h2>
          <button class="btn btn--secundario btn--chico" type="button" id="btn-agregar-persona-ficha">Agregar persona</button>
        </div>
        ${e.personas.length ? `<div class="tabla-envoltura"><table class="tabla" id="tabla-personas-ficha">
          <thead><tr><th scope="col">Nombre</th><th scope="col">Documento</th><th scope="col">Vínculo</th><th scope="col">Edad</th><th scope="col">Condición</th><th scope="col">Población</th><th scope="col"><span class="sr">Acciones</span></th></tr></thead>
          <tbody>${e.personas.map(filaPersona).join("")}</tbody></table></div>` : '<p class="caja__nota">Sin registros de personas en esta edificación.</p>'}
      </section>

      <section class="caja ancho" aria-labelledby="t-hist">
        <h2 id="t-hist">Historial de inspecciones (${e.inspecciones.length})</h2>
        ${historial.length ? `<ol class="historial">
          ${historial.map((i, k) => `<li><b>${fechaHora(i.fecha)} ${etiquetaSticker(i.sticker)}${k === 0 ? ' <span class="etq etq--neutro">Vigente</span>' : ""}</b><small>Inspector: ${esc(i.inspector)}</small>${i.observaciones ? `<p class="historial__obs">${esc(i.observaciones)}</p>` : ""}</li>`).join("")}
        </ol>` : '<p class="caja__nota">Sin registros de inspecciones.</p>'}
      </section>
    </div>`;

  $("#btn-pdf").addEventListener("click", () => {
    // En el sistema real el backend genera el PDF con fecha, usuario y aviso de datos ficticios (RF-04-04)
    aviso(`Se generaría edificacion-${e.codigo}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.pdf. En este mockup no se descarga.`);
  });
  $("#btn-editar-edif").addEventListener("click", () => abrirEditarEdificacion(e));
  $("#btn-nueva-insp").addEventListener("click", () => abrirInspeccion(e));
  $("#btn-agregar-persona-ficha").addEventListener("click", () => abrirPersona(e.personas, null, () => { marcarCambio(); pintarFicha(e.id); }));
  const tabla = $("#tabla-personas-ficha");
  if (tabla) tabla.addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.editarPersona !== undefined) abrirPersona(e.personas, +b.dataset.editarPersona, () => { marcarCambio(); pintarFicha(e.id); });
    else if (b.dataset.retirar !== undefined) { estado.retirando = +b.dataset.retirar; pintarFicha(e.id); }
    else if (b.dataset.retirarNo !== undefined) { estado.retirando = null; pintarFicha(e.id); }
    else if (b.dataset.retirarSi !== undefined) {
      e.personas.splice(+b.dataset.retirarSi, 1);
      estado.retirando = null;
      marcarCambio();
      pintarFicha(e.id);
      aviso("Persona retirada de la edificación.");
    }
  });
}

/* ---------- Diálogos de la ficha ---------- */
let edifEnEdicion = null;
function abrirEditarEdificacion(e) {
  edifEnEdicion = e;
  $("#de-codigo").textContent = `Código catastral ${e.codigo} (no se puede cambiar).`;
  $("#de-campos").innerHTML = camposEdificacion("de", e);
  $("#dlg-edif").showModal();
}

let edifEnInspeccion = null;
function abrirInspeccion(e) {
  edifEnInspeccion = e;
  $("#t-dlg-insp").textContent = e.inspecciones.length ? "Registrar reinspección" : "Registrar inspección";
  $("#di-campos").innerHTML = camposInspeccion("di");
  $("#dlg-insp").showModal();
}

/* ---------- Persona: agregar y editar, con validación de duplicados (MOD-03) ---------- */
// Clave de duplicado dentro de la edificación (RN-06): documento, o nombre + fecha si no hay documento
function clavePersona(p) {
  return p.tipoDoc === "Sin documento"
    ? `sin|${normalizar(p.nombres + " " + p.apellidos)}|${p.nacimiento}`
    : `doc|${p.tipoDoc}|${p.documento.trim()}`;
}

function abrirPersona(lista, indice, alGuardar) {
  estado.personaCtx = { lista, indice, alGuardar };
  const p = indice === null ? null : lista[indice];
  const f = $("#form-persona");
  f.reset();
  limpiarErrores(f);
  $("#pe-dup").hidden = true;
  $("#t-dlg-persona").textContent = p ? "Editar persona" : "Agregar persona";
  $("#pe-guardar").textContent = p ? "Guardar cambios" : "Agregar persona";
  $("#pe-nombres").value = p?.nombres || "";
  $("#pe-apellidos").value = p?.apellidos || "";
  $("#pe-tipodoc").value = p?.tipoDoc || "Cédula de ciudadanía";
  $("#pe-doc").value = p?.documento || "";
  $("#pe-nac").value = p?.nacimiento || "";
  $("#pe-vinculo").value = p?.vinculo || "Propietario";
  $("#pe-poblacion").value = p?.poblacion || "Civil";
  const conds = p?.condiciones || [];
  $$("input[name=pe-cond]").forEach((c) => (c.checked = c.value === "Ninguna" ? !conds.length : conds.includes(c.value)));
  actualizarDocumento();
  actualizarRango();
  $("#dlg-persona").showModal();
}

function actualizarDocumento() {
  $("#pe-doc-campo").hidden = $("#pe-tipodoc").value === "Sin documento";
}
function actualizarRango() {
  const v = $("#pe-nac").value;
  $("#pe-rango").textContent = v && edad(v) >= 0 ? `${edad(v)} años: ${rangoEtario(edad(v))}` : "";
}

function guardarPersona(ev) {
  ev.preventDefault();
  const f = $("#form-persona");
  limpiarErrores(f);
  $("#pe-dup").hidden = true;
  const p = {
    nombres: $("#pe-nombres").value.trim(),
    apellidos: $("#pe-apellidos").value.trim(),
    tipoDoc: $("#pe-tipodoc").value,
    documento: $("#pe-tipodoc").value === "Sin documento" ? "" : $("#pe-doc").value.trim(),
    nacimiento: $("#pe-nac").value,
    vinculo: $("#pe-vinculo").value,
    condiciones: $$("input[name=pe-cond]:checked").map((c) => c.value).filter((v) => v !== "Ninguna"),
    poblacion: $("#pe-poblacion").value,
  };
  let ok = true;
  ok = marcarError($("#pe-nombres"), p.nombres ? "" : "Escriba los nombres.") && ok;
  ok = marcarError($("#pe-apellidos"), p.apellidos ? "" : "Escriba los apellidos.") && ok;
  if (p.tipoDoc !== "Sin documento") ok = marcarError($("#pe-doc"), p.documento ? "" : "Escriba el número de documento.") && ok;
  const nac = p.nacimiento ? new Date(p.nacimiento + "T00:00:00") : null;
  ok = marcarError($("#pe-nac"), !nac ? "Indique la fecha de nacimiento." : nac > HOY ? "La fecha de nacimiento no puede ser futura." : "") && ok;
  if (!ok) return;

  const { lista, indice, alGuardar } = estado.personaCtx;
  const clave = clavePersona(p);
  const repetida = lista.find((x, i) => i !== indice && clavePersona(x) === clave);
  if (repetida) {
    $("#pe-dup").textContent = p.tipoDoc === "Sin documento"
      ? `Ya hay una persona con el mismo nombre y fecha de nacimiento en esta edificación: ${repetida.nombres} ${repetida.apellidos}.`
      : `Ya hay una persona con ${p.tipoDoc.toLowerCase()} ${p.documento} en esta edificación.`;
    $("#pe-dup").hidden = false;
    return;
  }
  if (indice === null) lista.push(p);
  else lista[indice] = p;
  $("#dlg-persona").close();
  aviso(indice === null ? "Persona agregada." : "Persona actualizada.");
  alGuardar();
}

/* ---------- Registrar edificación en 3 pasos ---------- */
const PASOS = ["Edificación y cobertura", "Inspección", "Personas ocupantes"];

function reiniciarFormulario() {
  estado.personasNuevas = [];
  $("#w-catastral").value = "";
  $("#w-edif").innerHTML = camposEdificacion("w");
  $("#w-insp").innerHTML = camposInspeccion("w");
  limpiarErrores($("#form-insp"));
  $("#aviso-duplicado").hidden = true;
  pintarPersonasNuevas();
  irAPaso(1);
}

// Búsqueda en el índice hash (RF-02-01): si el código existe, se trabaja desde la ficha
function revisarDuplicado() {
  const codigo = $("#w-catastral").value.trim();
  const e = INDICE_CATASTRAL.get(codigo);
  const av = $("#aviso-duplicado");
  if (e) {
    av.innerHTML = `Esta edificación ya está registrada: <strong>${esc(e.direccion)}</strong>, ${comunaTxt(e.comuna).toLowerCase()}. <a href="#ficha-${e.id}">Abra su ficha</a> para registrar la reinspección o editar sus personas.`;
    av.hidden = false;
  } else {
    av.hidden = true;
  }
  return e;
}

function irAPaso(n) {
  estado.pasoActual = n;
  $$(".paso").forEach((p) => (p.hidden = +p.dataset.paso !== n));
  $("#pasos").innerHTML = PASOS.map((t, i) => `<li><button type="button" data-ir="${i + 1}" ${i + 1 === n ? 'aria-current="step"' : ""} class="${i + 1 < n ? "hecho" : ""}">${t}</button></li>`).join("");
  $("#btn-anterior").hidden = n === 1;
  $("#btn-siguiente").hidden = n === PASOS.length;
  $("#btn-registrar").hidden = n !== PASOS.length;
}

function validarPaso(n) {
  let ok = true;
  if (n === 1) {
    const cat = $("#w-catastral");
    const codigo = cat.value.trim();
    ok = marcarError(cat, !codigo ? "Escriba el código catastral." : revisarDuplicado() ? "Este código ya existe. Use la ficha de la edificación." : "") && ok;
    ok = validarEdificacion("w") && ok;
  }
  if (n === 2) ok = validarInspeccion("w");
  if (!ok) $("#form-insp [aria-invalid]")?.scrollIntoView({ block: "center", behavior: "smooth" });
  return ok;
}

function pintarPersonasNuevas() {
  $("#tabla-personas-nueva tbody").innerHTML = estado.personasNuevas.length ? estado.personasNuevas.map((p, i) => `
    <tr>
      <td>${esc(p.nombres)} ${esc(p.apellidos)}</td>
      <td>${documentoTxt(p)}</td>
      <td>${p.vinculo}</td>
      <td>${rangoEtario(edad(p.nacimiento))}</td>
      <td>${condicionTxt(p)}</td>
      <td class="acciones-fila">
        <button class="btn btn--fantasma btn--chico" type="button" data-editar="${i}">Editar</button>
        <button class="btn btn--fantasma btn--chico" type="button" data-quitar="${i}">Quitar</button>
      </td>
    </tr>`).join("") : `<tr class="vacio"><td colspan="6">Todavía no hay personas. Use <strong>Agregar persona</strong>.</td></tr>`;
}

function registrarEdificacion(ev) {
  ev.preventDefault();
  for (const n of [1, 2]) {
    if (!validarPaso(n)) { irAPaso(n); validarPaso(n); return; }
  }
  const codigo = $("#w-catastral").value.trim();
  const e = {
    id: EDIFICACIONES.length + 1,
    codigo,
    ...leerEdificacion("w"),
    inspecciones: [leerInspeccion("w")],
    personas: [...estado.personasNuevas],
  };
  EDIFICACIONES.push(e);
  INDICE_CATASTRAL.set(codigo, e);
  marcarCambio(); // las cifras públicas se recalculan
  aviso("Edificación e inspección registradas.");
  location.hash = `#ficha-${e.id}`;
}

/* ---------- Usuarios (RF-01-04, RF-01-05) ---------- */
function pintarUsuarios() {
  $("#tabla-usuarios tbody").innerHTML = USUARIOS.map((u, i) => `
    <tr>
      <td><strong>${esc(u.nombre)}</strong></td>
      <td>${esc(u.correo)}</td>
      <td>${u.rol}</td>
      <td>${u.activo ? '<span class="etq etq--verde">Activo</span>' : '<span class="etq etq--neutro">Inactivo</span>'}</td>
      <td>${u.nombre === usuarioActual()
        ? '<span class="caja__nota">Su cuenta</span>'
        : `<button class="btn btn--fantasma btn--chico" type="button" data-alternar="${i}">${u.activo ? "Desactivar" : "Activar"}</button>`}</td>
    </tr>`).join("");
}

function crearUsuario(ev) {
  ev.preventDefault();
  const f = $("#form-usuario");
  limpiarErrores(f);
  const nombre = $("#u-nombre"), correo = $("#u-correo"), clave = $("#u-clave");
  let ok = true;
  ok = marcarError(nombre, nombre.value.trim() ? "" : "Escriba el nombre completo.") && ok;
  const c = correo.value.trim().toLowerCase();
  ok = marcarError(correo, !/^\S+@\S+\.\S+$/.test(c) ? "Escriba un correo válido." : USUARIOS.some((u) => u.correo === c) ? "Ya existe un usuario con ese correo." : "") && ok;
  ok = marcarError(clave, clave.value.length >= 8 ? "" : "La contraseña inicial debe tener al menos 8 caracteres.") && ok;
  if (!ok) return;
  USUARIOS.push({ nombre: nombre.value.trim(), correo: c, rol: $("#u-rol").value, activo: true });
  $("#dlg-usuario").close();
  pintarUsuarios();
  aviso("Usuario creado.");
}

/* =========================================================
   Enrutador
   ========================================================= */
const TITULOS = {
  inicio: "Estado general", stickers: "Qué significa cada sticker", ingresar: "Iniciar sesión",
  panel: "Panel", edificaciones: "Edificaciones", ficha: "Ficha de edificación", nueva: "Registrar edificación",
  usuarios: "Usuarios", "sin-permiso": "Sin acceso",
};
const PERMISO_VISTA = { panel: "panel", edificaciones: "edificaciones", ficha: "ficha", nueva: "registrar", usuarios: "usuarios" };

let primeraCarga = true;
function enrutar() {
  // Rutas con nombres simples (#panel, #ficha-12...): el visor de artefactos solo admite #nombre
  const ruta = location.hash.replace(/^#\/?/, "") || "inicio";
  if (ruta === "contenido") return; // el enlace "Saltar al contenido" no es una ruta
  let vista = ruta, argumento = "";
  const m = ruta.match(/^ficha-(\d+)$/);
  if (m) { vista = "ficha"; argumento = m[1]; }
  if (!TITULOS[vista]) vista = "inicio";
  const privada = !["inicio", "stickers", "ingresar"].includes(vista);

  if (privada && !estado.conSesion) { location.hash = "#ingresar"; return; }
  if (privada && PERMISO_VISTA[vista] && !puede(PERMISO_VISTA[vista])) vista = "sin-permiso";

  document.body.classList.toggle("en-app", privada);
  $("#cabecera-publica").hidden = privada;
  $("#cabecera-privada").hidden = !privada;
  $("#lateral").hidden = !privada;
  $("#lateral").classList.remove("abierto");
  $("#btn-menu").setAttribute("aria-expanded", "false");
  $$(".vista").forEach((v) => (v.hidden = v.dataset.vista !== vista));
  $$(".nav-publica a").forEach((a) => (a.dataset.ruta === vista ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  document.title = `${TITULOS[vista]}. Registro de Edificaciones Sismo 2026`;

  if (privada) pintarMenu(vista);
  if (vista === "panel") pintarPanel();
  if (vista === "edificaciones") pintarConsulta();
  if (vista === "ficha") pintarFicha(argumento);
  if (vista === "nueva") reiniciarFormulario();
  if (vista === "usuarios") pintarUsuarios();

  if (!primeraCarga) { window.scrollTo(0, 0); $("#contenido").focus({ preventScroll: true }); }
  primeraCarga = false;
}

/* =========================================================
   Eventos
   ========================================================= */
function prepararCatalogos() {
  $("#f-comuna").innerHTML += opcionesHtml(COMUNAS, null, comunaTxt);
  $("#f-sector").innerHTML += opcionesHtml(SECTORES);
  $("#f-vinculo").innerHTML += opcionesHtml(VINCULOS);
  $("#f-rango").innerHTML += opcionesHtml(RANGOS);
  $("#f-condicion").innerHTML += opcionesHtml([...CONDICIONES, "Ninguna"]);
  $("#f-poblacion").innerHTML += opcionesHtml(POBLACIONES);
  $$("[data-tri]").forEach((s) => (s.innerHTML = '<option value="">Indiferente</option><option value="si">Sí</option><option value="no">No</option>'));

  $("#pe-tipodoc").innerHTML = opcionesHtml(TIPOS_DOC);
  $("#pe-vinculo").innerHTML = opcionesHtml(VINCULOS);
  $("#pe-poblacion").innerHTML = opcionesHtml(POBLACIONES);
  $("#pe-condiciones").insertAdjacentHTML("beforeend", [...CONDICIONES, "Ninguna"].map((c) =>
    `<label class="check"><input type="checkbox" name="pe-cond" value="${c}"> ${c}</label>`).join(""));
}

function iniciar() {
  pintarPublico();
  prepararCatalogos();

  // Ingreso (simulado)
  $("#form-ingreso").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const u = $("#correo"), c = $("#clave");
    $("#err-correo").hidden = !!u.value.trim();
    $("#err-clave").hidden = !!c.value.trim();
    u.setAttribute("aria-invalid", String(!u.value.trim()));
    c.setAttribute("aria-invalid", String(!c.value.trim()));
    if (!u.value.trim()) return u.focus();
    if (!c.value.trim()) return c.focus();
    estado.conSesion = true;
    guardarSesion();
    c.value = "";
    location.hash = "#panel";
  });

  $("#btn-salir").addEventListener("click", () => {
    estado.conSesion = false;
    guardarSesion();
    aviso("Sesión cerrada.");
  });

  $("#selector-rol").addEventListener("change", (ev) => {
    estado.rol = ev.target.value;
    guardarSesion();
    aviso(`Viendo el sistema como ${ROLES[estado.rol].etiqueta.toLowerCase()}.`);
    enrutar();
  });

  $("#btn-menu").addEventListener("click", () => {
    const abierto = $("#lateral").classList.toggle("abierto");
    $("#btn-menu").setAttribute("aria-expanded", String(abierto));
  });

  // Consulta
  let espera;
  $("#filtros").addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(() => { estado.pagina = 1; pintarConsulta(); }, 120); });
  $("#filtros").addEventListener("submit", (ev) => ev.preventDefault());
  $("#filtros").addEventListener("reset", () => setTimeout(() => { estado.pagina = 1; pintarConsulta(); }));
  $("#paginas").addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-pag]");
    if (!b || b.disabled) return;
    estado.pagina = +b.dataset.pag;
    pintarConsulta();
    $("#tabla-edif").scrollIntoView({ block: "start", behavior: "smooth" });
  });

  // Registro por pasos
  $("#w-catastral").addEventListener("input", revisarDuplicado);
  $("#btn-siguiente").addEventListener("click", () => { if (validarPaso(estado.pasoActual)) irAPaso(estado.pasoActual + 1); });
  $("#btn-anterior").addEventListener("click", () => irAPaso(estado.pasoActual - 1));
  $("#pasos").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ir]");
    if (!b) return;
    const destino = +b.dataset.ir;
    for (let n = estado.pasoActual; n < destino; n++) if (!validarPaso(n)) return irAPaso(n);
    irAPaso(destino);
  });
  $("#btn-agregar-persona").addEventListener("click", () => abrirPersona(estado.personasNuevas, null, pintarPersonasNuevas));
  $("#tabla-personas-nueva").addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.quitar !== undefined) { estado.personasNuevas.splice(+b.dataset.quitar, 1); pintarPersonasNuevas(); }
    if (b.dataset.editar !== undefined) abrirPersona(estado.personasNuevas, +b.dataset.editar, pintarPersonasNuevas);
  });
  $("#form-insp").addEventListener("submit", registrarEdificacion);

  // Diálogos
  $$("[data-cerrar]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
  $("#form-persona").addEventListener("submit", guardarPersona);
  $("#pe-tipodoc").addEventListener("change", actualizarDocumento);
  $("#pe-nac").addEventListener("input", actualizarRango);
  // "Ninguna" excluye las demás condiciones (RF-03-01 CA-3)
  $("#pe-condiciones").addEventListener("change", (ev) => {
    const c = ev.target;
    const ninguna = $("input[name=pe-cond][value=Ninguna]");
    if (c.value === "Ninguna" && c.checked) $$("input[name=pe-cond]").forEach((x) => { if (x !== c) x.checked = false; });
    else if (c.checked) ninguna.checked = false;
    if (!$("input[name=pe-cond]:checked")) ninguna.checked = true;
  });

  $("#form-edif").addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!validarEdificacion("de")) return;
    Object.assign(edifEnEdicion, leerEdificacion("de"));
    $("#dlg-edif").close();
    marcarCambio();
    pintarFicha(edifEnEdicion.id);
    aviso("Edificación actualizada.");
  });

  $("#form-dlg-insp").addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!validarInspeccion("di")) return;
    edifEnInspeccion.inspecciones.push(leerInspeccion("di"));
    $("#dlg-insp").close();
    marcarCambio();
    pintarFicha(edifEnInspeccion.id);
    aviso("Inspección registrada. El sticker vigente es el de la inspección más reciente.");
  });

  // Usuarios
  $("#btn-crear-usuario").addEventListener("click", () => { $("#form-usuario").reset(); limpiarErrores($("#form-usuario")); $("#dlg-usuario").showModal(); });
  $("#form-usuario").addEventListener("submit", crearUsuario);
  $("#tabla-usuarios").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-alternar]");
    if (!b) return;
    const u = USUARIOS[+b.dataset.alternar];
    u.activo = !u.activo;
    pintarUsuarios();
    aviso(u.activo ? "Usuario activado." : "Usuario desactivado.");
  });

  window.addEventListener("hashchange", enrutar);
  enrutar();
}

iniciar();
