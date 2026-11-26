// Query string del cliente de la API (API §3.2: listas repetidas, vacíos omitidos).
import { describe, expect, it } from 'vitest';
import { buildQuery } from './client';

describe('buildQuery', () => {
  it('omite valores vacíos, null y undefined', () => {
    expect(buildQuery({ comuna: '', sector: null, page: undefined })).toBe('');
  });

  it('repite la clave para listas (sticker múltiple)', () => {
    expect(buildQuery({ sticker: ['red', 'none'] })).toBe('?sticker=red&sticker=none');
  });

  it('conserva false y 0, que sí son filtros', () => {
    expect(buildQuery({ is_insured: false, comuna: 0 })).toBe('?is_insured=false&comuna=0');
  });

  it('codifica caracteres especiales', () => {
    expect(buildQuery({ neighborhood: 'San Fernando Viejo' })).toBe(
      '?neighborhood=San+Fernando+Viejo',
    );
  });
});
