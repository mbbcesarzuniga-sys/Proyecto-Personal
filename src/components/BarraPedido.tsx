'use client'
import Link from 'next/link'
import { useCarrito } from './ProveedorCarrito'
import { cordobas } from '@/lib/precios'

/** Barra fija inferior: el estado de la bolsa siempre visible, como en la tienda. */
export function BarraPedido() {
  const { totales, modo, listo } = useCarrito()
  const vacia = !listo || totales.unidades === 0

  const detalle =
    modo === 'entrega'
      ? totales.envio > 0
        ? `Entrega ${cordobas(totales.envio)}`
        : 'Entrega gratis'
      : 'Retiro en tienda'

  return (
    <div className="canasta">
      <p className="resumen">
        {vacia ? 'Tu bolsa esta vacia' : `${totales.unidades} producto${totales.unidades > 1 ? 's' : ''} · ${cordobas(totales.total)}`}
        <small>{vacia ? 'Agrega algo del menu para empezar' : detalle}</small>
      </p>
      {vacia ? (
        <Link className="btn btn-sec" href="/#menu">
          Ver el menu
        </Link>
      ) : (
        <Link className="btn btn-wa" href="/carrito">
          Revisar y pedir
        </Link>
      )}
    </div>
  )
}
