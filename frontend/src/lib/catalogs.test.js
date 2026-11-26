// TESTING §3.1: cada código de enum tiene etiqueta en español y ninguna está vacía.
import { describe, expect, it } from 'vitest';
import {
  AGE_RANGES,
  COMUNAS,
  DOCUMENT_TYPES,
  POPULATION_TYPES,
  SECTORS,
  SPECIAL_CONDITIONS,
  STICKERS,
  TENURES,
  USER_ROLES,
  labelOf,
} from './catalogs';

// Códigos de DATA-MODEL §2 (deben coincidir con app/enums.py del backend)
const BACKEND_CODES = {
  USER_ROLES: ['admin', 'inspector'],
  SECTORS: [
    'housing',
    'commercial',
    'health',
    'education',
    'infrastructure',
    'logistics',
    'economy',
  ],
  STICKERS: ['green', 'yellow', 'red'],
  DOCUMENT_TYPES: ['cc', 'ti', 'rc', 'ce', 'passport', 'none'],
  TENURES: ['owner', 'tenant'],
  SPECIAL_CONDITIONS: ['disability', 'vulnerable', 'special_need'],
  POPULATION_TYPES: ['civilian', 'military', 'prison'],
  AGE_RANGES: ['0-9', '10-17', '18-59', '60+'],
};

const CATALOGS = {
  USER_ROLES,
  SECTORS,
  STICKERS,
  DOCUMENT_TYPES,
  TENURES,
  SPECIAL_CONDITIONS,
  POPULATION_TYPES,
  AGE_RANGES,
};

describe('catálogos', () => {
  it.each(Object.keys(BACKEND_CODES))('%s tiene exactamente los códigos del backend', (name) => {
    const codes = CATALOGS[name].map((item) => item.value);
    expect([...codes].sort()).toEqual([...BACKEND_CODES[name]].sort());
  });

  it.each(Object.keys(CATALOGS))('%s no tiene etiquetas vacías', (name) => {
    CATALOGS[name].forEach((item) => expect(item.label.trim()).not.toBe(''));
  });

  it('comunas: 1 a 22 más Rural (0), sin repetir', () => {
    const values = COMUNAS.map((c) => c.value);
    expect(values).toHaveLength(23);
    expect(new Set(values).size).toBe(23);
    expect(labelOf(COMUNAS, 0)).toBe('Rural');
    expect(labelOf(COMUNAS, 22)).toBe('Comuna 22');
  });
});

describe('labelOf', () => {
  it('devuelve la etiqueta del código', () => {
    expect(labelOf(TENURES, 'tenant')).toBe('Arrendatario');
  });

  it('devuelve vacío si el código no existe', () => {
    expect(labelOf(TENURES, 'otro')).toBe('');
  });
});
