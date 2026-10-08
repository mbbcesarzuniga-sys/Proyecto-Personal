import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresca la sesion de Supabase en cada navegacion y cierra /admin a
 * quien no este autenticado.
 *
 * El middleware solo comprueba que haya sesion. Que la persona sea personal
 * de la panaderia lo verifica el layout de /admin contra la tabla perfiles,
 * y las politicas RLS lo exigen otra vez en la base. Tres capas, porque una
 * cookie robada no deberia alcanzar para ver los pedidos.
 */
export async function middleware(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => peticion.cookies.getAll(),
        setAll: (nuevas: { name: string; value: string; options: CookieOptions }[]) => {
          for (const { name, value } of nuevas) peticion.cookies.set(name, value)
          respuesta = NextResponse.next({ request: peticion })
          for (const { name, value, options } of nuevas) {
            respuesta.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ruta = peticion.nextUrl.pathname
  const esAdmin = ruta.startsWith('/admin')
  const esLogin = ruta === '/entrar'

  if (esAdmin && !user) {
    const destino = peticion.nextUrl.clone()
    destino.pathname = '/entrar'
    destino.searchParams.set('volver', ruta)
    return NextResponse.redirect(destino)
  }

  if (esLogin && user) {
    const destino = peticion.nextUrl.clone()
    destino.pathname = '/admin'
    destino.search = ''
    return NextResponse.redirect(destino)
  }

  return respuesta
}

export const config = {
  matcher: [
    // Todo menos archivos estaticos y las rutas de API publicas.
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
