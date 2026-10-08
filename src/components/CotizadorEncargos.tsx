'use client'
import { useMemo, useState } from 'react'
import { cordobas, cotizarPaquete } from '@/lib/precios'
import { enlaceWhatsApp, mensajeEncargo } from '@/lib/whatsapp'
import type { PaqueteEvento } from '@/types/dominio'

/** Fecha minima: 48 h de anticipacion, como en el prototipo. */
function fechaMinima(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return d.toISOString().slice(0, 10)
}

export function CotizadorEncargos({
  paquetes,
  whatsapp,
}: {
  paquetes: PaqueteEvento[]
  whatsapp: string
}) {
  const minima = fechaMinima()
  const [paqueteId, setPaqueteId] = useState(paquetes[0]?.id ?? '')
  const [personas, setPersonas] = useState(30)
  const [fecha, setFecha] = useState(minima)
  const [copiado, setCopiado] = useState(false)

  const paquete = paquetes.find((p) => p.id === paqueteId) ?? paquetes[0]

  const cotizacion = useMemo(
    () => (paquete ? cotizarPaquete(paquete.renglones, personas) : { lineas: [], total: 0 }),
    [paquete, personas],
  )

  if (!paquete) {
    return <p className="muted">Todavia no hay paquetes configurados.</p>
  }

  const mensaje = mensajeEncargo(paquete.nombre, personas, fecha)
  const enlace = enlaceWhatsApp(whatsapp, mensaje)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="encargo">
      <div className="pasos">
        <div className="paso">
          <h3>
            <i>1</i> Que estas celebrando?
          </h3>
          <div className="chips">
            {paquetes.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={p.id === paqueteId}
                onClick={() => setPaqueteId(p.id)}
              >
                {p.nombre.replace(/^Paquete\s*/i, '')}
              </button>
            ))}
          </div>
        </div>

        <div className="paso">
          <h3>
            <i>2</i> Cuantas personas?
            <span className="muted tabular" style={{ marginLeft: 'auto' }}>
              {personas} personas
            </span>
          </h3>
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={personas}
            onChange={(e) => setPersonas(Number(e.target.value))}
            aria-label="Numero de personas"
          />
        </div>

        <div className="paso">
          <h3>
            <i>3</i> Para cuando?
          </h3>
          <input
            type="date"
            min={minima}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            aria-label="Fecha del evento"
          />
          <p className="nota">Los encargos se reciben con 48 horas de anticipacion.</p>
        </div>
      </div>

      <div className="tarjeta pila">
        <h3>
          {paquete.nombre} para {personas}
        </h3>
        <table className="zonas">
          <tbody>
            {cotizacion.lineas.map((l) => (
              <tr key={l.descripcion}>
                <td>
                  {l.cantidad} × {l.descripcion}
                </td>
                <td className="tabular">{cordobas(l.subtotal)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <b>Total estimado</b>
              </td>
              <td className="tabular">
                <b>{cordobas(cotizacion.total)}</b>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="nota">
          Es una estimacion: el precio final depende del diseno, los sabores y la decoracion.
          Lo cerramos por WhatsApp.
        </p>

        {enlace ? (
          <a className="btn btn-wa" href={enlace} target="_blank" rel="noopener">
            Pedir este encargo por WhatsApp
          </a>
        ) : (
          <>
            <button className="btn btn-sec" type="button" onClick={copiar}>
              {copiado ? 'Mensaje copiado' : 'Copiar el mensaje'}
            </button>
            <p className="nota">
              Falta configurar el numero de WhatsApp de la panaderia. Mientras tanto, copia el
              mensaje y envialo.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
