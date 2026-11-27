// Tabla de personas de la ficha (RF-03-05) con editar y retirar. La confirmación de retiro va
// dentro de la fila, como en el mockup (RF-03-04 CA-2): no se usa `confirm()`.
import { useState } from 'react';
import {
  AGE_RANGES,
  DOCUMENT_TYPES,
  NO_SPECIAL_CONDITION_LABEL,
  POPULATION_TYPES,
  SPECIAL_CONDITIONS,
  TENURES,
  labelOf,
} from '../lib/catalogs';

function documentText(person) {
  const type = labelOf(DOCUMENT_TYPES, person.document_type);
  return person.document_number ? `${type} ${person.document_number}` : type;
}

function conditionsText(person) {
  if (!person.special_conditions.length) return NO_SPECIAL_CONDITION_LABEL;
  return person.special_conditions.map((c) => labelOf(SPECIAL_CONDITIONS, c)).join(', ');
}

/** `onRemove(person)` es asíncrona: la fila queda en confirmación hasta que termina. */
export default function PeopleTable({ people, onEdit, onRemove }) {
  const [confirmingId, setConfirmingId] = useState(null);
  const [removing, setRemoving] = useState(false);

  async function confirmRemove(person) {
    setRemoving(true);
    try {
      await onRemove(person);
      setConfirmingId(null);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Documento</th>
            <th scope="col">Vínculo</th>
            <th scope="col">Edad</th>
            <th scope="col">Condición</th>
            <th scope="col">Población</th>
            <th scope="col">
              <span className="sr">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const fullName = `${person.first_names} ${person.last_names}`;
            if (confirmingId === person.id) {
              return (
                <tr className="confirmar" key={person.id}>
                  <td colSpan={7}>
                    <span>
                      ¿Retirar a <strong>{fullName}</strong> de esta edificación?
                    </span>
                    <span className="confirmar__acciones">
                      <button
                        className="btn btn--peligro btn--chico"
                        type="button"
                        disabled={removing}
                        onClick={() => confirmRemove(person)}
                      >
                        {removing ? 'Retirando…' : 'Sí, retirar'}
                      </button>
                      <button
                        className="btn btn--fantasma btn--chico"
                        type="button"
                        disabled={removing}
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancelar
                      </button>
                    </span>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={person.id}>
                <td>{fullName}</td>
                <td>{documentText(person)}</td>
                <td>{labelOf(TENURES, person.tenure)}</td>
                <td>
                  {person.age} años
                  <br />
                  <small>{labelOf(AGE_RANGES, person.age_range)}</small>
                </td>
                <td>{conditionsText(person)}</td>
                <td>{labelOf(POPULATION_TYPES, person.population_type)}</td>
                <td className="acciones-fila">
                  <button
                    className="btn btn--fantasma btn--chico"
                    type="button"
                    onClick={() => onEdit(person)}
                    aria-label={`Editar a ${fullName}`}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn--fantasma btn--chico"
                    type="button"
                    onClick={() => setConfirmingId(person.id)}
                    aria-label={`Retirar a ${fullName}`}
                  >
                    Retirar
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
