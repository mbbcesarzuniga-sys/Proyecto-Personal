import { NextResponse } from 'next/server'
import { clienteAdministrador } from '@/lib/supabase/administrador'
import { generarCodigoPedido } from '@/lib/codigo-pedido'
import { calcularTotales } from '@/lib/precios'
import { iniciarCobro } from '@/lib/pagos'
import { pedidoEntrante } from '@/lib/validacion'
import type {
  DatosTransferencia,
  PedidoConRenglones,
  RenglonCarrito,
  ZonaEntrega,
} from '@/types/dominio'

/** Cuantos pedidos puede mandar un mismo telefono en la ventana de abajo. */
const LIMITE_PEDIDOS = 5
const VENTANA_MINUTOS = 10

export async function POST(peticion: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo invalido.' }, { status: 400 })
  }

  const analisis = pedidoEntrante.safeParse(cuerpo)
  if (!analisis.success) {
    return NextResponse.json(
      {
        error: 'Revisa los datos del pedido.',
        detalles: analisis.error.issues.map((i) => ({
          campo: i.path.join('.'),
          mensaje: i.message,
        })),
      },
      { status: 422 },
    )
  }
  const entrada = analisis.data
  const sb = clienteAdministrador()

  // --- Freno de abuso -----------------------------------------------------
  // Sin esto, cualquiera puede llenar la cocina de pedidos falsos. No es un
  // limitador completo (eso pide Redis o el WAF del hosting), pero corta el
  // caso simple de mandar el formulario cien veces.
  const desde = new Date(Date.now() - VENTANA_MINUTOS * 60_000).toISOString()
  const { count } = await sb
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_telefono', entrada.cliente_telefono)
    .gte('creado_en', desde)

  if ((count ?? 0) >= LIMITE_PEDIDOS) {
    return NextResponse.json(
      { error: 'Ya recibimos varios pedidos de este numero. Escribinos por WhatsApp.' },
      { status: 429 },
    )
  }

  // --- Precios: los toma la base, NUNCA el navegador ----------------------
  const ids = [...new Set(entrada.renglones.map((r) => r.producto_id))]
  const { data: productos, error: errProd } = await sb
    .from('productos')
    .select('id,nombre,precio,disponible')
    .in('id', ids)

  if (errProd) {
    return NextResponse.json({ error: 'No pudimos leer el catalogo.' }, { status: 503 })
  }

  const porId = new Map((productos ?? []).map((p) => [p.id, p]))
  const noDisponibles: string[] = []
  const renglones: RenglonCarrito[] = []

  for (const pedido of entrada.renglones) {
    const prod = porId.get(pedido.producto_id)
    if (!prod || !prod.disponible) {
      noDisponibles.push(prod?.nombre ?? pedido.producto_id)
      continue
    }
    renglones.push({
      producto_id: prod.id,
      nombre: prod.nombre,
      precio_unitario: prod.precio,
      cantidad: pedido.cantidad,
    })
  }

  if (noDisponibles.length > 0) {
    return NextResponse.json(
      {
        error: `Se acabo: ${noDisponibles.join(', ')}. Quitalo de tu bolsa y volve a intentar.`,
        no_disponibles: noDisponibles,
      },
      { status: 409 },
    )
  }

  // --- Zona de entrega ----------------------------------------------------
  let zona: ZonaEntrega | null = null
  if (entrada.modo === 'entrega' && entrada.zona_id) {
    const { data } = await sb
      .from('zonas_entrega')
      .select('id,nombre,costo,envio_gratis_desde')
      .eq('id', entrada.zona_id)
      .eq('activa', true)
      .maybeSingle()
    if (!data) {
      return NextResponse.json(
        { error: 'Ese municipio no esta disponible para entrega.' },
        { status: 422 },
      )
    }
    zona = data as ZonaEntrega
  }

  const totales = calcularTotales(renglones, entrada.modo, zona)

  // --- Guardado atomico ---------------------------------------------------
  const codigo = generarCodigoPedido()
  const { data: creado, error: errCrear } = await sb
    .rpc('crear_pedido', {
      p_codigo: codigo,
      p_modo: entrada.modo,
      p_zona_id: zona?.id ?? null,
      p_cliente_nombre: entrada.cliente_nombre,
      p_cliente_telefono: entrada.cliente_telefono,
      p_direccion: entrada.modo === 'entrega' ? (entrada.direccion ?? null) : null,
      p_cuando: entrada.cuando,
      p_nota: entrada.nota ?? null,
      p_metodo_pago: entrada.metodo_pago,
      p_subtotal: totales.subtotal,
      p_envio: totales.envio,
      p_total: totales.total,
      p_renglones: renglones.map((r) => ({
        producto_id: r.producto_id,
        nombre_producto: r.nombre,
        precio_unitario: r.precio_unitario,
        cantidad: r.cantidad,
        subtotal: r.precio_unitario * r.cantidad,
      })),
    })
    .single()

  if (errCrear || !creado) {
    console.error('crear_pedido fallo', errCrear)
    return NextResponse.json(
      { error: 'No pudimos guardar tu pedido. Intenta de nuevo o escribinos por WhatsApp.' },
      { status: 500 },
    )
  }

  // --- Cobro --------------------------------------------------------------
  const { data: cfgPagos } = await sb
    .from('configuracion')
    .select('valor')
    .eq('clave', 'pagos')
    .maybeSingle()

  const datosTransferencia =
    ((cfgPagos?.valor as { transferencia?: DatosTransferencia } | null)?.transferencia) ?? {
      banco: '', cuenta: '', titular: '', instruccion: '',
    }

  const pedidoCompleto: PedidoConRenglones = {
    id: (creado as { id: string }).id,
    codigo,
    estado: 'recibido',
    modo: entrada.modo,
    zona_id: zona?.id ?? null,
    cliente_nombre: entrada.cliente_nombre,
    cliente_telefono: entrada.cliente_telefono,
    direccion: entrada.direccion ?? null,
    cuando: entrada.cuando,
    nota: entrada.nota ?? null,
    metodo_pago: entrada.metodo_pago,
    estado_pago: 'pendiente',
    pago_referencia: entrada.pago_referencia ?? null,
    subtotal: totales.subtotal,
    envio: totales.envio,
    total: totales.total,
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
    pedido_renglones: renglones.map((r) => ({
      producto_id: r.producto_id,
      nombre_producto: r.nombre,
      precio_unitario: r.precio_unitario,
      cantidad: r.cantidad,
      subtotal: r.precio_unitario * r.cantidad,
    })),
  }

  const cobro = await iniciarCobro(entrada.metodo_pago, pedidoCompleto, datosTransferencia)

  if (entrada.pago_referencia) {
    await sb
      .from('pedidos')
      .update({ pago_referencia: entrada.pago_referencia, estado_pago: 'verificando' })
      .eq('id', pedidoCompleto.id)
  }

  return NextResponse.json(
    {
      codigo,
      totales,
      zona: zona?.nombre ?? null,
      pago: cobro,
    },
    { status: 201 },
  )
}
