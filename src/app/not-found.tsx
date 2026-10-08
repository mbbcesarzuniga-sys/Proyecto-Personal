import Link from 'next/link'

export default function NoEncontrado() {
  return (
    <main className="wrap">
      <section className="pila" style={{ paddingBlock: '18vh', maxWidth: 480 }}>
        <p className="eyebrow">404</p>
        <h2>Esta pagina no existe</h2>
        <p className="muted">
          Puede que el enlace este viejo o que el codigo de pedido tenga un error de tipeo.
        </p>
        <div className="ctas">
          <Link className="btn btn-pedir" href="/">
            Ir al inicio
          </Link>
          <Link className="btn btn-sec" href="/pedido">
            Buscar mi pedido
          </Link>
        </div>
      </section>
    </main>
  )
}
