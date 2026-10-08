'use client'
import { useState, useTransition } from 'react'
import { alternarDisponible, alternarVitrina, cambiarPrecio } from '@/app/admin/acciones'
import type { Producto } from '@/types/dominio'

export function FilaProductoAdmin({
  producto,
  categoria,
}: {
  producto: Producto
  categoria: string
}) {
  const [pendiente, iniciar] = useTransition()
  const [precio, setPrecio] = useState(String(producto.precio))
  const [error, setError] = useState<string | null>(null)

  function guardarPrecio() {
    const n = Number(precio)
    // Si no cambio nada, no molestamos a la base.
    if (n === producto.precio) return
    if (!Number.isInteger(n) || n < 0) {
      setError('Escribi un entero.')
      setPrecio(String(producto.precio))
      return
    }
    setError(null)
    iniciar(async () => {
      const r = await cambiarPrecio(producto.id, n)
      if (!r.ok) {
        setError(r.error ?? 'No se guardo.')
        setPrecio(String(producto.precio))
      }
    })
  }

  return (
    <tr>
      <td>
        <b>{producto.nombre}</b>
        <br />
        <span className="nota">{producto.descripcion}</span>
        {error && <p className="mal">{error}</p>}
      </td>
      <td className="nota">{categoria}</td>
      <td>
        <input
          className="tabular"
          style={{ width: 90, padding: '6px 8px' }}
          inputMode="numeric"
          value={precio}
          disabled={pendiente}
          onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ''))}
          onBlur={guardarPrecio}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          aria-label={`Precio de ${producto.nombre}`}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={producto.disponible}
          disabled={pendiente}
          onChange={(e) =>
            iniciar(async () => {
              await alternarDisponible(producto.id, e.target.checked)
            })
          }
          aria-label={`${producto.nombre} se vende`}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={producto.en_vitrina_hoy}
          disabled={pendiente}
          onChange={(e) =>
            iniciar(async () => {
              await alternarVitrina(producto.id, e.target.checked)
            })
          }
          aria-label={`${producto.nombre} hoy en vitrina`}
        />
      </td>
    </tr>
  )
}
