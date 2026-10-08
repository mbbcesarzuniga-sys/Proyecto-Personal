import { describe, expect, it } from 'vitest'
import {
  calcularEnvio,
  calcularSubtotal,
  calcularTotales,
  contarUnidades,
  cordobas,
  cotizarPaquete,
} from '@/lib/precios'
import type { RenglonCarrito, ZonaEntrega } from '@/types/dominio'

const jinotepe: ZonaEntrega = {
  id: 'jinotepe', nombre: 'Jinotepe', costo: 40, envio_gratis_desde: 600,
}
const diriamba: ZonaEntrega = {
  id: 'diriamba', nombre: 'Diriamba', costo: 60, envio_gratis_desde: null,
}

const r = (precio: number, cantidad: number): RenglonCarrito => ({
  producto_id: 'x', nombre: 'x', precio_unitario: precio, cantidad,
})

describe('subtotal y unidades', () => {
  it('suma precio por cantidad', () => {
    expect(calcularSubtotal([r(45, 2), r(80, 3)])).toBe(330)
  })
  it('cuenta unidades, no renglones', () => {
    expect(contarUnidades([r(45, 2), r(80, 3)])).toBe(5)
  })
  it('bolsa vacia da cero', () => {
    expect(calcularSubtotal([])).toBe(0)
    expect(contarUnidades([])).toBe(0)
  })
})

describe('envio', () => {
  it('retiro en tienda nunca cobra envio', () => {
    expect(calcularEnvio(100, 2, 'retiro', jinotepe).envio).toBe(0)
  })
  it('cobra el costo de la zona', () => {
    expect(calcularEnvio(300, 2, 'entrega', diriamba).envio).toBe(60)
  })
  it('no cobra envio con la bolsa vacia', () => {
    expect(calcularEnvio(0, 0, 'entrega', jinotepe).envio).toBe(0)
  })
  it('entrega sin zona elegida no cobra', () => {
    expect(calcularEnvio(300, 2, 'entrega', null).envio).toBe(0)
  })

  // La regla del prototipo: gratis en Jinotepe desde C$600.
  it('justo bajo el minimo si cobra', () => {
    const e = calcularEnvio(599, 1, 'entrega', jinotepe)
    expect(e.envio).toBe(40)
    expect(e.envioGratis).toBe(false)
  })
  it('exactamente en el minimo ya es gratis', () => {
    const e = calcularEnvio(600, 1, 'entrega', jinotepe)
    expect(e.envio).toBe(0)
    expect(e.envioGratis).toBe(true)
  })
  it('sobre el minimo es gratis', () => {
    expect(calcularEnvio(1200, 4, 'entrega', jinotepe).envioGratis).toBe(true)
  })
  it('una zona sin minimo nunca da envio gratis', () => {
    const e = calcularEnvio(5000, 20, 'entrega', diriamba)
    expect(e.envio).toBe(60)
    expect(e.envioGratis).toBe(false)
  })
})

describe('totales', () => {
  it('suma subtotal mas envio', () => {
    const t = calcularTotales([r(45, 2), r(80, 1)], 'entrega', diriamba)
    expect(t).toEqual({ unidades: 3, subtotal: 170, envio: 60, total: 230, envioGratis: false })
  })
  it('con envio gratis el total es el subtotal', () => {
    const t = calcularTotales([r(1100, 1)], 'entrega', jinotepe)
    expect(t.total).toBe(1100)
    expect(t.envioGratis).toBe(true)
  })
  it('bolsa vacia da todo en cero', () => {
    expect(calcularTotales([], 'entrega', jinotepe).total).toBe(0)
  })
})

describe('formato de moneda', () => {
  it('usa separador de miles', () => {
    expect(cordobas(1100)).toBe('C$1,100')
  })
  it('no muestra decimales', () => {
    expect(cordobas(45)).toBe('C$45')
  })
})

describe('cotizacion de paquetes', () => {
  const cumple = [
    { descripcion: 'Pastel de chocolate (20 personas)', por_persona: 0.05, precio: 1100 },
    { descripcion: 'Cupcakes (caja de 6)', por_persona: 0.1, precio: 270 },
    { descripcion: 'Frappe de cafe', por_persona: 0.1, precio: 90 },
  ]

  it('redondea hacia arriba cada renglon', () => {
    // 30 personas: 1.5 pasteles -> 2; 3 cajas; 3 frappes.
    const { lineas, total } = cotizarPaquete(cumple, 30)
    expect(lineas.map((l) => l.cantidad)).toEqual([2, 3, 3])
    expect(total).toBe(2 * 1100 + 3 * 270 + 3 * 90)
  })

  it('nunca baja de una unidad por renglon', () => {
    const { lineas } = cotizarPaquete(cumple, 10)
    expect(lineas.every((l) => l.cantidad >= 1)).toBe(true)
  })

  it('crece con el numero de personas', () => {
    expect(cotizarPaquete(cumple, 200).total).toBeGreaterThan(cotizarPaquete(cumple, 30).total)
  })
})
