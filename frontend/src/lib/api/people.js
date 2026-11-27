// API de personas ocupantes (MOD-03, API §2). Las respuestas traen `age` y `age_range`
// calculados por el backend (RN-07).
import { api } from './client';

/** RF-03-01: agrega una persona a la edificación. 409 si está repetida (RN-06). */
export function createPerson(buildingId, person) {
  return api.post(`/api/buildings/${buildingId}/people`, person);
}

/** RF-03-04: edita una persona (envía solo los campos del formulario). */
export function updatePerson(personId, changes) {
  return api.patch(`/api/people/${personId}`, changes);
}

/** RF-03-04: retira a la persona de la edificación. */
export function deletePerson(personId) {
  return api.delete(`/api/people/${personId}`);
}
