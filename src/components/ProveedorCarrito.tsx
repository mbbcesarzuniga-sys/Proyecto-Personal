'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { calcularTotales, type Totales } from '@/lib/precios'
import type { ModoEntrega, Producto, RenglonCarrito, ZonaEntrega } from '@/types/dominio'

const LLAVE = 'horno-carazo-bolsa-v1'

interface Guardado {
  cantidades: Record<string, number>
  modo: ModoEntrega
  zonaId: string | null
}

interface Contexto {
  cantidades: Record<string, number>
  renglones: RenglonCarrito[]
  totales: Totales
  modo: ModoEntrega
  zonaId: string | null
  zona: ZonaEntrega | null
  listo: boolean
  cambiar: (productoId: string, delta: number) => void
  quitar: (productoId: string) => void
  vaciar: () => void
  ponerModo: (modo: ModoEntrega) => void
  ponerZona: (zonaId: string) => void
}

const Ctx = createContext<Contexto | null>(null)

export function ProveedorCarrito({
  productos,
  zonas,
  children,
}: {
  productos: Producto[]
  zonas: ZonaEntrega[]
  children: ReactNode
}) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [modo, setModo] = useState<ModoEntrega>('entrega')
  const [zonaId, setZonaId] = useState<string | null>(zonas[0]?.id ?? null)
  // 'listo' evita el parpadeo entre el render del servidor (bolsa vacia) y
  // la bolsa real que vive en localStorage.
  const [listo, setListo] = useState(false)

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(LLAVE)
      if (crudo) {
        const g = JSON.parse(crudo) as Partial<Guardado>
        if (g.cantidades && typeof g.cantidades === 'object') setCantidades(g.cantidades)
        if (g.modo === 'entrega' || g.modo === 'retiro') setModo(g.modo)
        // Solo aceptamos una zona que siga existiendo y activa.
        if (g.zonaId && zonas.some((z) => z.id === g.zonaId)) setZonaId(g.zonaId)
      }
    } catch {
      // localStorage puede estar bloqueado (modo privado). La bolsa igual
      // funciona en memoria durante la visita.
    }
    setListo(true)
  }, [zonas])

  useEffect(() => {
    if (!listo) return
    try {
      localStorage.setItem(LLAVE, JSON.stringify({ cantidades, modo, zonaId } satisfies Guardado))
    } catch {
      /* sin persistencia, seguimos */
    }
  }, [cantidades, modo, zonaId, listo])

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos])

  // Resolvemos la bolsa contra el catalogo actual: si un producto se
  // descontinuo o se agoto, desaparece del total en lugar de romper el pedido.
  const renglones = useMemo<RenglonCarrito[]>(() => {
    const salida: RenglonCarrito[] = []
    for (const [id, cantidad] of Object.entries(cantidades)) {
      const p = porId.get(id)
      if (!p || !p.disponible || cantidad <= 0) continue
      salida.push({
        producto_id: p.id,
        nombre: p.nombre,
        precio_unitario: p.precio,
        cantidad,
      })
    }
    return salida
  }, [cantidades, porId])

  const zona = useMemo(() => zonas.find((z) => z.id === zonaId) ?? null, [zonas, zonaId])
  const totales = useMemo(() => calcularTotales(renglones, modo, zona), [renglones, modo, zona])

  const cambiar = useCallback((productoId: string, delta: number) => {
    setCantidades((previo) => {
      const siguiente = { ...previo }
      const nueva = (siguiente[productoId] ?? 0) + delta
      if (nueva <= 0) delete siguiente[productoId]
      else siguiente[productoId] = Math.min(nueva, 99)
      return siguiente
    })
  }, [])

  const quitar = useCallback((productoId: string) => {
    setCantidades((previo) => {
      const siguiente = { ...previo }
      delete siguiente[productoId]
      return siguiente
    })
  }, [])

  const vaciar = useCallback(() => setCantidades({}), [])

  const valor: Contexto = {
    cantidades,
    renglones,
    totales,
    modo,
    zonaId,
    zona,
    listo,
    cambiar,
    quitar,
    vaciar,
    ponerModo: setModo,
    ponerZona: setZonaId,
  }

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useCarrito(): Contexto {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de <ProveedorCarrito>')
  return ctx
}
