/**
 * Calculo de totales. Funciones puras, sin dependencias: es la unica fuente
 * de verdad de los montos y corre igual en el navegador y en el servidor.
 *
 * El servidor SIEMPRE recalcula con estas funciones antes de guardar un
 * pedido. Nunca confiamos en los totales que manda el navegador.
 */
import type { ModoEntrega, RenglonCarrito, ZonaEntrega } from '@/types/dominio'

export interface Totales {
  /** Cantidad total de unidades en la bolsa. */
  unidades: number
  subtotal: number
  envio: number
  total: number
  /** true cuando el envio salio gratis por alcanzar el minimo de la zona. */
  envioGratis: boolean
}

export function calcularSubtotal(renglones: readonly RenglonCarrito[]): number {
  return renglones.reduce((suma, r) => suma + r.precio_unitario * r.cantidad, 0)
}

export function contarUnidades(renglones: readonly RenglonCarrito[]): number {
  return renglones.reduce((suma, r) => suma + r.cantidad, 0)
}

/**
 * Costo de envio.
 * - Retiro en tienda: siempre 0.
 * - Bolsa vacia: 0 (no cobramos envio de nada).
 * - Entrega sin zona elegida: 0, y la validacion del pedido lo rechaza aparte.
 * - Zona con minimo alcanzado: 0.
 */
export function calcularEnvio(
  subtotal: number,
  unidades: number,
  modo: ModoEntrega,
  zona: ZonaEntrega | null,
): { envio: number; envioGratis: boolean } {
  if (modo === 'retiro' || unidades === 0 || !zona) {
    return { envio: 0, envioGratis: false }
  }
  const minimo = zona.envio_gratis_desde
  if (minimo !== null && subtotal >= minimo) {
    return { envio: 0, envioGratis: true }
  }
  return { envio: zona.costo, envioGratis: false }
}

export function calcularTotales(
  renglones: readonly RenglonCarrito[],
  modo: ModoEntrega,
  zona: ZonaEntrega | null,
): Totales {
  const subtotal = calcularSubtotal(renglones)
  const unidades = contarUnidades(renglones)
  const { envio, envioGratis } = calcularEnvio(subtotal, unidades, modo, zona)
  return { unidades, subtotal, envio, total: subtotal + envio, envioGratis }
}

/** Formato de moneda nicaraguense: C$1,250 */
export function cordobas(monto: number): string {
  return 'C$' + monto.toLocaleString('es-NI', { maximumFractionDigits: 0 })
}

/**
 * Cotizacion de un paquete de evento. Por cada renglon se redondea hacia
 * arriba, con minimo 1: para 30 personas y 0.05 pasteles por persona se
 * necesitan 2 pasteles, no 1.5.
 */
export function cotizarPaquete(
  renglones: readonly { descripcion: string; por_persona: number; precio: number }[],
  personas: number,
): { lineas: { descripcion: string; cantidad: number; subtotal: number }[]; total: number } {
  const lineas = renglones.map((r) => {
    const cantidad = Math.max(1, Math.ceil(personas * r.por_persona))
    return { descripcion: r.descripcion, cantidad, subtotal: cantidad * r.precio }
  })
  return { lineas, total: lineas.reduce((s, l) => s + l.subtotal, 0) }
}
