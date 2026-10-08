'use client'
import { useState } from 'react'
import { Ilustracion } from './Ilustracion'
import { useCarrito } from './ProveedorCarrito'
import { cordobas } from '@/lib/precios'
import type { Categoria, Producto } from '@/types/dominio'

export function Catalogo({
  categorias,
  productos,
}: {
  categorias: Categoria[]
  productos: Producto[]
}) {
  const [catSel, setCatSel] = useState(categorias[0]?.id ?? '')
  const { cantidades, cambiar } = useCarrito()
  const visibles = productos.filter((p) => p.categoria_id === catSel && p.disponible)

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Categorias">
        {categorias.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === catSel}
            onClick={() => setCatSel(c.id)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <div className="grid">
        {visibles.map((p) => {
          const q = cantidades[p.id] ?? 0
          return (
            <article className="prod" key={p.id}>
              <Ilustracion clave={p.ilustracion} className="img" />
              <div className="cuerpo">
                {p.etiqueta && <span className="etq">{p.etiqueta}</span>}
                <h3>{p.nombre}</h3>
                <p className="muted" style={{ fontSize: '.9rem' }}>
                  {p.descripcion}
                </p>
                {p.anticipacion_horas > 0 && (
                  <p className="nota">Por encargo con {p.anticipacion_horas} h de anticipacion.</p>
                )}
                <div className="fila">
                  <span className="precio">
                    {cordobas(p.precio)} <small>{p.unidad}</small>
                  </span>
                  {q > 0 ? (
                    <span className="qty">
                      <button
                        type="button"
                        aria-label={`Quitar uno de ${p.nombre}`}
                        onClick={() => cambiar(p.id, -1)}
                      >
                        −
                      </button>
                      <output aria-label={`Cantidad de ${p.nombre}`}>{q}</output>
                      <button
                        type="button"
                        aria-label={`Agregar uno de ${p.nombre}`}
                        onClick={() => cambiar(p.id, 1)}
                      >
                        +
                      </button>
                    </span>
                  ) : (
                    <button className="add" type="button" onClick={() => cambiar(p.id, 1)}>
                      Agregar
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {visibles.length === 0 && (
        <p className="muted">Hoy no hay nada en esta categoria. Proba otra.</p>
      )}
    </>
  )
}
