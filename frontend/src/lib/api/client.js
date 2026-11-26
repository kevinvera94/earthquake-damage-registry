// Cliente base del backend: URL, token de la sesión y errores (CODING-STANDARDS §2.3).
// Ningún componente llama `fetch`: cada recurso usa este módulo desde `lib/api/<recurso>.js`.
import { supabase } from '../supabase';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const NETWORK_ERROR = 'No fue posible conectar con el servidor. Intenta de nuevo en un momento.';
const VALIDATION_ERROR = 'Hay datos inválidos. Revisa el formulario.';
const UNKNOWN_ERROR = 'Ocurrió un error inesperado. Intenta de nuevo.';

/** Error de la API: `status` HTTP (0 si no hubo conexión) y `detail` en español. */
export class ApiError extends Error {
  constructor(status, detail) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/** Arma el query string; omite valores vacíos y repite la clave para listas (`sticker`). */
export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    values
      .filter((v) => v !== undefined && v !== null && v !== '')
      .forEach((v) => search.append(key, String(v)));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function getAccessToken() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// FastAPI responde `detail` como texto (errores de dominio) o como lista (422 de Pydantic)
async function readErrorDetail(response) {
  try {
    const body = await response.json();
    if (typeof body.detail === 'string') return body.detail;
    if (response.status === 422) return VALIDATION_ERROR;
  } catch {
    // Cuerpo vacío o no JSON
  }
  return UNKNOWN_ERROR;
}

async function request(method, path, { query, body, responseType = 'json' } = {}) {
  const headers = {};
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }

  if (!response.ok) throw new ApiError(response.status, await readErrorDetail(response));
  if (response.status === 204) return null;
  return responseType === 'blob' ? response.blob() : response.json();
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
  // Descargas (PDF): el token va en la cabecera, por eso no sirve un <a href> (API §2)
  getBlob: (path) => request('GET', path, { responseType: 'blob' }),
};
