import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { publico } from '@/lib/entorno'

/**
 * Cliente de servidor ligado a las cookies de sesion. Respeta RLS, asi que
 * ve lo que el usuario autenticado puede ver (el catalogo publico, y los
 * pedidos solo si es personal).
 */
export async function clienteServidor() {
  const almacen = await cookies()
  return createServerClient(publico.supabaseUrl(), publico.supabaseAnonKey(), {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (nuevas: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          for (const { name, value, options } of nuevas) almacen.set(name, value, options)
        } catch {
          // Los Server Components no pueden escribir cookies; el middleware
          // ya refresca la sesion, asi que aqui se puede ignorar.
        }
      },
    },
  })
}
