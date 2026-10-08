import { ilustracion } from '@/lib/ilustraciones'

/**
 * Pinta el SVG del producto. El marcado sale de nuestro propio modulo
 * (no de la base ni del usuario), por eso es seguro inyectarlo.
 */
export function Ilustracion({
  clave,
  className,
}: {
  clave: string | null | undefined
  className?: string
}) {
  const svg = ilustracion(clave)
  if (!svg) return <div className={className} aria-hidden="true" />
  return (
    <div className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
  )
}
