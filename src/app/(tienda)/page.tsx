import Link from 'next/link'
import { obtenerCatalogo, vitrinaDeHoy } from '@/lib/catalogo'
import { Catalogo } from '@/components/Catalogo'
import { SelectorEntrega } from '@/components/SelectorEntrega'
import { Ilustracion } from '@/components/Ilustracion'
import { cordobas } from '@/lib/precios'

/** Revalidamos cada 5 min: el catalogo cambia poco y asi el sitio vuela. */
export const revalidate = 300

const TEMPORADAS = [
  { mes: 'Enero', titulo: 'San Sebastian', texto: 'Rosquillas y cafe para ir a ver el Gueguense en Diriamba.' },
  { mes: 'Febrero', titulo: 'San Valentin', texto: 'Cupcakes y cajas de regalo para dos.' },
  { mes: 'Marzo · abril', titulo: 'Semana Santa', texto: 'Pan y antojos para la playa en La Boquita y Casares.' },
  { mes: 'Mayo', titulo: 'Dia de las Madres', texto: 'Pasteles por encargo para el 30 de mayo.' },
  { mes: 'Julio', titulo: 'Santiago, Jinotepe', texto: 'Bocadillos y pan para las reuniones familiares.' },
  { mes: 'Diciembre', titulo: 'Purisima y Navidad', texto: 'Pasteles navidenos y cajas para regalar.' },
]

export default async function Inicio() {
  const { categorias, productos, zonas, negocio } = await obtenerCatalogo()
  const vitrina = vitrinaDeHoy(productos)
  const hoy = new Date().toLocaleDateString('es-NI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <main className="wrap" id="inicio">
      <div className="hero">
        <div>
          <p className="eyebrow">Panaderia y reposteria · {negocio.ciudad}</p>
          <h1>
            Pan fresco y pasteles para <em>cada dia</em> y cada celebracion.
          </h1>
          <p className="lead">
            Croissants, pan de molde, tres leches, cupcakes y cafe. Pedi en linea y te lo
            llevamos, o pasalo a traer.
          </p>
          <div className="ctas">
            <Link className="btn btn-pedir" href="#menu">
              Ver el menu
            </Link>
            <Link className="btn btn-sec" href="/encargos">
              Encargar un pastel
            </Link>
          </div>
          <div className="sellos" aria-label="Lo que ofrecemos">
            <span>Horneado todos los dias</span>
            <span>Entrega en Carazo</span>
            <span>Pago en efectivo o transferencia</span>
          </div>
        </div>
        <Ilustracion
          clave="hero"
          className="vitrina"
        />
      </div>

      <div className="hoy">
        <div>
          <p className="eyebrow">Hoy en vitrina</p>
          <h2>Recien horneado</h2>
          <p className="nota">{hoy}</p>
        </div>
        <ul>
          {vitrina.map((p) => (
            <li key={p.id}>
              <b>{cordobas(p.precio)}</b> {p.nombre}
            </li>
          ))}
          {vitrina.length === 0 && <li>Consultanos que salio hoy del horno.</li>}
          <li>Pedidos para hoy hasta la 1:00 p.m.</li>
        </ul>
      </div>

      <section id="pedir">
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Paso 1</p>
            <h2>Te lo llevamos o pasas a traerlo?</h2>
          </div>
        </div>
        <SelectorEntrega zonas={zonas} />
      </section>

      <section id="menu">
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Paso 2</p>
            <h2>El menu de hoy</h2>
          </div>
          <p className="nota">Precios en cordobas. Los pasteles enteros van por encargo.</p>
        </div>
        <Catalogo categorias={categorias} productos={productos} />
      </section>

      <section id="encargos-promo">
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Pasteles y eventos</p>
            <h2>Tu pastel, confirmado y a tiempo</h2>
          </div>
        </div>
        <div className="tarjeta fila-sb">
          <p className="muted" style={{ maxWidth: '46ch' }}>
            Decinos el tipo de evento y cuanta gente llega: te armamos el paquete con el total
            estimado y lo cerramos por WhatsApp.
          </p>
          <Link className="btn btn-pedir" href="/encargos">
            Cotizar un encargo
          </Link>
        </div>
      </section>

      <section aria-labelledby="temp-t">
        <div className="seccion-head">
          <div>
            <p className="eyebrow">Temporadas</p>
            <h2 id="temp-t">Cada fecha tiene su vitrina</h2>
          </div>
        </div>
        <div className="temporadas">
          {TEMPORADAS.map((t) => (
            <div className="temp" key={t.titulo}>
              <b>{t.mes}</b>
              <h3>{t.titulo}</h3>
              <p>{t.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dos">
        <div className="historia" id="historia">
          <p className="eyebrow">Nosotros</p>
          <h2>Una panaderia de Carazo, con vitrina de ciudad</h2>
          <p style={{ marginTop: 14 }}>
            El sabor de siempre de Carazo, con la presentacion, el servicio y la comodidad de una
            pasteleria moderna. Horneamos todos los dias y entregamos en los seis municipios de
            la meseta.
          </p>
          <Ilustracion clave="historia" className="ilu" />
        </div>

        <div id="visitanos">
          <p className="eyebrow">Visitanos</p>
          <h2>{negocio.ciudad}</h2>
          <p className="muted" style={{ marginTop: 10 }}>
            {negocio.direccion}
          </p>
          <div className="horario">
            <span>Horario</span>
            <span>{negocio.horario}</span>
          </div>

          <h3
            style={{ marginTop: 20, fontFamily: 'var(--body)', fontWeight: 700, letterSpacing: 0 }}
          >
            Costo de entrega
          </h3>
          <table className="zonas">
            <thead>
              <tr>
                <th>Municipio</th>
                <th>Entrega</th>
              </tr>
            </thead>
            <tbody>
              {zonas.map((z) => (
                <tr key={z.id}>
                  <td>{z.nombre}</td>
                  <td>
                    {cordobas(z.costo)}
                    {z.envio_gratis_desde
                      ? `, gratis desde ${cordobas(z.envio_gratis_desde)}`
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="wrap">
        <p>
          {negocio.nombre} · {negocio.direccion} ·{' '}
          <Link className="enlace" href="/pedido">
            Seguir un pedido
          </Link>
        </p>
        <p className="nota">
          Las imagenes del catalogo son ilustraciones propias, a reemplazar por fotos del producto.
        </p>
      </footer>
    </main>
  )
}
