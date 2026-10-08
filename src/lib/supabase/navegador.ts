'use client'
import { createBrowserClient } from '@supabase/ssr'
import { publico } from '@/lib/entorno'

/** Cliente para componentes de cliente. Usa la anon key y respeta RLS. */
export function clienteNavegador() {
  return createBrowserClient(publico.supabaseUrl(), publico.supabaseAnonKey())
}
