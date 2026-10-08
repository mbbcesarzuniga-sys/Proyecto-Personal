/**
 * Armado del mensaje de WhatsApp. El prototipo generaba el texto en el
 * navegador; aqui lo generamos ya con el codigo del pedido, asi la
 * panaderia puede buscarlo en el panel.
 */
import { cordobas } from '@/lib/precios'
import { ETIQUETA_PAGO } from '@/types/dominio'
import type { PedidoConRenglones } from '@/types/dominio'

export function mensajePedido(pedido: PedidoConRenglones, zonaNombre?: string | null): string {
  const lineas: string[] = [
    `Hola, El Horno de Carazo. Este es mi pedido ${pedido.codigo}:`,
  ]

  for (const r of pedido.pedido_renglones) {
    lineas.push(`- ${r.cantidad} x ${r.nombre_producto} (${cordobas(r.subtotal)})`)
  }

  lineas.push(`Subtotal: ${cordobas(pedido.subtotal)}`)
  if (pedido.modo === 'entrega') {
    lineas.push(`Entrega en ${zonaNombre ?? 'mi zona'}: ${pedido.envio ? cordobas(pedido.envio) : 'gratis'}`)
  } else {
    lineas.push('Retiro en tienda')
  }
  lineas.push(`Total: ${cordobas(pedido.total)}`)
  lineas.push(`Para: ${pedido.cuando}`)
  lineas.push(`Pago: ${ETIQUETA_PAGO[pedido.metodo_pago]}`)
  lineas.push(`Nombre: ${pedido.cliente_nombre}`)
  lineas.push(`Telefono: ${pedido.cliente_telefono}`)
  if (pedido.modo === 'entrega' && pedido.direccion) {
    lineas.push(`Direccion: ${pedido.direccion}`)
  }
  if (pedido.nota) lineas.push(`Nota: ${pedido.nota}`)

  return lineas.join('\n')
}

export function mensajeEncargo(paquete: string, personas: number, fecha: string): string {
  return `Hola, quiero cotizar un encargo: ${paquete} para ${personas} personas, para el ${fecha}.`
}

/**
 * Enlace wa.me. Si no hay numero configurado devolvemos null para que la
 * interfaz esconda el boton en lugar de abrir un chat roto.
 */
export function enlaceWhatsApp(numero: string, mensaje: string): string | null {
  const limpio = numero.replace(/\D/g, '')
  if (limpio.length < 8) return null
  return `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`
}
