import type { Metadata } from 'next'
import { BuscadorPedido } from '@/components/BuscadorPedido'

export const metadata: Metadata = {
  title: 'Seguir un pedido',
  robots: { index: false, follow: false },
}

export default function PaginaBuscarPedido() {
  return (
    <main className="wrap">
      <section className="pila" style={{ paddingBlock: 28, maxWidth: 480 }}>
        <div>
          <p className="eyebrow">Seguimiento</p>
          <h2>Donde va mi pedido?</h2>
        </div>
        <p className="muted">
          Escribi el codigo que te dimos al confirmar. Tiene la forma HC-260408-7F3A.
        </p>
        <BuscadorPedido />
      </section>
    </main>
  )
}
