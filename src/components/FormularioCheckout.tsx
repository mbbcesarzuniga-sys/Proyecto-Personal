'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useCarrito } from './ProveedorCarrito'
import { cordobas } from '@/lib/precios'
import type { DatosTransferencia, MetodoPago, ZonaEntrega } from '@/types/dominio'

interface Props {
  zonas: ZonaEntrega[]
  horarios: string[]
  transferencia: DatosTransferencia
}

type Errores = Record<string, string>

export function FormularioCheckout({ zonas, horarios, transferencia }: Props) {
  const router = useRouter()
  const { renglones, totales, modo, ponerModo, zonaId, ponerZona, zona, cambiar, quitar, listo } =
    useCarrito()

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [cuando, setCuando] = useState(horarios[0] ?? '')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [referencia, setReferencia] = useState('')
  const [nota, setNota] = useState('')

  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!listo) {
    return <p className="muted">Cargando tu bolsa…</p>
  }

  if (renglones.length === 0) {
    return (
      <div className="tarjeta pila">
        <h2>Tu bolsa esta vacia</h2>
        <p className="muted">Agrega algo del menu y volve para cerrar el pedido.</p>
        <Link className="btn btn-pedir" href="/#menu" style={{ justifySelf: 'start' }}>
          Ver el menu
        </Link>
      </div>
    )
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setErrores({})
    setErrorGeneral(null)
    setEnviando(true)

    try {
      const respuesta = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo,
          zona_id: modo === 'entrega' ? zonaId : null,
          cliente_nombre: nombre,
          cliente_telefono: telefono,
          direccion: modo === 'entrega' ? direccion : undefined,
          cuando,
          nota: nota || undefined,
          metodo_pago: metodoPago,
          pago_referencia: metodoPago === 'transferencia' && referencia ? referencia : undefined,
          renglones: renglones.map((r) => ({
            producto_id: r.producto_id,
            cantidad: r.cantidad,
          })),
        }),
      })

      const datos = (await respuesta.json()) as {
        codigo?: string
        error?: string
        detalles?: { campo: string; mensaje: string }[]
      }

      if (!respuesta.ok) {
        if (datos.detalles) {
          const mapa: Errores = {}
          for (const d of datos.detalles) mapa[d.campo] = d.mensaje
          setErrores(mapa)
        }
        setErrorGeneral(datos.error ?? 'No pudimos enviar tu pedido.')
        return
      }

      // El pedido ya vive en la base. No vaciamos la bolsa aqui: la pantalla
      // de seguimiento lo hace al confirmar que el codigo existe, asi un
      // problema de red no deja al cliente sin bolsa y sin pedido.
      router.push(`/pedido/${datos.codigo}?nuevo=1`)
    } catch {
      setErrorGeneral(
        'Se cayo la conexion. Revisa tu internet y volve a intentar; tu bolsa no se perdio.',
      )
    } finally {
      setEnviando(false)
    }
  }

  const detalleEnvio =
    modo === 'retiro'
      ? 'Retiro en tienda'
      : totales.envioGratis
        ? 'Entrega gratis'
        : `Entrega ${cordobas(totales.envio)}`

  return (
    <form className="checkout" onSubmit={enviar} noValidate>
      <div className="pila">
        <section className="tarjeta pila">
          <h2 style={{ fontSize: '1.4rem' }}>Como lo recibis</h2>
          <div className="seg" role="group" aria-label="Modo de entrega">
            <button
              type="button"
              aria-pressed={modo === 'entrega'}
              onClick={() => ponerModo('entrega')}
            >
              Entrega
            </button>
            <button
              type="button"
              aria-pressed={modo === 'retiro'}
              onClick={() => ponerModo('retiro')}
            >
              Retiro en tienda
            </button>
          </div>

          {modo === 'entrega' && (
            <div className="campo">
              <label htmlFor="zona">Municipio</label>
              <select
                id="zona"
                value={zonaId ?? ''}
                onChange={(e) => ponerZona(e.target.value)}
                aria-invalid={!!errores['zona_id']}
              >
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre} · {cordobas(z.costo)}
                  </option>
                ))}
              </select>
              {zona?.envio_gratis_desde && (
                <p className="ayuda">
                  Envio gratis desde {cordobas(zona.envio_gratis_desde)} en {zona.nombre}.
                </p>
              )}
              {errores['zona_id'] && <p className="mal">{errores['zona_id']}</p>}
            </div>
          )}
        </section>

        <section className="tarjeta pila">
          <h2 style={{ fontSize: '1.4rem' }}>Tus datos</h2>
          <div className="cols-2">
            <div className="campo">
              <label htmlFor="nombre">Tu nombre</label>
              <input
                id="nombre"
                autoComplete="name"
                placeholder="Ej. Maria Lopez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                aria-invalid={!!errores['cliente_nombre']}
                required
              />
              {errores['cliente_nombre'] && <p className="mal">{errores['cliente_nombre']}</p>}
            </div>
            <div className="campo">
              <label htmlFor="telefono">WhatsApp</label>
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="8123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                aria-invalid={!!errores['cliente_telefono']}
                required
              />
              <p className="ayuda">Por aqui te confirmamos el pedido.</p>
              {errores['cliente_telefono'] && <p className="mal">{errores['cliente_telefono']}</p>}
            </div>
          </div>

          {modo === 'entrega' && (
            <div className="campo">
              <label htmlFor="direccion">Direccion de entrega</label>
              <textarea
                id="direccion"
                rows={2}
                placeholder="Ej. Residencial Los Robles, casa 14, porton verde"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                aria-invalid={!!errores['direccion']}
                required
              />
              {errores['direccion'] && <p className="mal">{errores['direccion']}</p>}
            </div>
          )}

          <div className="campo">
            <label htmlFor="cuando">Para cuando</label>
            <select id="cuando" value={cuando} onChange={(e) => setCuando(e.target.value)}>
              {horarios.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="nota">Alguna indicacion (opcional)</label>
            <textarea
              id="nota"
              rows={2}
              placeholder="Ej. sin azucar glas, tocar el timbre dos veces"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
        </section>

        <section className="tarjeta pila">
          <h2 style={{ fontSize: '1.4rem' }}>Como pagas</h2>
          <div className="radio-pago">
            <label>
              <input
                type="radio"
                name="pago"
                checked={metodoPago === 'efectivo'}
                onChange={() => setMetodoPago('efectivo')}
              />
              <span>
                <b>Efectivo al recibir</b>
                <small>Pagas cuando llega el pedido o al retirarlo. Llevamos cambio.</small>
              </span>
            </label>
            <label>
              <input
                type="radio"
                name="pago"
                checked={metodoPago === 'transferencia'}
                onChange={() => setMetodoPago('transferencia')}
              />
              <span>
                <b>Transferencia bancaria</b>
                <small>Transferis y nos mandas el comprobante por WhatsApp.</small>
              </span>
            </label>
          </div>

          {metodoPago === 'transferencia' && (
            <>
              <div className="banco">
                <span>
                  Banco: <b>{transferencia.banco || 'por confirmar'}</b>
                </span>
                <span>
                  Cuenta: <code>{transferencia.cuenta || 'por confirmar'}</code>
                </span>
                <span>
                  A nombre de: <b>{transferencia.titular || 'por confirmar'}</b>
                </span>
                {transferencia.instruccion && <span>{transferencia.instruccion}</span>}
              </div>
              <div className="campo">
                <label htmlFor="referencia">Numero de la transferencia (opcional)</label>
                <input
                  id="referencia"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej. 884512"
                />
                <p className="ayuda">
                  Si ya transferiste, ponelo aqui y lo verificamos mas rapido.
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      <aside className="tarjeta resumen-caja">
        <h2 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Tu pedido</h2>
        <ul>
          {renglones.map((r) => (
            <li key={r.producto_id}>
              <span>
                <span className="qty" style={{ marginRight: 8 }}>
                  <button
                    type="button"
                    aria-label={`Quitar uno de ${r.nombre}`}
                    onClick={() => cambiar(r.producto_id, -1)}
                  >
                    −
                  </button>
                  <output>{r.cantidad}</output>
                  <button
                    type="button"
                    aria-label={`Agregar uno de ${r.nombre}`}
                    onClick={() => cambiar(r.producto_id, 1)}
                  >
                    +
                  </button>
                </span>
                {r.nombre}
                <br />
                <button
                  type="button"
                  className="enlace"
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontSize: '.78rem' }}
                  onClick={() => quitar(r.producto_id)}
                >
                  Quitar
                </button>
              </span>
              <span className="tabular">{cordobas(r.precio_unitario * r.cantidad)}</span>
            </li>
          ))}
        </ul>

        <ul>
          <li>
            <span>Subtotal</span>
            <span className="tabular">{cordobas(totales.subtotal)}</span>
          </li>
          <li>
            <span>{detalleEnvio}</span>
            <span className="tabular">
              {modo === 'retiro' || totales.envio === 0 ? '—' : cordobas(totales.envio)}
            </span>
          </li>
          <li className="tot">
            <span>Total</span>
            <span className="tabular">{cordobas(totales.total)}</span>
          </li>
        </ul>

        {errorGeneral && (
          <p className="error" role="alert" style={{ marginBottom: 12 }}>
            {errorGeneral}
          </p>
        )}

        <button className="btn btn-wa" type="submit" disabled={enviando} style={{ width: '100%' }}>
          {enviando ? 'Enviando…' : `Confirmar pedido · ${cordobas(totales.total)}`}
        </button>
        <p className="nota" style={{ marginTop: 10 }}>
          Al confirmar te damos un codigo de seguimiento y la panaderia recibe el pedido.
        </p>
      </aside>
    </form>
  )
}
