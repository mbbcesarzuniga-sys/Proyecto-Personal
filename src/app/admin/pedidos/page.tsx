import { clienteServidor } from '@/lib/supabase/servidor'
import { TarjetaPedidoAdmin } from '@/components/TarjetaPedidoAdmin'
import type { EstadoPedido, MetodoPago, ModoEntrega } from '@/types/dominio'

export const dynamic = 'force-dynamic'

export interface FilaPedidoAdmin {
  id: string
  codigo: string
  estado: EstadoPedido
  estado_pago: string
  modo: ModoEntrega
  cliente_nombre: string
  cliente_telefono: string
  direccion: string | null
  cuando: string
  nota: string | null
  metodo_pago: MetodoPago
  pago_referencia: string | null
  subtotal: number
  envio: number
  total: number
  creado_en: string
  zonas_entrega: { nombre: string } | null
  pedido_renglones: { nombre_producto: string; cantidad: number; subtotal: number }[]
}

export default async function PedidosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const { ver } = await searchParams
  const soloActivos = ver !== 'todos'

  const sb = await clienteServidor()
  let consulta = sb
    .from('pedidos')
    .select(
      `id, codigo, estado, estado_pago, modo, cliente_nombre, cliente_telefono, direccion,
       cuando, nota, metodo_pago, pago_referencia, subtotal, envio, total, creado_en,
       zonas_entrega ( nombre ),
       pedido_renglones ( nombre_producto, cantidad, subtotal )`,
    )
    .order('creado_en', { ascending: false })
    .limit(100)

  if (soloActivos) {
    consulta = consulta.not('estado', 'in', '("entregado","cancelado")')
  }

  const { data, error } = await consulta.returns<FilaPedidoAdmin[]>()

  return (
    <>
      <section style={{ paddingBlock: 24 }}>
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Cocina</p>
            <h2>{soloActivos ? 'Pedidos en proceso' : 'Todos los pedidos'}</h2>
          </div>
          <div className="seg">
            <a href="/admin/pedidos" aria-current={soloActivos ? 'page' : undefined}>
              <button type="button" aria-pressed={soloActivos}>
                En proceso
              </button>
            </a>
            <a href="/admin/pedidos?ver=todos" aria-current={soloActivos ? undefined : 'page'}>
              <button type="button" aria-pressed={!soloActivos}>
                Todos
              </button>
            </a>
          </div>
        </div>
      </section>

      {error && <p className="error">No pudimos cargar los pedidos. Recarga la pagina.</p>}

      <div className="pila">
        {(data ?? []).map((p) => (
          <TarjetaPedidoAdmin key={p.id} pedido={p} />
        ))}
        {data && data.length === 0 && (
          <p className="muted">
            {soloActivos
              ? 'Nada en proceso. Todo entregado.'
              : 'Todavia no hay pedidos registrados.'}
          </p>
        )}
      </div>
    </>
  )
}
