import Link from 'next/link'
import { clienteServidor } from '@/lib/supabase/servidor'
import { cordobas } from '@/lib/precios'
import { ETIQUETA_ESTADO } from '@/types/dominio'
import type { EstadoPedido } from '@/types/dominio'

export const dynamic = 'force-dynamic'

export default async function ResumenAdmin() {
  const sb = await clienteServidor()

  const inicioDeHoy = new Date()
  inicioDeHoy.setHours(0, 0, 0, 0)

  const { data: pedidosHoy } = await sb
    .from('pedidos')
    .select('id,codigo,estado,total,cliente_nombre,creado_en,modo')
    .gte('creado_en', inicioDeHoy.toISOString())
    .order('creado_en', { ascending: false })

  const filas = pedidosHoy ?? []
  const activos = filas.filter((p) => !['entregado', 'cancelado'].includes(p.estado))
  const porCobrar = filas
    .filter((p) => p.estado !== 'cancelado')
    .reduce((s, p) => s + p.total, 0)

  return (
    <>
      <section style={{ paddingBlock: 24 }}>
        <p className="eyebrow">Hoy</p>
        <h2>
          {filas.length === 0
            ? 'Todavia no entran pedidos hoy'
            : `${filas.length} pedido${filas.length > 1 ? 's' : ''} hoy`}
        </h2>
      </section>

      <div className="kpis">
        <div className="kpi">
          <p className="n">{filas.length}</p>
          <p className="et">Pedidos de hoy</p>
        </div>
        <div className="kpi">
          <p className="n">{activos.length}</p>
          <p className="et">En proceso</p>
        </div>
        <div className="kpi">
          <p className="n">{cordobas(porCobrar)}</p>
          <p className="et">Vendido hoy</p>
        </div>
        <div className="kpi">
          <p className="n">{filas.filter((p) => p.modo === 'entrega').length}</p>
          <p className="et">Para entrega</p>
        </div>
      </div>

      <div className="fila-sb" style={{ marginBottom: 12 }}>
        <h3>Ultimos pedidos</h3>
        <Link className="enlace" href="/admin/pedidos">
          Ver todos
        </Link>
      </div>

      <div className="envoltorio-tabla">
        <table className="tabla">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {filas.slice(0, 10).map((p) => (
              <tr key={p.id}>
                <td>
                  <Link className="enlace" href={`/admin/pedidos#${p.codigo}`}>
                    {p.codigo}
                  </Link>
                </td>
                <td>{p.cliente_nombre}</td>
                <td>
                  <span className="chip-estado">
                    {ETIQUETA_ESTADO[p.estado as EstadoPedido]}
                  </span>
                </td>
                <td className="tabular">{cordobas(p.total)}</td>
                <td className="nota">
                  {new Date(p.creado_en).toLocaleTimeString('es-NI', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Sin pedidos todavia. Cuando entre uno aparece aqui al instante.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
