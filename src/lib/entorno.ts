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

/** Privadas: solo servidor. Llamarlas desde el navegador debe fallar. */
export const servidor = {
  serviceRoleKey: () =>
    requerida('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  proveedorPago: () => (process.env.PAYMENT_PROVIDER ?? 'none') as 'none' | 'stripe',
}
