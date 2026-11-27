// Diálogo para agregar o editar una persona (RF-03-01, RF-03-04). Estructura del mockup
// (`#dlg-persona`): número oculto si es "Sin documento" y "Ninguna" excluyente.
import { useEffect, useRef, useState } from 'react';
import {
  AGE_RANGES,
  DOCUMENT_TYPES,
  NO_SPECIAL_CONDITION_LABEL,
  POPULATION_TYPES,
  SPECIAL_CONDITIONS,
  TENURES,
  labelOf,
} from '../lib/catalogs';
import {
  ageFromBirthDate,
  ageRangeOf,
  todayInBogota,
  toggleCondition,
  toPersonPayload,
  validatePerson,
} from '../lib/validation';

const EMPTY = {
  first_names: '',
  last_names: '',
  document_type: 'cc',
  document_number: '',
  tenure: 'owner',
  birth_date: '',
  special_conditions: [],
  population_type: 'civilian',
};

function initialValues(person) {
  if (!person) return EMPTY;
  return { ...EMPTY, ...person, document_number: person.document_number ?? '' };
}

/**
 * `person`: la persona a editar, o null para agregar. Se monta al abrir y se desmonta al
 * cerrar, así cada apertura empieza con el formulario limpio. `onSubmit(payload)` llama a la
 * API y puede lanzar un `ApiError`, cuyo `detail` (p. ej. el 409 de duplicado) se muestra arriba.
 */
export default function PersonForm({ person, onSubmit, onClose }) {
  const dialogRef = useRef(null);
  const [values, setValues] = useState(() => initialValues(person));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(person);
  const today = todayInBogota();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const set = (field) => (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

  const setCondition = (value) => (event) =>
    setValues((prev) => ({
      ...prev,
      special_conditions: toggleCondition(prev.special_conditions, value, event.target.checked),
    }));

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validatePerson(values, today);
    setErrors(found);
    setApiError('');
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await onSubmit(toPersonPayload(values));
    } catch (error) {
      setApiError(error.detail ?? 'No fue posible guardar la persona.');
    } finally {
      setSaving(false);
    }
  }

  const age = ageFromBirthDate(values.birth_date, today);
  const noDocument = values.document_type === 'none';

  function field(name, label, input) {
    return (
      <div className="campo">
        <label htmlFor={`pe-${name}`}>{label}</label>
        {input}
        {errors[name] && (
          <p className="campo__error" id={`pe-${name}-error`}>
            {errors[name]}
          </p>
        )}
      </div>
    );
  }

  const inputProps = (name) => ({
    id: `pe-${name}`,
    value: values[name],
    onChange: set(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `pe-${name}-error` : undefined,
  });

  return (
    <dialog
      className="dialogo dialogo--ancho"
      ref={dialogRef}
      aria-labelledby="t-dlg-persona"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2 id="t-dlg-persona">{editing ? 'Editar persona' : 'Agregar persona'}</h2>
        {apiError && (
          <p className="aviso aviso--error" role="alert">
            {apiError}
          </p>
        )}
        <div className="rejilla">
          {field('first_names', 'Nombres', <input {...inputProps('first_names')} />)}
          {field('last_names', 'Apellidos', <input {...inputProps('last_names')} />)}
          {field(
            'document_type',
            'Tipo de documento',
            <select {...inputProps('document_type')}>
              {DOCUMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>,
          )}
          {!noDocument &&
            field(
              'document_number',
              'Número de documento',
              <input {...inputProps('document_number')} inputMode="numeric" />,
            )}
          <div className="campo">
            <label htmlFor="pe-birth_date">Fecha de nacimiento</label>
            <input {...inputProps('birth_date')} type="date" max={today} />
            <p className="campo__ayuda" aria-live="polite">
              {age !== null && `${age} años: ${labelOf(AGE_RANGES, ageRangeOf(age))}`}
            </p>
            {errors.birth_date && (
              <p className="campo__error" id="pe-birth_date-error">
                {errors.birth_date}
              </p>
            )}
          </div>
          {field(
            'tenure',
            'Vínculo con el inmueble',
            <select {...inputProps('tenure')}>
              {TENURES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>,
          )}
          {field(
            'population_type',
            'Tipo de población',
            <select {...inputProps('population_type')}>
              {POPULATION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>,
          )}
          <fieldset className="grupo">
            <legend>Condición especial</legend>
            {SPECIAL_CONDITIONS.map((item) => (
              <label className="check" key={item.value}>
                <input
                  type="checkbox"
                  checked={values.special_conditions.includes(item.value)}
                  onChange={setCondition(item.value)}
                />{' '}
                {item.label}
              </label>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={values.special_conditions.length === 0}
                onChange={setCondition(null)}
              />{' '}
              {NO_SPECIAL_CONDITION_LABEL}
            </label>
          </fieldset>
        </div>
        <div className="dialogo__pie">
          <button className="btn btn--fantasma" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primario" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar persona'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
