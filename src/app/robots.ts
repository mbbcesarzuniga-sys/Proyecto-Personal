import type { MetadataRoute } from 'next'
import { esProduccion, publico } from '@/lib/entorno'

export default function robots(): MetadataRoute.Robots {
  // En preproduccion cerramos el sitio entero a los buscadores. Un sitio de
  // pruebas indexado le roba visitas al real y recibe pedidos que nadie va
  // a preparar.
  if (!esProduccion()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/entrar', '/carrito', '/pedido'] }],
    sitemap: `${publico.sitio()}/sitemap.xml`,
  }
}
