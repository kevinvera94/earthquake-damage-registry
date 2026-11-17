/* ==========================================================
   Registro de Edificaciones — lógica del mockup
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
  const n = new Date(nacimiento);
  let e = ref.getFullYear() - n.getFullYear();
  const m = ref.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < n.getDate())) e--;
  return e;
}
// Rangos excluyentes (BRIEF §10.3, supuesto S-08)
function rangoEtario(e) {
  if (e < 10) return "0 a 9 años";
  if (e < 18) return "10 a 17 años";
  if (e < 60) return "18 a 59 años";
  return "60 años o más";
}
const RANGOS = ["0 a 9 años", "10 a 17 años", "18 a 59 años", "60 años o más"];

const fechaLarga = (d) => new Date(d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
const fechaCorta = (d) => new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
const diasDesde = (d) => Math.max(0, Math.floor((HOY - new Date(d)) / 86400000));

/* ---------------- Catálogos ---------------- */
const STICKER = {
  rojo: { nombre: "Rojo", titulo: "Inseguro", texto: "No se puede ingresar ni habitar. Riesgo para la vida." },
  amarillo: { nombre: "Amarillo", titulo: "Uso restringido", texto: "Solo se permite el ingreso a zonas autorizadas o por tiempo limitado." },
  verde: { nombre: "Verde", titulo: "Sin restricción", texto: "La edificación puede usarse con normalidad." },
};
const ORDEN_STICKER = { rojo: 3, amarillo: 2, verde: 1 };

const NIVELES_IDIGER = ["", "Habitable", "Uso restringido", "No habitable", "Peligro de colapso"];
const NIVEL_A_STICKER = { 1: "verde", 2: "amarillo", 3: "rojo", 4: "rojo" };
const EVALUACIONES = [
  ["A", "Estado general"],
  ["B", "Problemas geotécnicos"],
  ["C", "Elementos no estructurales"],
  ["D", "Elementos estructurales"],
  ["E", "Problemas del entorno"],
];

const COMUNAS = {
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
};
const PESO_COMUNA = [[1, 6], [2, 11], [3, 13], [4, 6], [9, 10], [10, 9], [11, 6], [13, 7], [17, 6], [18, 8], [19, 12], [20, 14]];

const USOS = ["Residencial", "Comercial", "Educacional", "Salud", "Hotelero", "Oficinas", "Industrial", "Institucional", "Bodegas", "Estacionamientos", "Otros"];
const SISTEMAS = ["Mampostería confinada", "Mampostería no reforzada", "Mampostería reforzada", "Concreto reforzado: pórticos", "Concreto reforzado: muros", "Acero", "Madera", "Bahareque o tapia", "Mixta", "Precario"];
const PERIODOS = ["Antes de 1960", "1960 a 1985", "1986 a 1999", "2000 a 2011", "Desde 2012"];
const TIPOS_DOC = ["Registro civil", "Tarjeta de identidad", "Cédula de ciudadanía", "Cédula de extranjería", "Pasaporte", "Menor sin identificación", "Adulto sin identificación", "No informa", "NIT", "Otro"];
const VINCULOS = ["Propietario", "Arrendatario", "Poseedor", "Ocupante", "No informa"];
const ASEGURADORAS = ["Seguros Andinos del Valle", "Aseguradora Pacífico Sur", "Previsión Farallones", "Seguros La Ermita"];
const ENTIDADES = ["Banco Cordillera", "Cooperativa Río Cali", "Banco del Occidente Sur", "Fondo Vivienda Valle"];

const NOMBRES_F = ["María", "Luisa", "Valentina", "Daniela", "Camila", "Sofía", "Ana", "Carolina", "Gloria", "Martha", "Paola", "Isabella", "Mariana", "Diana", "Rosa", "Lucía", "Natalia", "Sara"];
const NOMBRES_M = ["Juan", "Carlos", "Andrés", "Santiago", "Luis", "Jorge", "Felipe", "Diego", "Mateo", "Samuel", "José", "Óscar", "Héctor", "Julián", "Miguel", "Sebastián", "Tomás", "Esteban"];
const APELLIDOS = ["García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Gómez", "Díaz", "Vargas", "Ramírez", "Castillo", "Mosquera", "Valencia", "Caicedo", "Rengifo", "Ospina", "Zapata", "Cuero", "Angulo", "Bermúdez", "Quintero", "Muñoz", "Restrepo", "Hurtado"];

const USUARIOS = [
  { nombre: "Mariana Ortiz", usuario: "mortiz", rol: "Administrador", activo: true },
  { nombre: "Laura Méndez", usuario: "lmendez", rol: "Inspector", codigo: "P3-0142", activo: true },
  { nombre: "Andrés Cárdenas", usuario: "acardenas", rol: "Inspector", codigo: "P2-0087", activo: true },
  { nombre: "Paola Quintero", usuario: "pquintero", rol: "Inspector", codigo: "P4-0213", activo: true },
  { nombre: "Julián Rengifo", usuario: "jrengifo", rol: "Inspector", codigo: "P3-0175", activo: true },
  { nombre: "Catalina Mejía", usuario: "cmejia", rol: "Inspector", codigo: "P5-0301", activo: false },
  { nombre: "Felipe Arango", usuario: "farango", rol: "Consulta", activo: true },
];
const INSPECTORES = USUARIOS.filter((u) => u.rol === "Inspector");

const ROLES = {
  admin: { etiqueta: "Administrador", usuario: "Mariana Ortiz", permisos: ["panel", "edificaciones", "ficha", "registrar", "reportes", "usuarios", "demoler", "exportar"] },
  inspector: { etiqueta: "Inspector", usuario: "Laura Méndez", permisos: ["panel", "edificaciones", "ficha", "registrar", "exportar"] },
  consulta: { etiqueta: "Consulta", usuario: "Felipe Arango", permisos: ["panel", "edificaciones", "ficha", "reportes", "exportar"] },
};

const ESTADOS_DEMOLICION = ["ninguno", "concepto", "demolida", "escombros"];
const TXT_DEMOLICION = { ninguno: "Sin concepto", concepto: "Concepto aprobado", demolida: "Demolida", escombros: "Escombros retirados" };

/* ---------------- Datos ficticios ---------------- */
function fechaAleatoria(desde, hasta) {
  const a = new Date(desde).getTime(), b = new Date(hasta).getTime();
  return new Date(a + rnd() * (b - a));
}

function generarPersona(stickerFinal, vinculoHogar) {
  const rango = pesado([[0, 12], [1, 16], [2, 54], [3, 18]]);
  const [min, max] = [[0, 9], [10, 17], [18, 59], [60, 92]][rango];
  const anios = entre(min, max);
  const nac = new Date(2026, entre(0, 11), entre(1, 28));
  nac.setFullYear(nac.getFullYear() - anios - 1);
  const genero = pesado([["Femenino", 51], ["Masculino", 48.5], ["Transgénero", 0.5]]);
  const nombre = uno(genero === "Masculino" ? NOMBRES_M : NOMBRES_F);
  const e = edad(nac);
  let tipoDoc = e < 7 ? "Registro civil" : e < 18 ? "Tarjeta de identidad" : "Cédula de ciudadanía";
  if (rnd() < 0.03) tipoDoc = e < 18 ? "Menor sin identificación" : "Adulto sin identificación";
  const condiciones = [];
  if (rnd() < 0.045) condiciones.push("Discapacidad");
  if (rnd() < 0.06 || e >= 75) condiciones.push("Persona vulnerable");
  if (rnd() < 0.02) condiciones.push("Necesidad especial");
  return {
    nombres: nombre,
    apellidos: `${uno(APELLIDOS)} ${uno(APELLIDOS)}`,
    tipoDoc,
    documento: tipoDoc.includes("sin") ? "" : String(entre(10000000, 1199999999)),
    nacimiento: nac.toISOString().slice(0, 10),
    vinculo: e < 18 ? vinculoHogar : (rnd() < 0.9 ? vinculoHogar : uno(VINCULOS)),
    genero,
    condiciones,
    poblacion: pesado([["Civil", 980], ["Militar", 15], ["Carcelaria", 5]]),
    estado: pesado([["Ileso", 80], ["Afectado", 15], ["Herido", 4.5], ["Fallecido", 0.5]]),
    presencia: rnd() < 0.7,
    alojamiento: stickerFinal === "rojo" ? "Evacuado fuera de su residencia" : "Lugar habitual de su residencia",
  };
}

function generarEdificaciones(n) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    const comuna = i === 0 ? 1 : pesado(PESO_COMUNA);
    const stickerFinal = pesado([["rojo", 26.5], ["amarillo", 38.4], ["verde", 35.1]]);
    const uso = pesado([["Residencial", 72], ["Comercial", 15], ["Educacional", 2.5], ["Salud", 1.5], ["Oficinas", 3], ["Institucional", 1.5], ["Bodegas", 2], ["Industrial", 1], ["Hotelero", 1], ["Otros", 0.5]]);

    // Historial de inspecciones: la primera es la rápida; las siguientes son reinspecciones
    const nInsp = stickerFinal === "verde" ? pesado([[1, 85], [2, 15]]) : pesado([[1, 55], [2, 35], [3, 10]]);
    const inspecciones = [];
    let fecha = fechaAleatoria("2026-08-11", nInsp > 1 ? "2026-09-10" : "2026-11-08");
    for (let k = 0; k < nInsp; k++) {
      const ultima = k === nInsp - 1;
      // Antes de una reinspección el sticker era igual o peor
      const s = ultima ? stickerFinal : uno(["rojo", "amarillo", stickerFinal].filter((x) => ORDEN_STICKER[x] >= ORDEN_STICKER[stickerFinal]));
      const detallada = s !== "verde";
      const nivel = s === "verde" ? 1 : s === "amarillo" ? 2 : pesado([[3, 70], [4, 30]]);
      const evals = EVALUACIONES.map(() => entre(1, nivel));
      evals[entre(0, 4)] = nivel; // la más crítica define la global
      const insp = USUARIOS.length && uno(INSPECTORES);
      inspecciones.push({
        fecha: fecha.toISOString(),
        fase: k === 0 ? "Inspección rápida" + (detallada ? " y evaluación en detalle" : "") : "Reinspección",
        tipo: pesado([["Completa", 70], ["Parcial", 20], ["Exterior solamente", 10]]),
        sticker: s,
        nivel,
        evals,
        inspector: insp.nombre,
        codigoInspector: insp.codigo,
        estado: ultima ? (rnd() < 0.86 ? "Validada" : "Por validar") : "Validada",
      });
      fecha = new Date(fecha.getTime() + entre(12, 50) * 86400000);
      if (fecha > HOY) fecha = new Date(HOY.getTime() - entre(1, 5) * 86400000);
    }

    let demolicion = "ninguno";
    if (stickerFinal === "rojo" && rnd() < 0.04) {
      demolicion = "concepto";
      if (rnd() < 0.15) demolicion = rnd() < 0.4 ? "escombros" : "demolida";
    }

    const vinculoHogar = rnd() < 0.62 ? "Propietario" : "Arrendatario";
    const nPersonas = uso === "Residencial" ? pesado([[1, 12], [2, 22], [3, 24], [4, 20], [5, 12], [6, 6], [7, 4]]) : pesado([[0, 40], [1, 30], [2, 20], [3, 10]]);
    const personas = Array.from({ length: nPersonas }, () => generarPersona(stickerFinal, vinculoHogar));

    const asegurada = rnd() < 0.24;
    const hipoteca = rnd() < 0.19;
    const leasing = rnd() < 0.032;
    const via = pesado([["Calle", 45], ["Carrera", 40], ["Diagonal", 6], ["Transversal", 5], ["Avenida", 4]]);

    lista.push({
      id: i + 1,
      codigo: i === 0 ? "7600101020041" : `76001${pad(comuna, 2)}${pad(100000 + i * 3 + entre(0, 2), 6)}`,
      direccion: `${via} ${entre(1, 72)}${rnd() < 0.2 ? uno(["A", "B", "C"]) : ""} # ${entre(1, 99)}-${entre(2, 98)}`,
      comuna,
      barrio: uno(COMUNAS[comuna]),
      zona: comuna === 1 && rnd() < 0.3 ? "Rural" : "Urbana",
      uso,
      pisos: uso === "Residencial" ? pesado([[1, 35], [2, 38], [3, 17], [4, 6], [5, 3], [8, 1]]) : entre(1, 6),
      sistema: pesado([[SISTEMAS[0], 45], [SISTEMAS[1], 15], [SISTEMAS[2], 4], [SISTEMAS[3], 22], [SISTEMAS[4], 3], [SISTEMAS[5], 2], [SISTEMAS[7], 4], [SISTEMAS[8], 3], [SISTEMAS[9], 2]]),
      periodo: pesado([[PERIODOS[0], 10], [PERIODOS[1], 32], [PERIODOS[2], 25], [PERIODOS[3], 20], [PERIODOS[4], 13]]),
      inspecciones,
      personas,
      cobertura: {
        asegurada, aseguradora: asegurada ? uno(ASEGURADORAS) : "", poliza: asegurada ? `POL-${entre(100000, 999999)}` : "",
        hipoteca, entidadHipoteca: hipoteca ? uno(ENTIDADES) : "",
        leasing, entidadLeasing: leasing ? uno(ENTIDADES) : "",
      },
      demolicion,
      contacto: `${uno(NOMBRES_F.concat(NOMBRES_M))} ${uno(APELLIDOS)}`,
      exportaciones: [],
    });
  }
  return lista;
}

const EDIFICACIONES = generarEdificaciones(5812);

// Índice hash por código catastral: búsqueda de duplicados en O(1) promedio (BRIEF §13)
const INDICE_CATASTRAL = new Map(EDIFICACIONES.map((e) => [e.codigo, e]));

const ultima = (e) => e.inspecciones[e.inspecciones.length - 1];
const stickerDe = (e) => ultima(e).sticker;
const fechaDe = (e) => ultima(e).fecha;

/* ---------------- Estado de sesión ---------------- */
const estado = {
  rol: "admin",
  conSesion: false,
  pagina: 1,
  orden: { campo: "fecha", dir: "desc" },
  pasoActual: 1,
  personasNuevas: [],
};
try {
  estado.conSesion = sessionStorage.getItem("sesion") === "1";
  estado.rol = sessionStorage.getItem("rol") || "admin";
} catch (_) { /* almacenamiento bloqueado: el mockup funciona igual */ }

function guardarSesion() {
  try {
    sessionStorage.setItem("sesion", estado.conSesion ? "1" : "0");
    sessionStorage.setItem("rol", estado.rol);
  } catch (_) {}
}
const puede = (permiso) => ROLES[estado.rol].permisos.includes(permiso);
const usuarioActual = () => ROLES[estado.rol].usuario;

// El inspector solo ve las edificaciones que inspeccionó
function alcance() {
  if (estado.rol === "inspector") return EDIFICACIONES.filter((e) => e.inspecciones.some((i) => i.inspector === usuarioActual()));
  return EDIFICACIONES;
}

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
const etiquetaSticker = (s) => `<span class="etq etq--${s}">${STICKER[s].nombre}</span>`;
function chipsCobertura(c) {
  const chips = [c.asegurada ? "Asegurada" : "No asegurada"];
  if (c.hipoteca) chips.push("Hipoteca");
  if (c.leasing) chips.push("Leasing");
  return `<span class="chips">${chips.map((x) => `<span class="etq etq--neutro">${x}</span>`).join("")}</span>`;
}
function barrasH(contenedor, filas, total) {
  const max = Math.max(...filas.map((f) => f[1]), 1);
  contenedor.innerHTML = filas.map(([etq, v]) => `
    <div class="barra-h">
      <span>${etq}</span>
      <span class="barra-h__pista" aria-hidden="true"><span class="barra-h__relleno" style="width:${(v / max) * 100}%"></span></span>
      <span class="barra-h__valor">${fmt(v)}</span>
    </div>`).join("") + (total ? "" : "");
}

/* =========================================================
   ÁREA PÚBLICA: solo cifras agregadas (BRIEF §11 y §12.1)
   ========================================================= */
function pintarPublico() {
  const total = EDIFICACIONES.length;
  const porSticker = { rojo: 0, amarillo: 0, verde: 0 };
  const demol = { concepto: 0, demolida: 0, escombros: 0 };
  const porComuna = {};
  const porRango = Object.fromEntries(RANGOS.map((r) => [r, 0]));
  const cob = { asegurada: 0, noAsegurada: 0, hipoteca: 0, leasing: 0 };

  // Un solo recorrido O(n) para todas las cifras
  for (const e of EDIFICACIONES) {
    const s = stickerDe(e);
    porSticker[s]++;
    const iDem = ESTADOS_DEMOLICION.indexOf(e.demolicion);
    if (iDem >= 1) demol.concepto++;
    if (iDem >= 2) demol.demolida++;
    if (iDem >= 3) demol.escombros++;
    (porComuna[e.comuna] ||= { rojo: 0, amarillo: 0, verde: 0 })[s]++;
    for (const p of e.personas) porRango[rangoEtario(edad(p.nacimiento))]++;
    e.cobertura.asegurada ? cob.asegurada++ : cob.noAsegurada++;
    if (e.cobertura.hipoteca) cob.hipoteca++;
    if (e.cobertura.leasing) cob.leasing++;
  }

  $("#fecha-corte").textContent = `Corte: ${fechaLarga(HOY)}`;
  $("#total-edif").textContent = fmt(total);

  const orden = ["rojo", "amarillo", "verde"];
  const barra = $("#barra-stickers");
  barra.innerHTML = orden.map((s) => `<span class="barra__seg barra__seg--${s}" style="flex:${porSticker[s]}">${pct(porSticker[s], total)}</span>`).join("");
  barra.setAttribute("aria-label", orden.map((s) => `${STICKER[s].nombre}: ${fmt(porSticker[s])}`).join(", "));
  $("#leyenda-barra").innerHTML = orden.map((s) => `<li><span class="punto punto--${s}"></span>${STICKER[s].nombre}, ${STICKER[s].titulo.toLowerCase()}: <strong>${fmt(porSticker[s])}</strong></li>`).join("");

  $("#tarjetas-sticker").innerHTML = orden.map((s) => `
    <article class="sticker sticker--${s}">
      <div class="sticker__banda">${STICKER[s].titulo}</div>
      <div class="sticker__cuerpo">
        <p class="sticker__num">${fmt(porSticker[s])}</p>
        <p class="sticker__pct">${pct(porSticker[s], total)} de las edificaciones inspeccionadas</p>
        <p class="sticker__texto">${STICKER[s].texto}</p>
      </div>
    </article>`).join("");

  $("#proceso-demolicion").innerHTML = [
    [demol.concepto, "Edificaciones con concepto de demolición aprobado"],
    [demol.demolida, "Edificaciones demolidas"],
    [demol.escombros, "Puntos con escombros retirados"],
  ].map(([n, t]) => `<li><span class="proceso__num">${fmt(n)}</span><span class="proceso__txt">${t}</span></li>`).join("");

  const filas = Object.entries(porComuna).map(([c, v]) => ({ c: +c, ...v, t: v.rojo + v.amarillo + v.verde })).sort((a, b) => b.t - a.t);
  $("#tabla-comunas tbody").innerHTML = filas.map((f) => `<tr><th scope="row">Comuna ${f.c}</th><td class="num">${fmt(f.rojo)}</td><td class="num">${fmt(f.amarillo)}</td><td class="num">${fmt(f.verde)}</td><td class="num"><strong>${fmt(f.t)}</strong></td></tr>`).join("");
  $("#tabla-comunas tfoot").innerHTML = `<tr><th scope="row">Total</th><td class="num">${fmt(porSticker.rojo)}</td><td class="num">${fmt(porSticker.amarillo)}</td><td class="num">${fmt(porSticker.verde)}</td><td class="num">${fmt(total)}</td></tr>`;

  barrasH($("#barras-edad"), RANGOS.map((r) => [r, porRango[r]]));
  barrasH($("#barras-cobertura"), [["Aseguradas", cob.asegurada], ["No aseguradas", cob.noAsegurada], ["Con hipoteca", cob.hipoteca], ["Con leasing", cob.leasing]]);

  $("#explica-stickers").innerHTML = orden.map((s) => `
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
  reportes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a5 5 0 0 0-4-4.9"/></svg>',
};

function pintarMenu(rutaActiva) {
  const items = [
    ["panel", "#panel", "Panel"],
    ["edificaciones", "#edificaciones", estado.rol === "inspector" ? "Mis edificaciones" : "Edificaciones"],
    ["registrar", "#nueva", "Registrar inspección"],
    ["reportes", "#reportes", "Reportes"],
    ["usuarios", "#usuarios", "Usuarios"],
  ].filter(([perm]) => puede(perm));
  const mapa = { panel: "panel", edificaciones: "edificaciones", ficha: "edificaciones", nueva: "registrar", reportes: "reportes", usuarios: "usuarios" };
  $("#menu-privado").innerHTML = items.map(([perm, href, txt]) =>
    `<li><a href="${href}" ${mapa[rutaActiva] === perm ? 'aria-current="page"' : ""}>${ICONOS[perm]}${txt}</a></li>`).join("");
  $("#nombre-usuario").textContent = usuarioActual();
  $("#selector-rol").value = estado.rol;
  $$("[data-permiso]").forEach((el) => (el.hidden = !puede(el.dataset.permiso)));
}

/* ---------- Cola de prioridad (montículo binario) ----------
   Insertar y extraer cuestan O(log n). Se usa para ordenar
   qué edificación reinspeccionar primero (BRIEF §13).        */
class ColaPrioridad {
  constructor() { this.h = []; }
  get tamano() { return this.h.length; }
  insertar(item, prioridad) {
    this.h.push({ item, prioridad });
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p].prioridad >= this.h[i].prioridad) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
      i = p;
    }
  }
  extraer() {
    const tope = this.h[0];
    const ult = this.h.pop();
    if (this.h.length) {
      this.h[0] = ult;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < this.h.length && this.h[l].prioridad > this.h[m].prioridad) m = l;
        if (r < this.h.length && this.h[r].prioridad > this.h[m].prioridad) m = r;
        if (m === i) break;
        [this.h[m], this.h[i]] = [this.h[i], this.h[m]];
        i = m;
      }
    }
    return tope;
  }
}

function puntajePrioridad(e) {
  const s = stickerDe(e);
  const vulnerables = e.personas.filter((p) => { const a = edad(p.nacimiento); return a < 10 || a >= 60 || p.condiciones.length; }).length;
  return Math.round((s === "rojo" ? 50 : 30) + vulnerables * 8 + diasDesde(fechaDe(e)) * 0.4);
}

function pintarPanel() {
  const datos = alcance();
  const cuenta = (s) => datos.filter((e) => stickerDe(e) === s).length;
  const porValidar = datos.filter((e) => ultima(e).estado === "Por validar").length;
  const tarjetas = [
    ["", fmt(datos.length), estado.rol === "inspector" ? "Edificaciones que ha inspeccionado" : "Edificaciones registradas"],
    ["rojo", fmt(cuenta("rojo")), "Con sticker rojo"],
    ["amarillo", fmt(cuenta("amarillo")), "Con sticker amarillo"],
    ["", fmt(porValidar), estado.rol === "admin" ? "Inspecciones por validar" : "Inspecciones pendientes de validación"],
  ];
  $("#indicadores-panel").innerHTML = tarjetas.map(([c, n, t]) => `<div class="indicador ${c ? "indicador--" + c : ""}"><span class="indicador__num">${n}</span><span class="indicador__txt">${t}</span></div>`).join("");

  const cola = new ColaPrioridad();
  for (const e of datos) {
    if (stickerDe(e) !== "verde" && e.demolicion === "ninguno") cola.insertar(e, puntajePrioridad(e));
  }
  const top = [];
  while (top.length < 6 && cola.tamano) top.push(cola.extraer());
  $("#cola-prioridad").innerHTML = top.map(({ item: e, prioridad }, i) => `
    <li>
      <span class="cola__pos" aria-hidden="true">${i + 1}</span>
      <span>
        <a class="cola__dir" href="#ficha-${e.id}">${esc(e.direccion)}</a>
        <span class="cola__det">Comuna ${e.comuna}, ${esc(e.barrio)}. ${etiquetaSticker(stickerDe(e))} hace ${diasDesde(fechaDe(e))} días</span>
      </span>
      <span class="cola__puntaje"><strong>${prioridad}</strong>puntos</span>
    </li>`).join("") || "<li>No hay edificaciones pendientes.</li>";

  const recientes = [...datos].sort((a, b) => new Date(fechaDe(b)) - new Date(fechaDe(a))).slice(0, 6);
  $("#recientes").innerHTML = recientes.map((e) => `
    <li>
      <span><a href="#ficha-${e.id}">${esc(e.direccion)}</a><small>${fechaCorta(fechaDe(e))}, ${esc(ultima(e).inspector)}</small></span>
      ${etiquetaSticker(stickerDe(e))}
    </li>`).join("");
}

/* ---------- Consulta con filtros combinables ---------- */
const POR_PAGINA = 15;

function leerFiltros() {
  return {
    texto: $("#f-buscar").value.trim().toLowerCase(),
    comuna: $("#f-comuna").value,
    sticker: $("#f-sticker").value,
    demolicion: $("#f-demolicion").value,
    asegurada: $("#f-asegurada").checked,
    noAsegurada: $("#f-noasegurada").checked,
    hipoteca: $("#f-hipoteca").checked,
    leasing: $("#f-leasing").checked,
    ninos: $("#f-ninos").checked,
    mayores: $("#f-mayores").checked,
    discapacidad: $("#f-discapacidad").checked,
    arrendatarios: $("#f-arrendatarios").checked,
    poblacion: $("#f-poblacion").value,
  };
}

function cumple(e, f) {
  // Primero los filtros baratos y más selectivos; después los que recorren personas
  if (f.comuna && e.comuna !== +f.comuna) return false;
  if (f.sticker && stickerDe(e) !== f.sticker) return false;
  if (f.demolicion && e.demolicion !== f.demolicion) return false;
  if (f.asegurada && !e.cobertura.asegurada) return false;
  if (f.noAsegurada && e.cobertura.asegurada) return false;
  if (f.hipoteca && !e.cobertura.hipoteca) return false;
  if (f.leasing && !e.cobertura.leasing) return false;
  if (f.texto && !(e.direccion.toLowerCase().includes(f.texto) || e.codigo.includes(f.texto) || e.barrio.toLowerCase().includes(f.texto))) return false;
  if (f.ninos && !e.personas.some((p) => edad(p.nacimiento) < 10)) return false;
  if (f.mayores && !e.personas.some((p) => edad(p.nacimiento) >= 60)) return false;
  if (f.discapacidad && !e.personas.some((p) => p.condiciones.includes("Discapacidad"))) return false;
  if (f.arrendatarios && !e.personas.some((p) => p.vinculo === "Arrendatario")) return false;
  if (f.poblacion && !e.personas.some((p) => p.poblacion === f.poblacion)) return false;
  return true;
}

function pintarConsulta() {
  const f = leerFiltros();
  let res = alcance().filter((e) => cumple(e, f));
  const { campo, dir } = estado.orden;
  const valor = {
    direccion: (e) => e.direccion,
    comuna: (e) => e.comuna,
    sticker: (e) => ORDEN_STICKER[stickerDe(e)],
    fecha: (e) => new Date(fechaDe(e)).getTime(),
    personas: (e) => e.personas.length,
  }[campo];
  res.sort((a, b) => {
    const va = valor(a), vb = valor(b);
    const c = typeof va === "string" ? va.localeCompare(vb, "es") : va - vb;
    return dir === "asc" ? c : -c;
  });

  const paginas = Math.max(1, Math.ceil(res.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const desde = (estado.pagina - 1) * POR_PAGINA;
  const visibles = res.slice(desde, desde + POR_PAGINA);

  $("#conteo").textContent = res.length
    ? `${fmt(res.length)} edificaciones encontradas. Mostrando ${fmt(desde + 1)} a ${fmt(desde + visibles.length)}.`
    : "Ninguna edificación cumple todos los filtros.";

  $("#tabla-edif tbody").innerHTML = visibles.length ? visibles.map((e) => `
    <tr>
      <td><a href="#ficha-${e.id}"><strong>${esc(e.direccion)}</strong></a><br><small>${e.codigo}</small></td>
      <td>${e.comuna}<br><small>${esc(e.barrio)}</small></td>
      <td>${etiquetaSticker(stickerDe(e))}</td>
      <td>${fechaCorta(fechaDe(e))}</td>
      <td class="num">${e.personas.length}</td>
      <td>${chipsCobertura(e.cobertura)}</td>
      <td><a class="btn btn--fantasma btn--chico" href="#ficha-${e.id}">Ver ficha</a></td>
    </tr>`).join("")
    : `<tr class="vacio"><td colspan="7">Ninguna edificación cumple todos los filtros. Quite alguno o use <strong>Limpiar filtros</strong>.</td></tr>`;

  $$(".orden").forEach((b) => {
    const activo = b.dataset.orden === campo;
    if (activo) b.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
    else b.removeAttribute("aria-sort");
    b.closest("th").setAttribute("aria-sort", activo ? (dir === "asc" ? "ascending" : "descending") : "none");
  });

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

/* ---------- Ficha de la edificación ---------- */
function pintarFicha(id) {
  const e = EDIFICACIONES.find((x) => x.id === +id);
  if (!e || !alcance().includes(e)) {
    $("#ficha").innerHTML = `<div class="vacio-grande"><h1 id="t-ficha">No encontramos esta edificación</h1><p>Puede que no exista o que su rol no tenga acceso a ella.</p><a class="btn btn--primario" href="#edificaciones">Volver a la consulta</a></div>`;
    return;
  }
  const u = ultima(e);
  const s = u.sticker;
  const iDem = ESTADOS_DEMOLICION.indexOf(e.demolicion);
  const c = e.cobertura;

  $("#ficha").innerHTML = `
    <a class="volver" href="#edificaciones">‹ Volver a la consulta</a>
    <p class="marca-pdf"><strong>Registro de Edificaciones.</strong> Reporte generado por ${esc(usuarioActual())} el ${new Date().toLocaleString("es-CO")}. Proyecto académico, datos ficticios.</p>
    <div class="ficha-cab">
      <div class="sticker-mini sticker-mini--${s}" role="img" aria-label="Sticker vigente: ${STICKER[s].nombre}, ${STICKER[s].titulo}">
        <div class="sticker-mini__banda">${STICKER[s].nombre}</div>
        <div class="sticker-mini__txt">${STICKER[s].titulo}</div>
      </div>
      <div>
        <h1 id="t-ficha">${esc(e.direccion)}</h1>
        <p>Comuna ${e.comuna}, ${esc(e.barrio)}. Código catastral ${e.codigo}</p>
      </div>
      <div class="ficha-acciones">
        ${puede("registrar") ? `<a class="btn btn--secundario" href="#reinspeccion-${e.codigo}">Registrar reinspección</a>` : ""}
        ${puede("demoler") && s === "rojo" && iDem < 3 ? `<button class="btn btn--fantasma" type="button" id="btn-demolicion">${["Aprobar concepto de demolición", "Registrar demolición", "Registrar retiro de escombros"][iDem]}</button>` : ""}
        <button class="btn btn--primario" type="button" id="btn-pdf">Exportar PDF</button>
      </div>
    </div>

    <div class="ficha-rejilla">
      <section class="caja" aria-labelledby="t-ident">
        <h2 id="t-ident">Identificación y descripción</h2>
        <dl class="datos">
          <dt>Zona</dt><dd>${e.zona}</dd>
          <dt>Uso predominante</dt><dd>${e.uso}</dd>
          <dt>Número de pisos</dt><dd>${e.pisos}</dd>
          <dt>Sistema estructural</dt><dd>${e.sistema}</dd>
          <dt>Período de construcción</dt><dd>${e.periodo}</dd>
          <dt>Persona de contacto</dt><dd>${esc(e.contacto)}</dd>
        </dl>
      </section>

      <section class="caja" aria-labelledby="t-cob">
        <h2 id="t-cob">Cobertura</h2>
        <dl class="datos">
          <dt>Aseguramiento</dt><dd>${c.asegurada ? `Asegurada con ${c.aseguradora}, póliza ${c.poliza}` : "No asegurada"}</dd>
          <dt>Hipoteca</dt><dd>${c.hipoteca ? `Sí, con ${c.entidadHipoteca}` : "No"}</dd>
          <dt>Leasing</dt><dd>${c.leasing ? `Sí, con ${c.entidadLeasing}` : "No"}</dd>
        </dl>
        <h2 class="mt" id="t-dem">Demolición</h2>
        <ol class="demolicion" aria-labelledby="t-dem">
          ${["Concepto aprobado", "Demolida", "Escombros retirados"].map((t, i) => `<li class="${iDem > i ? "hecho" : ""}">${iDem > i ? "✓ " : ""}${t}</li>`).join("")}
        </ol>
        ${iDem === 0 ? '<p class="caja__nota" style="margin-top:.75rem">Sin concepto de demolición.</p>' : ""}
      </section>

      <section class="caja ancho" aria-labelledby="t-eval">
        <h2 id="t-eval">Última evaluación: ${NIVELES_IDIGER[u.nivel].toLowerCase()}</h2>
        <p class="caja__nota">${u.fase}, ${u.tipo.toLowerCase()}. ${fechaLarga(u.fecha)}, por ${esc(u.inspector)} (${u.codigoInspector}). Estado: <strong>${u.estado}</strong>. La clasificación global es la más crítica entre A y E.</p>
        <div class="eval-tabla">
          ${EVALUACIONES.map(([l, t], i) => `<div class="eval-celda eval-celda--${u.evals[i]}"><b>${l}: ${u.evals[i]}</b><span>${t}</span><span>${NIVELES_IDIGER[u.evals[i]]}</span></div>`).join("")}
        </div>
      </section>

      <section class="caja ancho" aria-labelledby="t-pers">
        <h2 id="t-pers">Personas asociadas (${e.personas.length})</h2>
        ${e.personas.length ? `<div class="tabla-envoltura"><table class="tabla">
          <thead><tr><th scope="col">Nombre</th><th scope="col">Documento</th><th scope="col">Vínculo</th><th scope="col">Edad</th><th scope="col">Condición</th><th scope="col">Población</th><th scope="col">Estado</th></tr></thead>
          <tbody>${e.personas.map((p) => {
            const a = edad(p.nacimiento);
            return `<tr><td>${esc(p.nombres)} ${esc(p.apellidos)}</td><td>${p.tipoDoc}${p.documento ? `<br><small>${p.documento}</small>` : ""}</td><td>${p.vinculo}</td><td>${a} años<br><small>${rangoEtario(a)}</small></td><td>${p.condiciones.length ? p.condiciones.join(", ") : "Ninguna"}</td><td>${p.poblacion}</td><td>${p.estado}</td></tr>`;
          }).join("")}</tbody></table></div>` : '<p class="caja__nota">No se registraron personas en esta edificación.</p>'}
      </section>

      <section class="caja" aria-labelledby="t-hist">
        <h2 id="t-hist">Historial de inspecciones</h2>
        <ol class="historial">
          ${[...e.inspecciones].reverse().map((i) => `<li><b>${fechaLarga(i.fecha)} ${etiquetaSticker(i.sticker)}</b><small>${i.fase}. ${esc(i.inspector)}. ${i.estado}</small></li>`).join("")}
        </ol>
      </section>

      <section class="caja" aria-labelledby="t-exp">
        <h2 id="t-exp">Registro de exportaciones</h2>
        <p class="caja__nota">El PDF contiene datos personales: cada exportación queda registrada.</p>
        <ul class="recientes" id="lista-exportaciones">
          ${e.exportaciones.length ? e.exportaciones.map((x) => `<li><span>${esc(x.usuario)}<small>${x.fecha}</small></span></li>`).join("") : "<li>Todavía nadie ha exportado esta ficha.</li>"}
        </ul>
      </section>
    </div>`;

  $("#btn-pdf").addEventListener("click", () => {
    e.exportaciones.unshift({ usuario: usuarioActual(), fecha: new Date().toLocaleString("es-CO") });
    pintarFicha(e.id);
    // En el sistema real el backend genera el PDF; el mockup solo registra la exportación
    aviso("Exportación registrada. En este mockup el PDF no se descarga.");
  });
  const bDem = $("#btn-demolicion");
  if (bDem) bDem.addEventListener("click", () => {
    e.demolicion = ESTADOS_DEMOLICION[iDem + 1];
    pintarFicha(e.id);
    aviso(["Concepto de demolición aprobado.", "Demolición registrada.", "Retiro de escombros registrado."][iDem]);
  });
}

/* ---------- Registrar inspección (formulario por pasos) ---------- */
const PASOS = ["Identificación", "Inspección rápida", "Personas", "Cobertura", "Evaluación en detalle"];

function opciones(sel, lista, valorInicial) {
  sel.innerHTML = lista.map((v) => `<option ${v === valorInicial ? "selected" : ""}>${v}</option>`).join("");
}

function marcarError(input, mensaje) {
  let p = input.parentElement.querySelector(".campo__error[data-auto]");
  if (!mensaje) {
    input.removeAttribute("aria-invalid");
    if (p) p.remove();
    return true;
  }
  if (!p) {
    p = document.createElement("p");
    p.className = "campo__error";
    p.dataset.auto = "1";
    p.id = input.id + "-error";
    input.insertAdjacentElement("afterend", p);
  }
  p.textContent = mensaje;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", p.id);
  return false;
}

function prepararFormulario() {
  $("#i-comuna").innerHTML = Object.keys(COMUNAS).map((c) => `<option value="${c}">Comuna ${c}</option>`).join("");
  opciones($("#i-uso"), USOS, "Residencial");
  opciones($("#i-sistema"), SISTEMAS, "Mampostería confinada");
  opciones($("#p-tipodoc"), TIPOS_DOC, "Cédula de ciudadanía");
  opciones($("#p-vinculo"), VINCULOS, "Propietario");
  $("#f-comuna").innerHTML += Object.keys(COMUNAS).map((c) => `<option value="${c}">Comuna ${c}</option>`).join("");

  $("#elige-sticker").innerHTML = ["verde", "amarillo", "rojo"].map((s) => `
    <div class="opcion-sticker opcion-sticker--${s}">
      <input type="radio" name="sticker" id="st-${s}" value="${s}">
      <label for="st-${s}"><span class="sticker__banda">${STICKER[s].nombre}: ${STICKER[s].titulo.toLowerCase()}</span><span class="desc">${STICKER[s].texto}</span></label>
    </div>`).join("");

  $("#evaluaciones").innerHTML = EVALUACIONES.map(([l, t]) => `
    <div class="campo">
      <label for="ev-${l}">${l}. ${t}</label>
      <select id="ev-${l}" data-eval>${NIVELES_IDIGER.slice(1).map((n, i) => `<option value="${i + 1}">${i + 1}. ${n}</option>`).join("")}</select>
    </div>`).join("");

  $("#porcentajes").innerHTML = ["Ninguno", "Leve", "Moderado", "Fuerte", "Severo"].map((g, i) => `
    <div class="campo"><label for="pc-${i}">${g} (%)</label><input id="pc-${i}" type="number" min="0" max="100" value="${i === 0 ? 100 : 0}" data-pct></div>`).join("");
}

function reiniciarFormulario(codigo) {
  $("#form-insp").reset();
  estado.personasNuevas = [];
  estado.pasoActual = 1;
  $$("#form-insp [aria-invalid]").forEach((i) => marcarError(i, ""));
  $$("[data-revela]").forEach((c) => ($("#" + c.dataset.revela).hidden = true));
  const ahora = new Date(); ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  $("#i-fecha").value = ahora.toISOString().slice(0, 16);
  $("#aviso-duplicado").hidden = true;
  $("#p-rango").textContent = "";
  if (codigo) {
    $("#i-catastral").value = codigo;
    revisarDuplicado();
  }
  pintarPersonasNuevas();
  actualizarGlobal();
  actualizarSuma();
  irAPaso(1);
}

// Búsqueda en el índice hash: si el código existe, se reutiliza la edificación
function revisarDuplicado() {
  const codigo = $("#i-catastral").value.trim();
  const e = INDICE_CATASTRAL.get(codigo);
  const av = $("#aviso-duplicado");
  if (e) {
    av.innerHTML = `Esta edificación ya está registrada: <strong>${esc(e.direccion)}</strong>, comuna ${e.comuna}, sticker vigente ${STICKER[stickerDe(e)].nombre.toLowerCase()}. La inspección se agregará a su historial.`;
    av.hidden = false;
    $("#i-direccion").value = e.direccion;
    $("#i-comuna").value = e.comuna;
    $("#i-barrio").value = e.barrio;
    $("#i-uso").value = e.uso;
    $("#i-pisos").value = e.pisos;
    $("#i-sistema").value = e.sistema;
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
  if (n === 5) {
    const s = $("input[name=sticker]:checked")?.value;
    $("#aviso-detalle").textContent = s === "verde"
      ? "Con sticker verde la evaluación en detalle es opcional. Puede registrar la inspección sin completarla."
      : "Con sticker amarillo o rojo se debe completar la evaluación en detalle del formulario.";
    actualizarGlobal();
  }
}

function validarPaso(n) {
  let ok = true;
  if (n === 1) {
    const cat = $("#i-catastral");
    ok = marcarError(cat, /^\d{13}$/.test(cat.value.trim()) ? "" : "El código catastral debe tener 13 dígitos.") && ok;
    const dir = $("#i-direccion");
    ok = marcarError(dir, dir.value.trim() ? "" : "Escriba la dirección de la edificación.") && ok;
  }
  if (n === 2) {
    const marcado = $("input[name=sticker]:checked");
    let p = $("#err-sticker");
    if (!marcado) {
      if (!p) { p = document.createElement("p"); p.id = "err-sticker"; p.className = "campo__error"; $("#elige-sticker").after(p); }
      p.textContent = "Elija el sticker que instaló.";
      ok = false;
    } else if (p) p.remove();
  }
  if (n === 5) ok = actualizarSuma();
  if (!ok) $("#form-insp [aria-invalid], #err-sticker")?.scrollIntoView({ block: "center", behavior: "smooth" });
  return ok;
}

function actualizarGlobal() {
  const valores = $$("[data-eval]").map((s) => +s.value);
  const g = Math.max(...valores);
  const equivalente = NIVEL_A_STICKER[g];
  const elegido = $("input[name=sticker]:checked")?.value;
  const nivelEtq = { 1: "verde", 2: "amarillo", 3: "naranja", 4: "rojo" }[g];
  $("#global").innerHTML = `
    <span>Clasificación global, calculada:</span>
    <span class="etq etq--${nivelEtq}">${g}. ${NIVELES_IDIGER[g]}</span>
    <span>Equivale a sticker <strong>${STICKER[equivalente].nombre.toLowerCase()}</strong>.</span>
    ${elegido && elegido !== equivalente ? `<span class="campo__error">No coincide con el sticker del paso 2 (${STICKER[elegido].nombre.toLowerCase()}). Revise antes de registrar.</span>` : ""}`;
}

function actualizarSuma() {
  const suma = $$("[data-pct]").reduce((s, i) => s + (+i.value || 0), 0);
  const p = $("#suma-pct");
  const ok = suma === 100;
  p.textContent = ok ? "Suma: 100 %. Correcto." : `Suma: ${suma} %. Debe ser 100 %.`;
  p.className = "suma " + (ok ? "suma--ok" : "suma--error");
  return ok;
}

function pintarPersonasNuevas() {
  const tb = $("#tabla-personas-nueva tbody");
  tb.innerHTML = estado.personasNuevas.length ? estado.personasNuevas.map((p, i) => `
    <tr>
      <td>${esc(p.nombres)} ${esc(p.apellidos)}</td>
      <td>${p.vinculo}</td>
      <td>${p.nacimiento ? rangoEtario(edad(p.nacimiento)) : "Sin fecha"}</td>
      <td>${p.condiciones.join(", ") || "Ninguna"}</td>
      <td><button class="btn btn--fantasma btn--chico" type="button" data-quitar="${i}">Quitar</button></td>
    </tr>`).join("") : `<tr class="vacio"><td colspan="5">Todavía no hay personas. Agregue la primera con el formulario.</td></tr>`;
}

function agregarPersona() {
  const nom = $("#p-nombres");
  if (!marcarError(nom, nom.value.trim() ? "" : "Escriba los nombres.")) { nom.focus(); return; }
  estado.personasNuevas.push({
    nombres: nom.value.trim(),
    apellidos: $("#p-apellidos").value.trim(),
    tipoDoc: $("#p-tipodoc").value,
    documento: $("#p-doc").value.trim(),
    nacimiento: $("#p-nac").value,
    vinculo: $("#p-vinculo").value,
    genero: $("#p-genero").value,
    condiciones: $$("input[name=p-cond]:checked").map((c) => c.value),
    poblacion: $("#p-poblacion").value,
    estado: $("#p-estado").value,
    presencia: true,
    alojamiento: "Lugar habitual de su residencia",
  });
  ["#p-nombres", "#p-apellidos", "#p-doc", "#p-nac"].forEach((s) => ($(s).value = ""));
  $$("input[name=p-cond]").forEach((c) => (c.checked = false));
  $("#p-rango").textContent = "";
  pintarPersonasNuevas();
  aviso("Persona agregada.");
  nom.focus();
}

function registrarInspeccion(ev) {
  ev.preventDefault();
  for (const n of [1, 2, 5]) {
    if (!validarPaso(n)) { irAPaso(n); validarPaso(n); return; }
  }
  const codigo = $("#i-catastral").value.trim();
  const sticker = $("input[name=sticker]:checked").value;
  const evals = $$("[data-eval]").map((s) => +s.value);
  const insp = {
    fecha: new Date($("#i-fecha").value || Date.now()).toISOString(),
    fase: "",
    tipo: $("#i-tipo").value,
    sticker,
    nivel: Math.max(...evals),
    evals,
    inspector: usuarioActual(),
    codigoInspector: (USUARIOS.find((u) => u.nombre === usuarioActual()) || {}).codigo || "ADM",
    estado: "Por validar",
  };
  let e = INDICE_CATASTRAL.get(codigo);
  if (e) {
    insp.fase = "Reinspección";
    e.inspecciones.push(insp);
    e.personas.push(...estado.personasNuevas);
  } else {
    insp.fase = sticker === "verde" ? "Inspección rápida" : "Inspección rápida y evaluación en detalle";
    e = {
      id: EDIFICACIONES.length + 1,
      codigo,
      direccion: $("#i-direccion").value.trim(),
      comuna: +$("#i-comuna").value,
      barrio: $("#i-barrio").value.trim() || "Sin barrio",
      zona: $("input[name=zona]:checked").value === "rural" ? "Rural" : "Urbana",
      uso: $("#i-uso").value,
      pisos: +$("#i-pisos").value || 1,
      sistema: $("#i-sistema").value,
      periodo: "Sin dato",
      inspecciones: [insp],
      personas: [...estado.personasNuevas],
      cobertura: {
        asegurada: $("#c-asegurada").checked, aseguradora: $("#c-aseguradora").value, poliza: $("#c-poliza").value || "sin número",
        hipoteca: $("#c-hipoteca").checked, entidadHipoteca: $("#c-entidad-h").value || "entidad sin registrar",
        leasing: $("#c-leasing").checked, entidadLeasing: $("#c-entidad-l").value || "entidad sin registrar",
      },
      demolicion: "ninguno",
      contacto: "Sin registrar",
      exportaciones: [],
    };
    EDIFICACIONES.push(e);
    INDICE_CATASTRAL.set(codigo, e);
  }
  pintarPublico(); // las cifras públicas se recalculan
  aviso("Inspección registrada. Queda pendiente de validación.");
  location.hash = `#ficha-${e.id}`;
}

/* ---------- Reportes ---------- */
function pintarReportes() {
  const datos = alcance();
  const colores = { rojo: "var(--rojo)", amarillo: "var(--amarillo)", verde: "var(--verde)" };
  const porComuna = {};
  const rango = Object.fromEntries(RANGOS.map((r) => [r, 0]));
  const vinculo = {}, condicion = { Discapacidad: 0, "Persona vulnerable": 0, "Necesidad especial": 0 }, poblacion = { Civil: 0, Militar: 0, Carcelaria: 0 };
  let pendientes = 0, sinAseguro = 0, afectadasSinAseguro = 0;
  for (const e of datos) {
    const s = stickerDe(e);
    (porComuna[e.comuna] ||= { rojo: 0, amarillo: 0, verde: 0 })[s]++;
    if (s !== "verde" && diasDesde(fechaDe(e)) > 45 && e.demolicion === "ninguno") pendientes++;
    if (!e.cobertura.asegurada) sinAseguro++;
    for (const p of e.personas) {
      rango[rangoEtario(edad(p.nacimiento))]++;
      vinculo[p.vinculo] = (vinculo[p.vinculo] || 0) + 1;
      p.condiciones.forEach((c) => condicion[c]++);
      poblacion[p.poblacion]++;
      if (!e.cobertura.asegurada && p.estado !== "Ileso") afectadasSinAseguro++;
    }
  }
  const filas = Object.entries(porComuna).sort((a, b) => +a[0] - +b[0]);
  const maxT = Math.max(...filas.map(([, v]) => v.rojo + v.amarillo + v.verde));

  $("#reportes").innerHTML = `
    <section class="caja" aria-labelledby="r1">
      <h2 id="r1">Edificaciones por comuna y sticker</h2>
      <div class="apilada">
        ${filas.map(([c, v]) => {
          const t = v.rojo + v.amarillo + v.verde;
          return `<div class="apilada__fila"><span>Comuna ${c}</span>
            <span class="apilada__barra" role="img" aria-label="Comuna ${c}: rojo ${v.rojo}, amarillo ${v.amarillo}, verde ${v.verde}" style="width:${(t / maxT) * 100}%">
              ${["rojo", "amarillo", "verde"].map((s) => `<span style="flex:${v[s]};background:${colores[s]}"></span>`).join("")}
            </span><span class="num">${fmt(t)}</span></div>`;
        }).join("")}
      </div>
      <ul class="leyenda">${["rojo", "amarillo", "verde"].map((s) => `<li><span class="punto punto--${s}"></span>${STICKER[s].nombre}</li>`).join("")}</ul>
    </section>
    <section class="caja" aria-labelledby="r2">
      <h2 id="r2">Personas por rango de edad</h2>
      <div class="barras-h" id="rep-edad"></div>
      <h2 class="mt" id="r3">Personas por vínculo con el inmueble</h2>
      <div class="barras-h" id="rep-vinculo"></div>
    </section>
    <section class="caja" aria-labelledby="r4">
      <h2 id="r4">Personas con condición especial</h2>
      <div class="barras-h" id="rep-condicion"></div>
      <h2 class="mt" id="r5">Personas por tipo de población</h2>
      <div class="barras-h" id="rep-poblacion"></div>
    </section>
    <section class="caja" aria-labelledby="r6">
      <h2 id="r6">Seguimiento</h2>
      <div class="indicadores" style="grid-template-columns:1fr 1fr;margin:0">
        <div class="indicador indicador--amarillo"><span class="indicador__num">${fmt(pendientes)}</span><span class="indicador__txt">Amarillas o rojas sin reinspección hace más de 45 días</span></div>
        <div class="indicador"><span class="indicador__num">${fmt(sinAseguro)}</span><span class="indicador__txt">Edificaciones no aseguradas</span></div>
        <div class="indicador indicador--rojo"><span class="indicador__num">${fmt(afectadasSinAseguro)}</span><span class="indicador__txt">Personas afectadas, heridas o fallecidas en edificaciones no aseguradas</span></div>
        <div class="indicador"><span class="indicador__num">${fmt(datos.length)}</span><span class="indicador__txt">Edificaciones en el reporte</span></div>
      </div>
    </section>`;
  barrasH($("#rep-edad"), RANGOS.map((r) => [r, rango[r]]));
  barrasH($("#rep-vinculo"), VINCULOS.map((v) => [v, vinculo[v] || 0]));
  barrasH($("#rep-condicion"), Object.entries(condicion));
  barrasH($("#rep-poblacion"), Object.entries(poblacion));
}

/* ---------- Usuarios ---------- */
function pintarUsuarios() {
  $("#tabla-usuarios tbody").innerHTML = USUARIOS.map((u, i) => `
    <tr>
      <td><strong>${esc(u.nombre)}</strong>${u.codigo ? `<br><small>Evaluador ${u.codigo}</small>` : ""}</td>
      <td>${esc(u.usuario)}</td>
      <td>${u.rol}</td>
      <td>${u.activo ? '<span class="etq etq--verde">Activo</span>' : '<span class="etq etq--neutro">Inactivo</span>'}</td>
      <td><button class="btn btn--fantasma btn--chico" type="button" data-alternar="${i}">${u.activo ? "Desactivar" : "Activar"}</button></td>
    </tr>`).join("");
}

/* =========================================================
   Enrutador
   ========================================================= */
const TITULOS = {
  inicio: "Estado general", stickers: "Qué significa cada sticker", ingresar: "Ingresar",
  panel: "Panel", edificaciones: "Edificaciones", ficha: "Ficha de edificación", nueva: "Registrar inspección",
  reportes: "Reportes", usuarios: "Usuarios", "sin-permiso": "Sin acceso",
};
const PERMISO_VISTA = { panel: "panel", edificaciones: "edificaciones", ficha: "ficha", nueva: "registrar", reportes: "reportes", usuarios: "usuarios" };

let primeraCarga = true;
function enrutar() {
  // Rutas con nombres simples (#panel, #ficha-12, #reinspeccion-760...): el visor de artefactos solo admite #nombre
  const ruta = location.hash.replace(/^#\/?/, "") || "inicio";
  if (ruta === "contenido") return; // el enlace "Saltar al contenido" no es una ruta
  let vista = ruta, argumento = "";
  const m = ruta.match(/^(ficha|reinspeccion)-(\w+)$/);
  if (m) { vista = m[1] === "ficha" ? "ficha" : "nueva"; argumento = m[2]; }
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
  if (vista === "edificaciones") { $("#t-edif").textContent = estado.rol === "inspector" ? "Mis edificaciones" : "Edificaciones"; pintarConsulta(); }
  if (vista === "ficha") pintarFicha(argumento);
  if (vista === "nueva") reiniciarFormulario(argumento || null);
  if (vista === "reportes") pintarReportes();
  if (vista === "usuarios") pintarUsuarios();

  if (!primeraCarga) { window.scrollTo(0, 0); $("#contenido").focus({ preventScroll: true }); }
  primeraCarga = false;
}

/* =========================================================
   Eventos
   ========================================================= */
function iniciar() {
  pintarPublico();
  prepararFormulario();

  // Ingreso (simulado)
  $("#form-ingreso").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const u = $("#usuario"), c = $("#clave");
    $("#err-usuario").hidden = !!u.value.trim();
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
    estado.pagina = 1;
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
  $$(".orden").forEach((b) => b.addEventListener("click", () => {
    const campo = b.dataset.orden;
    estado.orden = { campo, dir: estado.orden.campo === campo && estado.orden.dir === "asc" ? "desc" : "asc" };
    pintarConsulta();
  }));
  $("#paginas").addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-pag]");
    if (!b || b.disabled) return;
    estado.pagina = +b.dataset.pag;
    pintarConsulta();
    $("#tabla-edif").scrollIntoView({ block: "start", behavior: "smooth" });
  });

  // Formulario de inspección
  $("#i-catastral").addEventListener("input", revisarDuplicado);
  $("#btn-siguiente").addEventListener("click", () => { if (validarPaso(estado.pasoActual)) irAPaso(estado.pasoActual + 1); });
  $("#btn-anterior").addEventListener("click", () => irAPaso(estado.pasoActual - 1));
  $("#pasos").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ir]");
    if (!b) return;
    const destino = +b.dataset.ir;
    if (destino > estado.pasoActual && !validarPaso(estado.pasoActual)) return;
    irAPaso(destino);
  });
  $("#evaluaciones").addEventListener("change", actualizarGlobal);
  $("#elige-sticker").addEventListener("change", () => { $("#err-sticker")?.remove(); actualizarGlobal(); });
  $("#porcentajes").addEventListener("input", actualizarSuma);
  $("#btn-agregar-persona").addEventListener("click", agregarPersona);
  $("#tabla-personas-nueva").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-quitar]");
    if (!b) return;
    estado.personasNuevas.splice(+b.dataset.quitar, 1);
    pintarPersonasNuevas();
  });
  $("#p-nac").addEventListener("input", (ev) => {
    const v = ev.target.value;
    $("#p-rango").textContent = v ? `${edad(v)} años: ${rangoEtario(edad(v))}` : "";
  });
  $$("[data-revela]").forEach((c) => c.addEventListener("change", () => ($("#" + c.dataset.revela).hidden = !c.checked)));
  $("#form-insp").addEventListener("submit", registrarInspeccion);

  // Usuarios
  $("#btn-crear-usuario").addEventListener("click", () => $("#dlg-usuario").showModal());
  $("#dlg-usuario").addEventListener("close", () => {
    const d = $("#dlg-usuario");
    if (d.returnValue === "crear" && $("#u-nombre").value.trim() && $("#u-usuario").value.trim()) {
      USUARIOS.push({ nombre: $("#u-nombre").value.trim(), usuario: $("#u-usuario").value.trim(), rol: $("#u-rol").value, activo: true });
      pintarUsuarios();
      aviso("Usuario creado.");
    }
    $("#form-usuario").reset();
  });
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
