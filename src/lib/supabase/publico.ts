import { createClient } from '@supabase/supabase-js'
import { publico } from '@/lib/entorno'

/**
 * Cliente anonimo SIN cookies, para leer el catalogo.
 *
 * Por que no reusar el cliente de sesion: ese llama a cookies(), y eso
 * obliga a Next a renderizar la pagina en cada visita. El catalogo es
 * publico e igual para todos, asi que leerlo sin cookies permite servir el
 * inicio desde cache (revalidate) y la panaderia aguanta una racha de
 * visitas sin tocar la base en cada una.
 *
 * Sigue usando la anon key, asi que las politicas RLS aplican igual: solo
 * ve lo que esta marcado como disponible o activo.
 */
export function clientePublico() {
  return createClient(publico.supabaseUrl(), publico.supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
