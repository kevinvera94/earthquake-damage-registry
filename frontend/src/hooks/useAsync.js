// Estado de carga, error y datos de una llamada asíncrona a la API (CODING-STANDARDS §2.2).
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta `asyncFn` y expone `{ data, error, loading, run, setData }`.
 *
 * - `asyncFn` debe ser estable (`useCallback`): si cambia, se vuelve a ejecutar.
 * - `immediate` (por defecto true) la ejecuta al montar; con false, solo al llamar `run(...)`.
 * - Si llegan respuestas fuera de orden, solo cuenta la de la última llamada.
 * - `run` devuelve los datos o relanza el error, para que un formulario pueda reaccionar.
 */
export function useAsync(asyncFn, { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: immediate });
  const lastCall = useRef(0);

  const run = useCallback(
    async (...args) => {
      const call = ++lastCall.current;
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await asyncFn(...args);
        if (call === lastCall.current) setState({ data, error: null, loading: false });
        return data;
      } catch (error) {
        if (call === lastCall.current) setState((prev) => ({ ...prev, error, loading: false }));
        throw error;
      }
    },
    [asyncFn],
  );

  useEffect(() => {
    // El error ya queda en el estado; aquí solo se evita el rechazo sin manejar
    if (immediate) run().catch(() => {});
  }, [immediate, run]);

  const setData = useCallback((data) => setState((prev) => ({ ...prev, data })), []);

  return { ...state, run, setData };
}
