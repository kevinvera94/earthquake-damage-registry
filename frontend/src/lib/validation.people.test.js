// Pruebas de las validaciones de persona (T-12, TESTING §3.1)
import { describe, expect, it } from 'vitest';
import {
  ageFromBirthDate,
  ageRangeOf,
  todayInBogota,
  toggleCondition,
  toPersonPayload,
  validatePerson,
} from './validation';

const TODAY = '2026-11-27';

const valid = {
  first_names: 'Ana María',
  last_names: 'Pérez Gómez',
  document_type: 'cc',
  document_number: '1000000001',
  tenure: 'tenant',
  birth_date: '1958-03-14',
  special_conditions: [],
  population_type: 'civilian',
};

describe('validatePerson', () => {
  it('acepta una persona válida', () => {
    expect(validatePerson(valid, TODAY)).toEqual({});
  });

  it('"Sin documento" no exige número (RF-03-01 CA-2)', () => {
    const person = { ...valid, document_type: 'none', document_number: '' };
    expect(validatePerson(person, TODAY)).toEqual({});
  });

  it('los demás tipos exigen número, aunque sean solo espacios (RF-03-01 CA-2)', () => {
    const person = { ...valid, document_number: '   ' };
    expect(validatePerson(person, TODAY)).toHaveProperty('document_number');
  });

  it('rechaza una fecha de nacimiento futura (RF-03-01 CA-5)', () => {
    expect(validatePerson({ ...valid, birth_date: '2026-11-28' }, TODAY)).toEqual({
      birth_date: 'La fecha de nacimiento no puede ser futura.',
    });
  });

  it('acepta a quien nació hoy', () => {
    expect(validatePerson({ ...valid, birth_date: TODAY }, TODAY)).toEqual({});
  });

  it('exige nombres, apellidos y fecha de nacimiento', () => {
    const errors = validatePerson(
      { ...valid, first_names: ' ', last_names: '', birth_date: '' },
      TODAY,
    );
    expect(Object.keys(errors).sort()).toEqual(['birth_date', 'first_names', 'last_names']);
  });
});

describe('toggleCondition ("Ninguna" excluyente, RF-03-01 CA-3)', () => {
  it('marcar "Ninguna" (null) quita todas las demás', () => {
    expect(toggleCondition(['disability', 'vulnerable'], null, true)).toEqual([]);
  });

  it('marcar una condición la agrega una sola vez', () => {
    expect(toggleCondition([], 'disability', true)).toEqual(['disability']);
    expect(toggleCondition(['disability'], 'disability', true)).toEqual(['disability']);
  });

  it('desmarcar la última condición vuelve a "Ninguna" (lista vacía)', () => {
    expect(toggleCondition(['disability'], 'disability', false)).toEqual([]);
  });
});

describe('ageFromBirthDate y ageRangeOf (RF-03-03)', () => {
  it.each([
    ['2016-11-27', 10, '10-17'],
    ['2016-11-28', 9, '0-9'],
    ['2008-11-27', 18, '18-59'],
    ['2008-11-28', 17, '10-17'],
    ['1966-11-27', 60, '60+'],
    ['1966-11-28', 59, '18-59'],
  ])('nacido el %s tiene %i años, rango %s', (birthDate, age, range) => {
    expect(ageFromBirthDate(birthDate, TODAY)).toBe(age);
    expect(ageRangeOf(age)).toBe(range);
  });

  it('sin fecha o con fecha futura no hay edad', () => {
    expect(ageFromBirthDate('', TODAY)).toBeNull();
    expect(ageFromBirthDate('2027-01-01', TODAY)).toBeNull();
    expect(ageRangeOf(null)).toBeNull();
  });
});

describe('todayInBogota', () => {
  it('usa la hora de Colombia (UTC-5)', () => {
    // 02:00 UTC del 28-nov = 21:00 del 27-nov en Colombia
    expect(todayInBogota(new Date('2026-11-28T02:00:00Z'))).toBe('2026-11-27');
  });
});

describe('toPersonPayload', () => {
  it('quita espacios y envía null como número si es "Sin documento"', () => {
    const payload = toPersonPayload({
      ...valid,
      first_names: '  Ana ',
      document_type: 'none',
      document_number: '123',
    });
    expect(payload.first_names).toBe('Ana');
    expect(payload.document_number).toBeNull();
  });
});
