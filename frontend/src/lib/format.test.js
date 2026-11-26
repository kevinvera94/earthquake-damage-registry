// TESTING §3.1: fechas en America/Bogota (el backend envía UTC).
import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatNumber } from './format';

describe('formatDate', () => {
  it('convierte de UTC a la fecha de Colombia', () => {
    // 03:00 UTC del 11-ago son las 22:00 del 10-ago en Bogotá
    expect(formatDate('2026-08-11T03:00:00Z')).toBe('10/08/2026');
  });

  it('devuelve vacío sin valor', () => {
    expect(formatDate(null)).toBe('');
  });
});

describe('formatDateTime', () => {
  it('muestra la hora de Colombia en 24 h', () => {
    expect(formatDateTime('2026-11-28T15:04:00Z')).toMatch(/28\/11\/2026.*10:04/);
  });
});

describe('formatNumber', () => {
  it('usa punto de miles', () => {
    expect(formatNumber(6043)).toBe('6.043');
  });
});
