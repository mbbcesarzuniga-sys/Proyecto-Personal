import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import './globals.css'

/**
 * Tipografias auto-hospedadas. Next las descarga en el build y las sirve
 * desde nuestro propio dominio: una peticion menos a Google, sin salto de
 * texto al cargar y sin depender de que fonts.googleapis.com responda.
 */
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--fuente-display',
  display: 'swap',
})

const cuerpo = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fuente-cuerpo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'El Horno de Carazo · Panaderia y reposteria en Jinotepe',
    template: '%s · El Horno de Carazo',
  },
  description:
    'Pan recien horneado, reposteria y tradicion de Carazo. Pedi en linea con entrega en Jinotepe, ' +
    'Diriamba, San Marcos, Dolores, Santa Teresa y La Paz, o retira en la tienda.',
  keywords: ['panaderia Jinotepe', 'reposteria Carazo', 'rosquillas Nicaragua', 'pasteles Jinotepe'],
  openGraph: {
    title: 'El Horno de Carazo',
    description: 'Pan recien horneado, reposteria y tradicion de Carazo. Pedi en linea.',
    locale: 'es_NI',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFAF6' },
    { media: '(prefers-color-scheme: dark)', color: '#17110F' },
  ],
}

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-NI" className={`${display.variable} ${cuerpo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
