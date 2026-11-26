// Catálogos: códigos de los enums del backend (DATA-MODEL §2) y sus etiquetas en español.
// Es la única fuente de etiquetas de la interfaz (CODING-STANDARDS §2.3).

export const USER_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'inspector', label: 'Inspector' },
];

export const SECTORS = [
  { value: 'housing', label: 'Vivienda' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'health', label: 'Salud' },
  { value: 'education', label: 'Educación' },
  { value: 'infrastructure', label: 'Infraestructura' },
  { value: 'logistics', label: 'Logística y suministros' },
  { value: 'economy', label: 'Economía' },
];

// Orden de gravedad: rojo → amarillo → verde (como el mockup)
export const STICKERS = [
  {
    value: 'red',
    label: 'Rojo',
    title: 'Inseguro',
    description: 'No se puede ingresar ni habitar. Riesgo para la vida.',
  },
  {
    value: 'yellow',
    label: 'Amarillo',
    title: 'Uso restringido',
    description: 'Solo se permite el ingreso a zonas autorizadas o por tiempo limitado.',
  },
  {
    value: 'green',
    label: 'Verde',
    title: 'Sin restricción',
    description: 'La edificación puede usarse con normalidad.',
  },
];

// Edificación sin inspecciones: `current_sticker` es null (filtro `sticker=none`, API §3.2)
export const NO_STICKER = { value: 'none', label: 'Sin inspeccionar' };

export const DOCUMENT_TYPES = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ti', label: 'Tarjeta de identidad' },
  { value: 'rc', label: 'Registro civil' },
  { value: 'ce', label: 'Cédula de extranjería' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'none', label: 'Sin documento' },
];

export const TENURES = [
  { value: 'owner', label: 'Propietario' },
  { value: 'tenant', label: 'Arrendatario' },
];

// "Ninguna" no es un valor del enum: es el arreglo vacío (DATA-MODEL §2)
export const SPECIAL_CONDITIONS = [
  { value: 'disability', label: 'Discapacidad' },
  { value: 'vulnerable', label: 'Persona vulnerable' },
  { value: 'special_need', label: 'Necesidad especial' },
];

export const NO_SPECIAL_CONDITION_LABEL = 'Ninguna';

export const POPULATION_TYPES = [
  { value: 'civilian', label: 'Civil' },
  { value: 'military', label: 'Militar' },
  { value: 'prison', label: 'Carcelaria' },
];

// Calculado por el backend, no se guarda (DATA-MODEL §4.2)
export const AGE_RANGES = [
  { value: '0-9', label: 'Niños menores de 10' },
  { value: '10-17', label: 'Niños y adolescentes' },
  { value: '18-59', label: 'Adultos' },
  { value: '60+', label: 'Adultos mayores' },
];

// Comunas 1..22 de Cali y 0 = Rural (DATA-MODEL §2)
export const RURAL_COMUNA = 0;

export const COMUNAS = [
  ...Array.from({ length: 22 }, (_, i) => ({ value: i + 1, label: `Comuna ${i + 1}` })),
  { value: RURAL_COMUNA, label: 'Rural' },
];

/** Devuelve la etiqueta en español de `value` dentro de `catalog`, o '' si no existe. */
export function labelOf(catalog, value) {
  return catalog.find((item) => item.value === value)?.label ?? '';
}
