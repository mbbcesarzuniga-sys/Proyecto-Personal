'use client'

export default function ErrorGlobal({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="wrap">
      <section className="pila" style={{ paddingBlock: '18vh', maxWidth: 480 }}>
        <p className="eyebrow">Ups</p>
        <h2>Algo se rompio de nuestro lado</h2>
        <p className="muted">
          Tu bolsa no se perdio. Proba de nuevo; si sigue igual, escribinos por WhatsApp y
          tomamos el pedido a mano.
        </p>
        <button className="btn btn-pedir" type="button" onClick={reset} style={{ justifySelf: 'start' }}>
          Intentar de nuevo
        </button>
      </section>
    </main>
  )
}
