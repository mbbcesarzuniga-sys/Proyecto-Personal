import { entorno } from '@/lib/entorno'

/**
 * Franja visible en los despliegues de prueba. Sin esto, alguien a quien le
 * compartimos el enlace hace un pedido creyendo que es real.
 */
export function AvisoPreproduccion() {
  if (entorno() === 'produccion') return null

  return (
    <p
      className="aviso"
      style={{
        background: 'var(--gold)',
        color: '#2A1B17',
        fontWeight: 700,
        letterSpacing: '.02em',
      }}
    >
      Sitio de pruebas · Los pedidos que hagas aqui no se preparan ni se cobran
    </p>
  )
}
