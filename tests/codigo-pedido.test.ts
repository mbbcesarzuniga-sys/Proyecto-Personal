import { describe, expect, it } from 'vitest'
import { esCodigoValido, generarCodigoPedido } from '@/lib/codigo-pedido'

describe('codigo de pedido', () => {
  it('tiene el formato HC-AAMMDD-XXXX', () => {
    expect(generarCodigoPedido(new Date('2026-04-08T12:00:00Z'))).toMatch(/^HC-260408-.{4}$/)
  })

  it('se valida a si mismo', () => {
    expect(esCodigoValido(generarCodigoPedido())).toBe(true)
  })

  it('rechaza basura', () => {
    for (const malo of ['', 'HC-123', 'hc-260408-7F3A', 'HC-260408-7F3', 'XX-260408-7F3A']) {
      expect(esCodigoValido(malo)).toBe(false)
    }
  })

  it('no usa caracteres confundibles (0 O 1 I L)', () => {
    const sufijos = Array.from({ length: 300 }, () => generarCodigoPedido().slice(-4)).join('')
    expect(sufijos).not.toMatch(/[01OIL]/)
  })

  it('practicamente no repite', () => {
    const n = 500
    const unicos = new Set(Array.from({ length: n }, () => generarCodigoPedido()))
    // 31^4 = 923.521 combinaciones por dia: con 500 muestras esperamos casi cero choques.
    expect(unicos.size).toBeGreaterThan(n * 0.98)
  })
})
