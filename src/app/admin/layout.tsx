import Link from 'next/link'
import { exigirPersonal } from '@/lib/sesion'
import { CerrarSesion } from '@/components/CerrarSesion'

export const metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const personal = await exigirPersonal()

  return (
    <>
      <div className="admin-top">
        <strong>El Horno de Carazo · Panel</strong>
        <nav>
          <Link href="/admin">Resumen</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/productos">Productos</Link>
          <Link href="/">Ver la tienda</Link>
        </nav>
        <span className="fila-sb" style={{ gap: 10 }}>
          <span className="nota">{personal.nombre ?? personal.email}</span>
          <CerrarSesion />
        </span>
      </div>
      <main className="wrap" style={{ paddingBottom: 60 }}>
        {children}
      </main>
    </>
  )
}
