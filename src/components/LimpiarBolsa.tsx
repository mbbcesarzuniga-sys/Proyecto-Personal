'use client'
import { useEffect } from 'react'
import { useCarrito } from './ProveedorCarrito'

/**
 * Vacia la bolsa una vez que el cliente ya esta viendo su pedido guardado.
 * Lo hacemos aqui y no al enviar el formulario: si la red falla a mitad de
 * camino, el cliente conserva su bolsa y puede reintentar.
 */
export function LimpiarBolsa({ activo }: { activo: boolean }) {
  const { vaciar, listo } = useCarrito()
  useEffect(() => {
    if (activo && listo) vaciar()
  }, [activo, listo, vaciar])
  return null
}
