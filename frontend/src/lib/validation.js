// Validaciones de formularios, una función pura por regla y con pruebas en Vitest
// (CODING-STANDARDS §2.3, TESTING §3.1). Las agrega cada módulo: T-10 (edificación), T-11
// (inspección), T-12 (persona), T-13b (usuario).

// ---------------------------------------------------------------------------
// Persona (T-12, MOD-03). Bloque al final del archivo para no chocar con los de otros módulos
// ---------------------------------------------------------------------------

const NO_DOCUMENT = 'none';

/** Fecha de hoy en Colombia como `AAAA-MM-DD` (la misma "fecha actual" del backend). */
export function todayInBogota(now = new Date()) {
  // `en-CA` formatea como AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(now);
}

/** Años cumplidos entre dos fechas `AAAA-MM-DD`; `null` si falta alguna o es futura. */
export function ageFromBirthDate(birthDate, today) {
  if (!birthDate || !today || birthDate > today) return null;
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

/** Rango etario de RF-03-03 CA-2 (código de `AGE_RANGES`) para una edad en años. */
export function ageRangeOf(age) {
  if (age === null || age === undefined) return null;
  if (age < 10) return '0-9';
  if (age < 18) return '10-17';
  if (age < 60) return '18-59';
  return '60+';
}

/**
 * RF-03-01 CA-3: "Ninguna" es excluyente. `value === null` representa "Ninguna" y deja la lista
 * vacía; marcar otra condición la agrega (y con ello deja de estar "Ninguna").
 */
export function toggleCondition(conditions, value, checked) {
  if (value === null) return [];
  if (checked) return conditions.includes(value) ? conditions : [...conditions, value];
  return conditions.filter((c) => c !== value);
}

/**
 * Valida el formulario de persona. Devuelve `{ campo: mensaje }`; vacío si todo está bien.
 * - RF-03-01 CA-2: "Sin documento" no exige número; los demás tipos sí
 * - RF-03-01 CA-5: la fecha de nacimiento no puede ser futura
 */
export function validatePerson(values, today = todayInBogota()) {
  const errors = {};
  if (!values.first_names?.trim()) errors.first_names = 'Escriba los nombres.';
  if (!values.last_names?.trim()) errors.last_names = 'Escriba los apellidos.';
  if (values.document_type !== NO_DOCUMENT && !values.document_number?.trim()) {
    errors.document_number = 'Escriba el número de documento.';
  }
  if (!values.birth_date) errors.birth_date = 'Indique la fecha de nacimiento.';
  else if (values.birth_date > today) {
    errors.birth_date = 'La fecha de nacimiento no puede ser futura.';
  }
  return errors;
}

/** Cuerpo para la API: sin espacios sobrantes y sin número si es "Sin documento". */
export function toPersonPayload(values) {
  const noDocument = values.document_type === NO_DOCUMENT;
  return {
    first_names: values.first_names.trim(),
    last_names: values.last_names.trim(),
    document_type: values.document_type,
    document_number: noDocument ? null : values.document_number.trim(),
    tenure: values.tenure,
    birth_date: values.birth_date,
    special_conditions: values.special_conditions,
    population_type: values.population_type,
  };
}
