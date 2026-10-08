import { ETIQUETA_ESTADO, FLUJO_ESTADOS } from '@/types/dominio'
import type { EstadoPedido } from '@/types/dominio'

interface Evento {
  estado: EstadoPedido
  creado_en: string
}

/**
 * Muestra el avance del pedido. Si fue cancelado no dibujamos el flujo
 * normal: seria confuso ver pasos "pendientes" de algo que no va a pasar.
 */
export function LineaTiempoPedido({
  estado,
  eventos,
  modo,
}: {
  estado: EstadoPedido
  eventos: Evento[]
  modo: 'entrega' | 'retiro'
}) {
  if (estado === 'cancelado') {
    return (
      <p className="error">
        Este pedido fue cancelado. Si crees que es un error, escribinos por WhatsApp con tu
        codigo.
      </p>
    )
  }

  // En retiro no hay reparto: el paso "en camino" no aplica.
  const pasos = FLUJO_ESTADOS.filter((e) => modo === 'entrega' || e !== 'en_camino')
  const indiceActual = pasos.indexOf(estado)
  const cuandoPaso = new Map(eventos.map((e) => [e.estado, e.creado_en]))

  return (
    <ol className="linea-tiempo">
      {pasos.map((paso, i) => {
        const hecho = i <= indiceActual
        const marca = cuandoPaso.get(paso)
        return (
          <li
            key={paso}
            data-hecho={hecho ? 'si' : 'no'}
            data-actual={i === indiceActual ? 'si' : 'no'}
          >
            <span className="punto" aria-hidden="true">
              {hecho ? '✓' : i + 1}
            </span>
            <span>
              <span className="nombre">{ETIQUETA_ESTADO[paso]}</span>
              {marca && (
                <span className="cuando">
                  {new Date(marca).toLocaleString('es-NI', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
