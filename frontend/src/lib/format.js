// Formato de fechas y números para la interfaz. Siempre en hora de Colombia
// (API §1: el backend envía UTC). Ningún componente formatea fechas por su cuenta.

const TIME_ZONE = 'America/Bogota';
const LOCALE = 'es-CO';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

/** `2026-11-28T15:04:00Z` → `28/11/2026`. Vacío si no hay valor. */
export function formatDate(isoString) {
  return isoString ? dateFormatter.format(new Date(isoString)) : '';
}

/** `2026-11-28T15:04:00Z` → `28/11/2026, 10:04`. Vacío si no hay valor. */
export function formatDateTime(isoString) {
  return isoString ? dateTimeFormatter.format(new Date(isoString)) : '';
}

/** `6043` → `6.043`. */
export function formatNumber(value) {
  return numberFormatter.format(value);
}
