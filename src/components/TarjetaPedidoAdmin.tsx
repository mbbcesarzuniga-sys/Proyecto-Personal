'use client'
import { useState, useTransition } from 'react'
import { marcarPagado, moverEstadoPedido } from '@/app/admin/acciones'
import { cordobas } from '@/lib/precios'
import { ETIQUETA_ESTADO, ETIQUETA_PAGO, FLUJO_ESTADOS } from '@/types/dominio'
import type { EstadoPedido } from '@/types/dominio'
import type { FilaPedidoAdmin } from '@/app/admin/pedidos/page'

/** Siguiente paso natural del pedido, para el boton grande de avanzar. */
function siguienteEstado(actual: EstadoPedido, modo: 'entrega' | 'retiro'): EstadoPedido | null {
  const pasos = FLUJO_ESTADOS.filter((e) => modo === 'entrega' || e !== 'en_camino')
  const i = pasos.indexOf(actual)
  if (i < 0 || i === pasos.length - 1) return null
  return pasos[i + 1] ?? null
}

export function TarjetaPedidoAdmin({ pedido }: { pedido: FilaPedidoAdmin }) {
  const [pendiente, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const proximo = siguienteEstado(pedido.estado, pedido.modo)
  const cerrado = pedido.estado === 'entregado' || pedido.estado === 'cancelado'

  function mover(estado: EstadoPedido) {
    setError(null)
    iniciar(async () => {
      const r = await moverEstadoPedido(pedido.id, estado)
      if (!r.ok) setError(r.error ?? 'Algo fallo.')
    })
  }

  function pagar() {
    setError(null)
    iniciar(async () => {
      const r = await marcarPagado(pedido.id)
      if (!r.ok) setError(r.error ?? 'Algo fallo.')
    })
  }

  return (
    <article className="tarjeta pila" id={pedido.codigo}>
      <div className="fila-sb">
        <div>
          <p className="eyebrow">{pedido.codigo}</p>
          <h3>
            {pedido.cliente_nombre} ·{' '}
            <a className="enlace" href={`tel:${pedido.cliente_telefono}`}>
              {pedido.cliente_telefono}
            </a>
          </h3>
          <p className="nota">
            {new Date(pedido.creado_en).toLocaleString('es-NI', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
            })}{' '}
            · Para: {pedido.cuando}
          </p>
        </div>
        <span className="insignia" data-estado={pedido.estado}>
          {ETIQUETA_ESTADO[pedido.estado]}
        </span>
      </div>

      <div className="cols-2">
        <div>
          <table className="zonas">
            <tbody>
              {pedido.pedido_renglones.map((r, i) => (
                <tr key={`${r.nombre_producto}-${i}`}>
                  <td>
                    {r.cantidad} × {r.nombre_producto}
                  </td>
                  <td className="tabular">{cordobas(r.subtotal)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>Total</b>
                </td>
                <td className="tabular">
                  <b>{cordobas(pedido.total)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <dl className="horario">
          <dt>Entrega</dt>
          <dd>
            {pedido.modo === 'entrega'
              ? `${pedido.zonas_entrega?.nombre ?? 'zona sin nombre'} · ${cordobas(pedido.envio)}`
              : 'Retiro en tienda'}
          </dd>
          {pedido.direccion && (
            <>
              <dt>Direccion</dt>
              <dd>{pedido.direccion}</dd>
            </>
          )}
          <dt>Pago</dt>
          <dd>
            {ETIQUETA_PAGO[pedido.metodo_pago]} · {pedido.estado_pago}
            {pedido.pago_referencia ? ` · ref. ${pedido.pago_referencia}` : ''}
          </dd>
          {pedido.nota && (
            <>
              <dt>Nota</dt>
              <dd>{pedido.nota}</dd>
            </>
          )}
        </dl>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="ctas">
        {proximo && (
          <button
            className="btn btn-pedir"
            type="button"
            disabled={pendiente}
            onClick={() => mover(proximo)}
          >
            {pendiente ? 'Guardando…' : `Marcar ${ETIQUETA_ESTADO[proximo].toLowerCase()}`}
          </button>
        )}
        {pedido.estado_pago !== 'pagado' && pedido.estado !== 'cancelado' && (
          <button className="btn btn-sec" type="button" disabled={pendiente} onClick={pagar}>
            Marcar pagado
          </button>
        )}
        {!cerrado && (
          <button
            className="btn btn-sec"
            type="button"
            disabled={pendiente}
            onClick={() => {
              if (confirm(`Cancelar el pedido ${pedido.codigo}?`)) mover('cancelado')
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </article>
  )
}
