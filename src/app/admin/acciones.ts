'use server'

import { revalidatePath } from 'next/cache'
import { clienteServidor } from '@/lib/supabase/servidor'
import { exigirPersonal } from '@/lib/sesion'
import { cambioEstado } from '@/lib/validacion'

/**
 * Acciones del panel. Todas pasan por exigirPersonal() y luego escriben con
 * el cliente de sesion (no con la service role key), para que las politicas
 * RLS sigan aplicando. Si manana se le quita el permiso a alguien, deja de
 * poder escribir aunque la accion se invoque a mano.
 */

export async function moverEstadoPedido(
  pedidoId: string,
  nuevoEstado: string,
): Promise<{ ok: boolean; error?: string }> {
  await exigirPersonal()

  const analisis = cambioEstado.safeParse({ estado: nuevoEstado })
  if (!analisis.success) return { ok: false, error: 'Estado invalido.' }

  const sb = await clienteServidor()
  const { error } = await sb
    .from('pedidos')
    .update({ estado: analisis.data.estado })
    .eq('id', pedidoId)

  if (error) return { ok: false, error: 'No se pudo cambiar el estado.' }

  revalidatePath('/admin/pedidos')
  revalidatePath('/admin')
  return { ok: true }
}

export async function marcarPagado(pedidoId: string): Promise<{ ok: boolean; error?: string }> {
  await exigirPersonal()
  const sb = await clienteServidor()
  const { error } = await sb
    .from('pedidos')
    .update({ estado_pago: 'pagado' })
    .eq('id', pedidoId)

  if (error) return { ok: false, error: 'No se pudo marcar el pago.' }
  revalidatePath('/admin/pedidos')
  return { ok: true }
}

export async function alternarDisponible(
  productoId: string,
  disponible: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await exigirPersonal()
  const sb = await clienteServidor()
  const { error } = await sb.from('productos').update({ disponible }).eq('id', productoId)

  if (error) return { ok: false, error: 'No se pudo actualizar el producto.' }
  revalidatePath('/admin/productos')
  revalidatePath('/')
  return { ok: true }
}

export async function alternarVitrina(
  productoId: string,
  enVitrina: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await exigirPersonal()
  const sb = await clienteServidor()
  const { error } = await sb
    .from('productos')
    .update({ en_vitrina_hoy: enVitrina })
    .eq('id', productoId)

  if (error) return { ok: false, error: 'No se pudo actualizar la vitrina.' }
  revalidatePath('/admin/productos')
  revalidatePath('/')
  return { ok: true }
}

export async function cambiarPrecio(
  productoId: string,
  precio: number,
): Promise<{ ok: boolean; error?: string }> {
  await exigirPersonal()

  if (!Number.isInteger(precio) || precio < 0 || precio > 1_000_000) {
    return { ok: false, error: 'El precio debe ser un entero en cordobas.' }
  }

  const sb = await clienteServidor()
  const { error } = await sb.from('productos').update({ precio }).eq('id', productoId)

  if (error) return { ok: false, error: 'No se pudo cambiar el precio.' }
  revalidatePath('/admin/productos')
  revalidatePath('/')
  return { ok: true }
}
