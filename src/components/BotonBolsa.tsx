'use client'
import Link from 'next/link'
import { useCarrito } from './ProveedorCarrito'

export function BotonBolsa() {
  const { totales, listo } = useCarrito()
  return (
    <Link className="btn btn-pedir" href="/carrito">
      {listo && totales.unidades > 0 ? `Mi pedido (${totales.unidades})` : 'Mi pedido'}
    </Link>
  )
}
