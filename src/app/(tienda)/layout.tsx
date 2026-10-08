import { obtenerCatalogo } from '@/lib/catalogo'
import { ProveedorCarrito } from '@/components/ProveedorCarrito'
import { Encabezado } from '@/components/Encabezado'
import { BarraPedido } from '@/components/BarraPedido'
import { AvisoPreproduccion } from '@/components/AvisoPreproduccion'

/**
 * Trae el catalogo una sola vez para todas las pantallas de la tienda, asi
 * la bolsa puede resolver nombres y precios en cualquier pagina.
 */
export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const catalogo = await obtenerCatalogo()

  return (
    <ProveedorCarrito productos={catalogo.productos} zonas={catalogo.zonas}>
      <AvisoPreproduccion />
      <p className="aviso">
        {catalogo.negocio.horario} · {catalogo.negocio.direccion}
      </p>
      <Encabezado nombre={catalogo.negocio.nombre} ciudad={catalogo.negocio.ciudad} />
      {children}
      <BarraPedido />
    </ProveedorCarrito>
  )
}
