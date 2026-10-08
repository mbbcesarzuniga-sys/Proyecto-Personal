import type { DatosTransferencia } from '@/types/dominio'
import type { PasarelaPago, ResultadoCobro } from './tipos'

/**
 * Transferencia bancaria. El cobro no se automatiza: el cliente transfiere,
 * manda el comprobante por WhatsApp y el personal marca el pago como
 * verificado en el panel. Es el metodo que mas se usa en Nicaragua.
 */
export function transferencia(datos: DatosTransferencia): PasarelaPago {
  return {
    metodo: 'transferencia',
    nombre: 'Transferencia bancaria',
    async iniciar(pedido): Promise<ResultadoCobro> {
      return {
        urlPago: null,
        referencia: null,
        instruccion:
          `Transferi a ${datos.banco}, cuenta ${datos.cuenta} a nombre de ${datos.titular}. ` +
          `Pone ${pedido.codigo} como concepto. ${datos.instruccion}`,
      }
    },
  }
}
