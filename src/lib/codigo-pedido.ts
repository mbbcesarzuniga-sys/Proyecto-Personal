/**
 * Codigo de seguimiento del pedido: HC-AAMMDD-XXXX
 * Ejemplo: HC-260408-7F3A
 *
 * Las 4 ultimas posiciones son aleatorias de un alfabeto sin caracteres
 * confundibles (sin 0/O ni 1/I/L), porque el cliente lo dicta por telefono.
 */
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generarCodigoPedido(ahora: Date = new Date()): string {
  const aa = String(ahora.getUTCFullYear()).slice(-2)
  const mm = String(ahora.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(ahora.getUTCDate()).padStart(2, '0')

  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  let sufijo = ''
  for (const b of bytes) sufijo += ALFABETO[b % ALFABETO.length]

  return `HC-${aa}${mm}${dd}-${sufijo}`
}

export const PATRON_CODIGO = /^HC-\d{6}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/

export function esCodigoValido(codigo: string): boolean {
  return PATRON_CODIGO.test(codigo)
}
