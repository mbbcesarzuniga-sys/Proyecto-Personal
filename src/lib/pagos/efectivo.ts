import type { PasarelaPago, ResultadoCobro } from './tipos'

/** Pago contra entrega o al retirar. No hay nada que cobrar en linea. */
export const efectivo: PasarelaPago = {
  metodo: 'efectivo',
  nombre: 'Efectivo al recibir',
  async iniciar(): Promise<ResultadoCobro> {
    return {
      urlPago: null,
      referencia: null,
      instruccion: 'Pagas en efectivo al recibir el pedido. Llevamos cambio.',
    }
  },
}
