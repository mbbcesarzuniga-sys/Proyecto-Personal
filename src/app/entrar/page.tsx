import type { Metadata } from 'next'
import { FormularioLogin } from '@/components/FormularioLogin'

export const metadata: Metadata = {
  title: 'Entrar al panel',
  robots: { index: false, follow: false },
}

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string; error?: string }>
}) {
  const { volver, error } = await searchParams

  return (
    <main className="wrap">
      <div className="login">
        <div>
          <p className="eyebrow">El Horno de Carazo</p>
          <h2>Panel de la panaderia</h2>
        </div>
        {error === 'sin-permiso' && (
          <p className="error">
            Tu cuenta existe pero nadie la autorizo al panel. Pedile a la administracion que te
            agregue.
          </p>
        )}
        <FormularioLogin volver={volver ?? '/admin'} />
      </div>
    </main>
  )
}
