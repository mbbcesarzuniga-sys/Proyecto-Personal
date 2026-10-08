import type { Metadata } from 'next'
import { obtenerCatalogo } from '@/lib/catalogo'
import { CotizadorEncargos } from '@/components/CotizadorEncargos'

export const metadata: Metadata = {
  title: 'Encargos para eventos',
  description:
    'Pasteles y paquetes para cumpleanos, baby shower, bautizos, oficina y fiestas familiares ' +
    'en Jinotepe y Carazo. Cotiza en linea con 48 horas de anticipacion.',
}

export const revalidate = 300

export default async function PaginaEncargos() {
  const { paquetes, negocio } = await obtenerCatalogo()

  return (
    <main className="wrap">
      <section>
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Pasteles y eventos</p>
            <h2>Tu pastel, confirmado y a tiempo</h2>
          </div>
          <p className="nota">Armamos el paquete y te damos el total estimado al instante.</p>
        </div>
        <CotizadorEncargos paquetes={paquetes} whatsapp={negocio.whatsapp} />
      </section>
    </main>
  )
}
