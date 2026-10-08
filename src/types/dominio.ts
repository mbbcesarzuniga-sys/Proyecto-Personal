/** Tipos del dominio. Espejan el esquema de supabase/migrations. */

export type ModoEntrega = 'entrega' | 'retiro'

export type EstadoPedido =
  | 'recibido'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado'

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta'

export type EstadoPago = 'pendiente' | 'verificando' | 'pagado' | 'fallido' | 'reembolsado'

export interface Categoria {
  id: string
  nombre: string
  orden: number
}

export interface Producto {
  id: string
  categoria_id: string
  nombre: string
  descripcion: string
  /** Cordobas enteros. */
  precio: number
  unidad: string
  etiqueta: string | null
  ilustracion: string | null
  disponible: boolean
  en_vitrina_hoy: boolean
  anticipacion_horas: number
}

export interface ZonaEntrega {
  id: string
  nombre: string
  /** Cordobas enteros. */
  costo: number
  /** Subtotal a partir del cual el envio es gratis. null = nunca. */
  envio_gratis_desde: number | null
}

export interface RenglonPaquete {
  descripcion: string
  /** Unidades necesarias por invitado. 0.05 = una unidad por cada 20 personas. */
  por_persona: number
  precio: number
}

export interface PaqueteEvento {
  id: string
  nombre: string
  renglones: RenglonPaquete[]
}

export interface DatosNegocio {
  nombre: string
  ciudad: string
  whatsapp: string
  horario: string
  direccion: string
}

export interface DatosTransferencia {
  banco: string
  cuenta: string
  titular: string
  instruccion: string
}

/** Una linea del carrito, ya resuelta contra el catalogo. */
export interface RenglonCarrito {
  producto_id: string
  nombre: string
  precio_unitario: number
  cantidad: number
}

export interface PedidoRenglon {
  producto_id: string | null
  nombre_producto: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

export interface Pedido {
  id: string
  codigo: string
  estado: EstadoPedido
  modo: ModoEntrega
  zona_id: string | null
  cliente_nombre: string
  cliente_telefono: string
  direccion: string | null
  cuando: string
  nota: string | null
  metodo_pago: MetodoPago
  estado_pago: EstadoPago
  pago_referencia: string | null
  subtotal: number
  envio: number
  total: number
  creado_en: string
  actualizado_en: string
}

export interface PedidoConRenglones extends Pedido {
  pedido_renglones: PedidoRenglon[]
}

/** Etiquetas en espanol para mostrar al cliente y en el panel. */
export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'Recibido',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparacion',
  listo: 'Listo',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

/** Orden en que avanza un pedido normal. 'cancelado' sale de este flujo. */
export const FLUJO_ESTADOS: EstadoPedido[] = [
  'recibido',
  'confirmado',
  'en_preparacion',
  'listo',
  'en_camino',
  'entregado',
]

export const ETIQUETA_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo al recibir',
  transferencia: 'Transferencia bancaria',
  tarjeta: 'Tarjeta (enlace de pago)',
}

export type RolUsuario = 'admin' | 'staff'
