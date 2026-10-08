/**
 * Lectura de variables de entorno con fallo temprano y claro.
 * Si falta una variable preferimos reventar al arrancar antes que servir
 * paginas a medias.
 */
function requerida(nombre: string, valor: string | undefined): string {
  if (!valor || valor.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env.local y rellenala.`,
    )
  }
  return valor
}

/** Publicas: se incrustan en el bundle del navegador. */
export const publico = {
  supabaseUrl: () => requerida('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    requerida('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  whatsapp: () => process.env.NEXT_PUBLIC_WHATSAPP ?? '',
  sitio: () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
}

export type Entorno = 'produccion' | 'preproduccion'

/**
 * En que entorno corre este despliegue.
 *
 * Importa para dos cosas concretas: un sitio de pruebas no debe salir en
 * Google (si no, un cliente encuentra el de pruebas y pide algo que nadie
 * va a hornear), y quien entra a probar tiene que saber que no es el sitio
 * real.
 *
 * Vercel, Netlify y Cloudflare ponen VERCEL_ENV / CONTEXT en cada
 * despliegue; solo la rama principal es 'production'. SITIO_ENTORNO existe
 * para forzarlo a mano en cualquier otro hosting.
 */
export function entorno(): Entorno {
  const forzado = process.env.SITIO_ENTORNO
  if (forzado === 'produccion' || forzado === 'preproduccion') return forzado

  const vercel = process.env.VERCEL_ENV
  if (vercel) return vercel === 'production' ? 'produccion' : 'preproduccion'

  const netlify = process.env.CONTEXT
  if (netlify) return netlify === 'production' ? 'produccion' : 'preproduccion'

  // Sin ninguna senal asumimos preproduccion: equivocarse hacia el lado
  // seguro es dejar un sitio fuera de Google, no publicar uno de pruebas.
  return 'preproduccion'
}

export function esProduccion(): boolean {
  return entorno() === 'produccion'
}

/** Privadas: solo servidor. Llamarlas desde el navegador debe fallar. */
export const servidor = {
  serviceRoleKey: () =>
    requerida('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  proveedorPago: () => (process.env.PAYMENT_PROVIDER ?? 'none') as 'none' | 'stripe',
}
