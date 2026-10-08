import type { MetadataRoute } from 'next'
import { publico } from '@/lib/entorno'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/entrar', '/carrito', '/pedido'] }],
    sitemap: `${publico.sitio()}/sitemap.xml`,
  }
}
