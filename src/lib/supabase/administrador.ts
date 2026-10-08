import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { publico, servidor } from '@/lib/entorno'

/**
 * Cliente con service role: SALTA TODAS LAS POLITICAS RLS.
 *
 * Solo para rutas de servidor que ya validaron la peticion. El import de
 * 'server-only' hace que el build falle si algun componente de cliente lo
 * arrastra por error.
 *
 * Lo usamos para dos cosas:
 *   1. Crear pedidos (el navegador no tiene permiso de escribir en pedidos).
 *   2. Consultar un pedido por su codigo de seguimiento.
 */
export function clienteAdministrador() {
  return createClient(publico.supabaseUrl(), servidor.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
