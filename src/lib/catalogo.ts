import type {
  Categoria,
  DatosNegocio,
  DatosTransferencia,
  PaqueteEvento,
  Producto,
  ZonaEntrega,
} from '@/types/dominio'
import { clientePublico } from '@/lib/supabase/publico'

/**
 * Lecturas del catalogo. Corren en el servidor con la anon key, asi que
 * las politicas RLS ya filtran lo no disponible.
 */

export interface Catalogo {
  categorias: Categoria[]
  productos: Producto[]
  zonas: ZonaEntrega[]
  paquetes: PaqueteEvento[]
  negocio: DatosNegocio
  transferencia: DatosTransferencia
  horariosEntrega: string[]
}

/** Valores de respaldo: si la base no responde, el sitio sigue mostrando algo. */
const NEGOCIO_POR_DEFECTO: DatosNegocio = {
  nombre: 'El Horno de Carazo',
  ciudad: 'Jinotepe, Carazo',
  whatsapp: '',
  horario: 'Lunes a sabado 6:00 a.m. - 7:00 p.m.',
  direccion: 'Jinotepe, Carazo',
}

const TRANSFERENCIA_POR_DEFECTO: DatosTransferencia = {
  banco: '', cuenta: '', titular: '', instruccion: '',
}

const CATALOGO_VACIO: Catalogo = {
  categorias: [],
  productos: [],
  zonas: [],
  paquetes: [],
  negocio: NEGOCIO_POR_DEFECTO,
  transferencia: TRANSFERENCIA_POR_DEFECTO,
  horariosEntrega: ['Hoy en la tarde', 'Manana en la manana', 'Manana en la tarde'],
}

/**
 * Si la base no responde (red caida, proyecto pausado, llaves mal puestas)
 * devolvemos un catalogo vacio en lugar de reventar: el visitante igual ve
 * el sitio, el horario y como contactarnos, en vez de una pantalla de error.
 */
export async function obtenerCatalogo(): Promise<Catalogo> {
  try {
    return await leerCatalogo()
  } catch (fallo) {
    console.error('No se pudo leer el catalogo', fallo)
    return CATALOGO_VACIO
  }
}

async function leerCatalogo(): Promise<Catalogo> {
  const sb = clientePublico()

  const [categorias, productos, zonas, paquetes, config] = await Promise.all([
    sb.from('categorias').select('id,nombre,orden').order('orden'),
    sb
      .from('productos')
      .select(
        'id,categoria_id,nombre,descripcion,precio,unidad,etiqueta,ilustracion,disponible,en_vitrina_hoy,anticipacion_horas',
      )
      .order('orden'),
    sb.from('zonas_entrega').select('id,nombre,costo,envio_gratis_desde').order('orden'),
    sb.from('paquetes_evento').select('id,nombre,renglones').order('orden'),
    sb.from('configuracion').select('clave,valor'),
  ])

  const porClave = new Map((config.data ?? []).map((f) => [f.clave, f.valor]))

  return {
    categorias: (categorias.data ?? []) as Categoria[],
    productos: (productos.data ?? []) as Producto[],
    zonas: (zonas.data ?? []) as ZonaEntrega[],
    paquetes: (paquetes.data ?? []) as PaqueteEvento[],
    negocio: { ...NEGOCIO_POR_DEFECTO, ...((porClave.get('negocio') as DatosNegocio) ?? {}) },
    transferencia: {
      ...TRANSFERENCIA_POR_DEFECTO,
      ...(((porClave.get('pagos') as { transferencia?: DatosTransferencia })?.transferencia) ?? {}),
    },
    horariosEntrega:
      (porClave.get('horarios_entrega') as string[]) ?? [
        'Hoy en la tarde',
        'Manana en la manana',
        'Manana en la tarde',
      ],
  }
}

/** Lo que esta hoy en la vitrina, para la franja de arriba. */
export function vitrinaDeHoy(productos: readonly Producto[]): Producto[] {
  return productos.filter((p) => p.en_vitrina_hoy && p.disponible)
}
