import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { clienteAdministrador } from '@/lib/supabase/administrador'
import { esCodigoValido } from '@/lib/codigo-pedido'
import { cordobas } from '@/lib/precios'
import { LineaTiempoPedido } from '@/components/LineaTiempoPedido'
import { LimpiarBolsa } from '@/components/LimpiarBolsa'
import { ETIQUETA_ESTADO, ETIQUETA_PAGO } from '@/types/dominio'
import type { EstadoPedido, MetodoPago, ModoEntrega } from '@/types/dominio'

export const metadata: Metadata = {
  title: 'Seguimiento de tu pedido',
  robots: { index: false, follow: false },
}

/** Nunca cacheamos: el estado del pedido cambia mientras el cliente mira. */
export const dynamic = 'force-dynamic'

interface Fila {
  codigo: string
  estado: EstadoPedido
  modo: ModoEntrega
  cuando: string
  metodo_pago: MetodoPago
  estado_pago: string
  direccion: string | null
  nota: string | null
  subtotal: number
  envio: number
  total: number
  creado_en: string
  cliente_nombre: string
  zonas_entrega: { nombre: string } | null
  pedido_renglones: { nombre_producto: string; cantidad: number; subtotal: number }[]
  pedido_eventos: { estado: EstadoPedido; creado_en: string }[]
}

export default async function PaginaPedido({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>
  searchParams: Promise<{ nuevo?: string }>
}) {
  const { codigo } = await params
  const { nuevo } = await searchParams

  if (!esCodigoValido(codigo)) notFound()

  const sb = clienteAdministrador()
  const { data } = await sb
    .from('pedidos')
    .select(
      `codigo, estado, modo, cuando, metodo_pago, estado_pago, direccion, nota,
       subtotal, envio, total, creado_en, cliente_nombre,
       zonas_entrega ( nombre ),
       pedido_renglones ( nombre_producto, cantidad, subtotal ),
       pedido_eventos ( estado, creado_en )`,
    )
    .eq('codigo', codigo)
    .maybeSingle<Fila>()

  if (!data) notFound()

  const primerNombre = data.cliente_nombre.split(' ')[0] ?? ''
  const eventos = [...data.pedido_eventos].sort(
    (a, b) => +new Date(a.creado_en) - +new Date(b.creado_en),
  )

  return (
    <main className="wrap">
      <LimpiarBolsa activo={nuevo === '1'} />

      <section className="pila" style={{ paddingBlock: 28 }}>
        {nuevo === '1' && (
          <p className="exito" role="status">
            Listo, {primerNombre}. Recibimos tu pedido y la panaderia ya lo esta viendo. Guarda
            este codigo.
          </p>
        )}

        <div className="tarjeta pila">
          <div className="fila-sb">
            <div>
              <p className="eyebrow">Codigo de seguimiento</p>
              <p className="codigo-grande">{data.codigo}</p>
            </div>
            <span className="insignia" data-estado={data.estado}>
              {ETIQUETA_ESTADO[data.estado]}
            </span>
          </div>
          <p className="nota">
            Guardalo o compartilo: con este codigo podes ver el avance en cualquier momento desde{' '}
            <Link className="enlace" href="/pedido">
              esta pagina
            </Link>
            .
          </p>
        </div>

        <div className="cols-2">
          <div className="tarjeta pila">
            <h2 style={{ fontSize: '1.2rem' }}>Avance</h2>
            <LineaTiempoPedido estado={data.estado} eventos={eventos} modo={data.modo} />
          </div>

          <div className="tarjeta pila">
            <h2 style={{ fontSize: '1.2rem' }}>Detalle</h2>
            <ul className="resumen-caja" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.pedido_renglones.map((r, i) => (
                <li key={`${r.nombre_producto}-${i}`}>
                  <span>
                    {r.cantidad} × {r.nombre_producto}
                  </span>
                  <span className="tabular">{cordobas(r.subtotal)}</span>
                </li>
              ))}
              <li>
                <span>Subtotal</span>
                <span className="tabular">{cordobas(data.subtotal)}</span>
              </li>
              <li>
                <span>
                  {data.modo === 'entrega'
                    ? `Entrega en ${data.zonas_entrega?.nombre ?? 'tu zona'}`
                    : 'Retiro en tienda'}
                </span>
                <span className="tabular">{data.envio > 0 ? cordobas(data.envio) : 'gratis'}</span>
              </li>
              <li className="tot">
                <span>Total</span>
                <span className="tabular">{cordobas(data.total)}</span>
              </li>
            </ul>

            <dl className="horario" style={{ marginTop: 4 }}>
              <dt>Para</dt>
              <dd>{data.cuando}</dd>
              <dt>Pago</dt>
              <dd>{ETIQUETA_PAGO[data.metodo_pago]}</dd>
              {data.modo === 'entrega' && data.direccion && (
                <>
                  <dt>Direccion</dt>
                  <dd>{data.direccion}</dd>
                </>
              )}
              {data.nota && (
                <>
                  <dt>Nota</dt>
                  <dd>{data.nota}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </section>
    </main>
  )
}
