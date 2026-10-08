import 'server-only'
import { redirect } from 'next/navigation'
import { clienteServidor } from '@/lib/supabase/servidor'
import type { RolUsuario } from '@/types/dominio'

export interface PersonalAutenticado {
  id: string
  email: string
  nombre: string | null
  rol: RolUsuario
}

/**
 * Exige que quien pide la pagina sea personal de la panaderia.
 * Si no hay sesion manda al login; si hay sesion pero no esta en perfiles,
 * cierra la sesion y lo manda al login con un aviso: es una cuenta que
 * existe en Supabase Auth pero que nadie autorizo al panel.
 */
export async function exigirPersonal(): Promise<PersonalAutenticado> {
  const sb = await clienteServidor()
  const {
    data: { user },
  } = await sb.auth.getUser()

  if (!user) redirect('/entrar')

  const { data: perfil } = await sb
    .from('perfiles')
    .select('id,nombre,rol')
    .eq('id', user.id)
    .maybeSingle()

  if (!perfil) redirect('/entrar?error=sin-permiso')

  return {
    id: user.id,
    email: user.email ?? '',
    nombre: perfil.nombre,
    rol: perfil.rol as RolUsuario,
  }
}
