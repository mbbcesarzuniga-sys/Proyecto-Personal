import 'server-only'
import type { DatosTransferencia, MetodoPago, PedidoConRenglones } from '@/types/dominio'
import { efectivo } from './efectivo'
import { transferencia } from './transferencia'
import type { PasarelaPago, ResultadoCobro } from './tipos'

export type { PasarelaPago, ResultadoCobro } from './tipos'

/**
 * Elige la pasarela segun el metodo que pidio el cliente.
 *
 * 'tarjeta' todavia no tiene adaptador: para activarla hay que contratar el
 * modulo de comercio electronico con el banco y escribir un archivo nuevo
 * en esta carpeta que implemente PasarelaPago. Mientras no exista, el
 * esquema de validacion la acepta pero aqui devolvemos una instruccion que
 * manda al cliente a coordinar por WhatsApp, en lugar de fingir un cobro.
 */
export async function iniciarCobro(
  metodo: MetodoPago,
  pedido: PedidoConRenglones,
  datosTransferencia: DatosTransferencia,
): Promise<ResultadoCobro> {
  const pasarelas: Record<MetodoPago, PasarelaPago | null> = {
    efectivo,
    transferencia: transferencia(datosTransferencia),
    tarjeta: null,
  }

  const pasarela = pasarelas[metodo]
  if (!pasarela) {
    return {
      urlPago: null,
      referencia: null,
      instruccion:
        'El pago con tarjeta todavia no esta activo. Te escribimos por WhatsApp para ' +
        'coordinar el pago de este pedido.',
    }
  }
  return pasarela.iniciar(pedido)
}
