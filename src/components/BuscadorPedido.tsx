'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { esCodigoValido } from '@/lib/codigo-pedido'

export function BuscadorPedido() {
  const router = useRouter()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)

  function buscar(evento: React.FormEvent) {
    evento.preventDefault()
    // Normalizamos lo que el cliente copia del chat: mayusculas y sin espacios.
    const limpio = codigo.trim().toUpperCase().replace(/\s+/g, '')
    if (!esCodigoValido(limpio)) {
      setError('Ese codigo no tiene la forma correcta. Revisalo en tu chat de WhatsApp.')
      return
    }
    setError(null)
    router.push(`/pedido/${limpio}`)
  }

  return (
    <form className="pila" onSubmit={buscar} noValidate>
      <div className="campo">
        <label htmlFor="codigo">Codigo del pedido</label>
        <input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="HC-260408-7F3A"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={!!error}
        />
        {error && <p className="mal">{error}</p>}
      </div>
      <button className="btn btn-pedir" type="submit" style={{ justifySelf: 'start' }}>
        Buscar mi pedido
      </button>
    </form>
  )
}
