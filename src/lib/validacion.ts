import { z } from 'zod'

/**
 * Esquemas de entrada. Todo lo que llega del navegador pasa por aqui antes
 * de tocar la base de datos.
 */

/** Telefono nicaraguense: 8 digitos, con o sin el prefijo 505. */
const telefono = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(\+?505)?[5-8]\d{7}$/.test(v), {
    message: 'Escribi un numero de Nicaragua de 8 digitos, por ejemplo 8123 4567.',
  })

export const renglonEntrante = z.object({
  producto_id: z.string().min(1).max(64),
  cantidad: z.number().int().positive().max(99),
})

export const pedidoEntrante = z
  .object({
    modo: z.enum(['entrega', 'retiro']),
    zona_id: z.string().min(1).max(64).nullable().optional(),
    cliente_nombre: z.string().trim().min(2, 'Decinos tu nombre.').max(120),
    cliente_telefono: telefono,
    direccion: z.string().trim().max(500).optional(),
    cuando: z.string().trim().min(1).max(120),
    nota: z.string().trim().max(500).optional(),
    metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta']),
    pago_referencia: z.string().trim().max(120).optional(),
    // Maximo 50 renglones distintos: suficiente para cualquier pedido real
    // y nos protege de una peticion inflada a proposito.
    renglones: z.array(renglonEntrante).min(1, 'Tu bolsa esta vacia.').max(50),
  })
  .refine((p) => p.modo !== 'entrega' || (p.direccion && p.direccion.length >= 5), {
    message: 'Para entrega necesitamos la direccion.',
    path: ['direccion'],
  })
  .refine((p) => p.modo !== 'entrega' || !!p.zona_id, {
    message: 'Elegi el municipio de entrega.',
    path: ['zona_id'],
  })

export type PedidoEntrante = z.infer<typeof pedidoEntrante>

export const cambioEstado = z.object({
  estado: z.enum([
    'recibido',
    'confirmado',
    'en_preparacion',
    'listo',
    'en_camino',
    'entregado',
    'cancelado',
  ]),
  nota: z.string().trim().max(500).optional(),
})
