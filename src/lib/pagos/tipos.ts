import type { MetodoPago, PedidoConRenglones } from '@/types/dominio'

/**
 * Interfaz de pasarela de pago.
 *
 * Nota de contexto: en Nicaragua las pasarelas internacionales (Stripe,
 * PayPal como vendedor) no estan disponibles directamente. Lo que si se usa
 * es BAC Credomatic, Banpro o Lafise con su modulo de comercio electronico,
 * que se contrata con el banco y entrega un endpoint de redireccion.
 *
 * Por eso el sitio arranca con efectivo y transferencia, que funcionan hoy,
 * y la tarjeta queda detras de esta interfaz: cuando el banco entregue las
 * credenciales se escribe un adaptador nuevo sin tocar el resto del codigo.
 */
export interface ResultadoCobro {
  /** URL a la que mandamos al cliente para pagar. null = no hay redireccion. */
  urlPago: string | null
  /** Referencia del proveedor, se guarda en pedidos.pago_referencia. */
  referencia: string | null
  /** Mensaje para mostrarle al cliente. */
  instruccion: string
}

export interface PasarelaPago {
  readonly metodo: MetodoPago
  readonly nombre: string
  /** Prepara el cobro de un pedido ya guardado. */
  iniciar(pedido: PedidoConRenglones): Promise<ResultadoCobro>
}
