import { clienteServidor } from '@/lib/supabase/servidor'
import { FilaProductoAdmin } from '@/components/FilaProductoAdmin'
import type { Categoria, Producto } from '@/types/dominio'

export const dynamic = 'force-dynamic'

export default async function ProductosAdmin() {
  const sb = await clienteServidor()

  const [{ data: categorias }, { data: productos }] = await Promise.all([
    sb.from('categorias').select('id,nombre,orden').order('orden'),
    sb
      .from('productos')
      .select(
        'id,categoria_id,nombre,descripcion,precio,unidad,etiqueta,ilustracion,disponible,en_vitrina_hoy,anticipacion_horas',
      )
      .order('categoria_id')
      .order('orden'),
  ])

  const nombreCategoria = new Map(((categorias ?? []) as Categoria[]).map((c) => [c.id, c.nombre]))

  return (
    <>
      <section style={{ paddingBlock: 24 }}>
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Catalogo</p>
            <h2>Productos y precios</h2>
          </div>
          <p className="nota">
            Los cambios se ven en la tienda de inmediato. Lo que apagues deja de poder pedirse.
          </p>
        </div>
      </section>

      <div className="envoltorio-tabla">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoria</th>
              <th>Precio (C$)</th>
              <th>Se vende</th>
              <th>Hoy en vitrina</th>
            </tr>
          </thead>
          <tbody>
            {((productos ?? []) as Producto[]).map((p) => (
              <FilaProductoAdmin
                key={p.id}
                producto={p}
                categoria={nombreCategoria.get(p.categoria_id) ?? p.categoria_id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
