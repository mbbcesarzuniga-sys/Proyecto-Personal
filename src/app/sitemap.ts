import type { MetadataRoute } from 'next'
import { publico } from '@/lib/entorno'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publico.sitio()
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/encargos`, changeFrequency: 'weekly', priority: 0.8 },
  ]
}
