import { NextResponse } from 'next/server'
import { clienteAdministrador } from '@/lib/supabase/administrador'
import { esCodigoValido } from '@/lib/codigo-pedido'

/**
 * Consulta publica de un pedido por su codigo de seguimiento.
 *
 * El codigo es la credencial: quien lo tiene ve el pedido. Por eso NO
 * devolvemos el telefono ni la direccion completa, y el codigo tiene
 * 923.521 combinaciones por dia, asi que adivinarlo no es practico.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params

  if (!esCodigoValido(codigo)) {
    return NextResponse.json({ error: 'Codigo invalido.' }, { status: 400 })
  }

  const sb = clienteAdministrador()
  const { data, error } = await sb
    .from('pedidos')
    .select(
      `codigo, estado, modo, cuando, metodo_pago, estado_pago,
       subtotal, envio, total, creado_en, cliente_nombre,
       zonas_entrega ( nombre ),
       pedido_renglones ( nombre_producto, precio_unitario, cantidad, subtotal ),
       pedido_eventos ( estado, creado_en )`,
    )
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'No pudimos consultar el pedido.' }, { status: 503 })
  }
  if (!data) {
    return NextResponse.json({ error: 'No encontramos ese pedido.' }, { status: 404 })
  }

  // Solo el primer nombre, para no exponer datos de mas.
  const primerNombre = String(data.cliente_nombre ?? '').split(' ')[0] ?? ''
  const { cliente_nombre: _descartado, ...resto } = data

  return NextResponse.json({ ...resto, cliente_nombre: primerNombre })
}
