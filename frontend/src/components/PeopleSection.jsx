// Sección "Personas ocupantes" de la ficha (MOD-03). T-11 la inserta en `BuildingDetail`:
//   <PeopleSection buildingId={building.id} people={building.people} onChange={reload} />
// `onChange` vuelve a cargar la ficha después de agregar, editar o retirar.
import { useState } from 'react';
import { createPerson, deletePerson, updatePerson } from '../lib/api/people';
import PeopleTable from './PeopleTable';
import PersonForm from './PersonForm';

export default function PeopleSection({ buildingId, people, onChange }) {
  // `editing`: undefined = diálogo cerrado; null = agregar; persona = editar
  const [editing, setEditing] = useState(undefined);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(payload) {
    // Si la API falla, PersonForm muestra el `detail` (p. ej. el 409 de RN-06)
    if (editing) await updatePerson(editing.id, payload);
    else await createPerson(buildingId, payload);
    setNotice(editing ? 'Persona actualizada.' : 'Persona agregada.');
    setEditing(undefined);
    onChange();
  }

  async function handleRemove(person) {
    setError('');
    try {
      await deletePerson(person.id);
      setNotice('Persona retirada de la edificación.');
      onChange();
    } catch (apiError) {
      setError(apiError.detail ?? 'No fue posible retirar a la persona.');
    }
  }

  return (
    <section className="caja ancho" aria-labelledby="t-pers">
      <div className="caja__cab">
        <h2 id="t-pers">Personas ocupantes ({people.length})</h2>
        <button
          className="btn btn--secundario btn--chico"
          type="button"
          onClick={() => {
            setNotice('');
            setEditing(null);
          }}
        >
          Agregar persona
        </button>
      </div>
      {notice && (
        <p className="aviso" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="aviso aviso--error" role="alert">
          {error}
        </p>
      )}
      {people.length ? (
        <PeopleTable
          people={people}
          onEdit={(person) => {
            setNotice('');
            setEditing(person);
          }}
          onRemove={handleRemove}
        />
      ) : (
        <p className="caja__nota">Sin registros de personas en esta edificación.</p>
      )}
      {editing !== undefined && (
        <PersonForm
          key={editing?.id ?? 'nueva'}
          person={editing}
          onSubmit={handleSubmit}
          onClose={() => setEditing(undefined)}
        />
      )}
    </section>
  );
}
