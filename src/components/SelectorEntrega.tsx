'use client'
import { useCarrito } from './ProveedorCarrito'
import { cordobas } from '@/lib/precios'
import type { ZonaEntrega } from '@/types/dominio'

export function SelectorEntrega({ zonas }: { zonas: ZonaEntrega[] }) {
  const { modo, ponerModo, zonaId, ponerZona, zona } = useCarrito()

  const info =
    modo === 'retiro'
      ? 'Lo pasas a traer en la tienda de Jinotepe. Te avisamos por WhatsApp cuando este listo.'
      : zona?.envio_gratis_desde
        ? `Entrega gratis en ${zona.nombre} en pedidos desde ${cordobas(zona.envio_gratis_desde)}.`
        : zona
          ? `Entregamos en ${zona.nombre} de 8:00 a.m. a 7:00 p.m. por ${cordobas(zona.costo)}.`
          : 'Elegi tu municipio para calcular el envio.'

  return (
    <div className="modo">
      <div className="seg" role="group" aria-label="Modo de entrega">
        <button type="button" aria-pressed={modo === 'entrega'} onClick={() => ponerModo('entrega')}>
          Entrega
        </button>
        <button type="button" aria-pressed={modo === 'retiro'} onClick={() => ponerModo('retiro')}>
          Retiro en tienda
        </button>
      </div>

      <div className="campo" style={{ visibility: modo === 'entrega' ? 'visible' : 'hidden' }}>
        <label htmlFor="muni">Municipio</label>
        <select id="muni" value={zonaId ?? ''} onChange={(e) => ponerZona(e.target.value)}>
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nombre} · {cordobas(z.costo)}
            </option>
          ))}
        </select>
      </div>

      <p className="info">{info}</p>
    </div>
  )
}
