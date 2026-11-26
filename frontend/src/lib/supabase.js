// Cliente de Supabase. Solo se usa para el login y la sesión (ARCHITECTURE P-1): los datos
// siempre pasan por el backend.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sin variables (p. ej. un build local sin .env.local) el área pública sigue funcionando;
// el login de T-06 debe mostrar un error si `supabase` es null.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
