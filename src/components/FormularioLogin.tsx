'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { clienteNavegador } from '@/lib/supabase/navegador'

export function FormularioLogin({ volver }: { volver: string }) {
  const router = useRouter()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    setEntrando(true)

    const { error: errLogin } = await clienteNavegador().auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    })

    if (errLogin) {
      // No distinguimos "correo no existe" de "clave incorrecta": decirlo
      // permitiria averiguar que cuentas existen.
      setError('Correo o contrasena incorrectos.')
      setEntrando(false)
      return
    }

    // Solo rutas internas: un 'volver' con URL externa seria un redirect abierto.
    const destino = volver.startsWith('/') && !volver.startsWith('//') ? volver : '/admin'
    router.push(destino)
    router.refresh()
  }

  return (
    <form className="tarjeta pila" onSubmit={entrar} noValidate>
      <div className="campo">
        <label htmlFor="correo">Correo</label>
        <input
          id="correo"
          type="email"
          autoComplete="username"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
      </div>
      <div className="campo">
        <label htmlFor="clave">Contrasena</label>
        <input
          id="clave"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          required
        />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-pedir" type="submit" disabled={entrando}>
        {entrando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
