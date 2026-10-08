import Link from 'next/link'
import { BotonBolsa } from './BotonBolsa'

export function Encabezado({ nombre, ciudad }: { nombre: string; ciudad: string }) {
  return (
    <header className="top">
      <div className="wrap">
        <Link className="logo" href="/">
          <span className="marca" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v3H4v-3Z"
                fill="#fff"
                fillOpacity=".92"
              />
              <path d="M8 17v-3M12 17v-4M16 17v-3" stroke="#C2314F" strokeWidth="1.6" />
            </svg>
          </span>
          <span>
            <b>{nombre}</b>
            <small>{ciudad}</small>
          </span>
        </Link>
        <nav className="menu">
          <Link href="/#menu">Menu</Link>
          <Link href="/encargos">Encargos</Link>
          <Link href="/#visitanos">Visitanos</Link>
          <Link href="/pedido">Mi pedido</Link>
        </nav>
        <BotonBolsa />
      </div>
    </header>
  )
}
