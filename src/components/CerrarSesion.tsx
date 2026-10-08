'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { clienteNavegador } from '@/lib/supabase/navegador'

export function CerrarSesion() {
  const router = useRouter()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await clienteNavegador().auth.signOut()
    router.push('/entrar')
    router.refresh()
  }

  return (
    <button className="btn btn-sec" type="button" onClick={salir} disabled={saliendo}>
      {saliendo ? 'Saliendo…' : 'Salir'}
    </button>
  )
}
