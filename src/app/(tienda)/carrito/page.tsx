import type { Metadata } from 'next'
import { obtenerCatalogo } from '@/lib/catalogo'
import { FormularioCheckout } from '@/components/FormularioCheckout'

export const metadata: Metadata = {
  title: 'Tu pedido',
  robots: { index: false, follow: false },
}

export default async function PaginaCarrito() {
  const { zonas, horariosEntrega, transferencia } = await obtenerCatalogo()

  return (
    <main className="wrap">
      <section>
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Paso final</p>
            <h2>Cerremos tu pedido</h2>
          </div>
        </div>
      </section>
      <FormularioCheckout
        zonas={zonas}
        horarios={horariosEntrega}
        transferencia={transferencia}
      />
    </main>
  )
}
