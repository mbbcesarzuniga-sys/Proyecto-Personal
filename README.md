# El Horno de Carazo

Sitio web y sistema de pedidos en linea para **El Horno de Carazo**, panaderia y reposteria
en Jinotepe, Carazo, Nicaragua.

No es una pagina de vitrina: el cliente arma su bolsa, elige entrega o retiro, paga como
quiera y recibe un codigo con el que sigue su pedido. La panaderia ve los pedidos entrar en
un panel y los mueve de "recibido" a "entregado" desde el telefono.

---

## Que hace

**Para el cliente**

- Catalogo por categorias (Panaderia, Reposteria, Tradicion de Carazo, Cafeteria).
- Bolsa de pedido que sobrevive al cierre del navegador.
- Entrega con costo por municipio, o retiro en tienda. Envio gratis en Jinotepe desde C$600.
- Checkout real: el pedido queda guardado en la base de datos, no solo en un mensaje.
- Codigo de seguimiento (`HC-260408-7F3A`) y pagina de avance del pedido.
- Pago en efectivo al recibir o por transferencia bancaria.
- Cotizador de encargos para eventos: tipo de evento, numero de invitados y fecha.
- Modo claro y oscuro automatico; pensado primero para telefono.

**Para la panaderia**

- Panel en `/admin` con los pedidos del dia, lo vendido y lo que esta en proceso.
- Avance del pedido con un boton, cancelacion y marcado de pago.
- Edicion de precios, que se vende y que esta "hoy en vitrina", sin tocar codigo.
- Bitacora automatica: cada cambio de estado queda registrado con quien lo hizo.

---

## Como esta armado

| Capa | Herramienta | Por que |
|---|---|---|
| Interfaz | Next.js 15 (App Router) + React 19 | Rutas, renderizado en servidor y cache en una sola pieza |
| Lenguaje | TypeScript en modo estricto | Los errores de datos salen al escribir, no en produccion |
| Estilos | CSS propio con variables | Es el diseno aprobado del prototipo, sin una capa extra que lo reinterprete |
| Base de datos | Supabase (PostgreSQL) | Postgres de verdad, con autenticacion y seguridad por fila incluidas |
| Validacion | Zod | Un solo esquema valida y tipa lo que entra |
| Pruebas | Vitest | Los calculos de dinero se prueban solos |

**Los montos son enteros en cordobas.** No usamos centavos porque el negocio no cobra
fracciones, y los enteros evitan los errores de redondeo de la coma flotante.

---

## Estructura del proyecto

```
el-horno-de-carazo/
├── README.md
├── package.json              Dependencias y comandos
├── next.config.ts            Cabeceras de seguridad
├── tsconfig.json             TypeScript estricto, alias @/*
├── vitest.config.ts
├── .eslintrc.json
├── .env.example              Plantilla de variables (copiar a .env.local)
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260101000000_esquema_inicial.sql   Tablas, tipos, triggers y RLS
│   │   └── 20260101000100_crear_pedido.sql      Guardado atomico del pedido
│   └── seed.sql              Catalogo inicial: 16 productos, 6 zonas, 4 paquetes
│
├── src/
│   ├── middleware.ts         Refresca la sesion y cierra /admin
│   │
│   ├── app/
│   │   ├── layout.tsx                Documento, SEO, tipografias
│   │   ├── globals.css               Hoja de estilos unica
│   │   ├── not-found.tsx / error.tsx
│   │   ├── robots.ts / sitemap.ts
│   │   │
│   │   ├── (tienda)/                 Grupo publico: comparte encabezado y barra de bolsa
│   │   │   ├── layout.tsx            Carga el catalogo una vez para todas las pantallas
│   │   │   ├── page.tsx              Inicio: vitrina, menu, temporadas, zonas
│   │   │   ├── carrito/page.tsx      Checkout
│   │   │   ├── encargos/page.tsx     Cotizador de eventos
│   │   │   └── pedido/
│   │   │       ├── page.tsx          Buscar un pedido por codigo
│   │   │       └── [codigo]/page.tsx Avance del pedido
│   │   │
│   │   ├── entrar/page.tsx           Login del personal (fuera de /admin a proposito)
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx            Exige ser personal autorizado
│   │   │   ├── acciones.ts           Server actions del panel
│   │   │   ├── page.tsx              Resumen del dia
│   │   │   ├── pedidos/page.tsx      Cola de pedidos
│   │   │   └── productos/page.tsx    Precios y disponibilidad
│   │   │
│   │   └── api/pedidos/
│   │       ├── route.ts              POST: crea el pedido
│   │       └── [codigo]/route.ts     GET: consulta por codigo
│   │
│   ├── components/           Interfaz (ProveedorCarrito, Catalogo, FormularioCheckout, …)
│   │
│   ├── lib/
│   │   ├── precios.ts        Subtotal, envio, total, cotizaciones. Funciones puras
│   │   ├── codigo-pedido.ts  Generador del codigo de seguimiento
│   │   ├── catalogo.ts       Lectura del catalogo, con respaldo si la base cae
│   │   ├── validacion.ts     Esquemas Zod
│   │   ├── whatsapp.ts       Armado del mensaje y del enlace wa.me
│   │   ├── ilustraciones.ts  Los SVG del catalogo, dibujados con codigo
│   │   ├── sesion.ts         exigirPersonal()
│   │   ├── entorno.ts        Variables de entorno con fallo temprano
│   │   ├── supabase/         Cliente publico, de sesion y de servicio
│   │   └── pagos/            Pasarelas detras de una interfaz comun
│   │
│   └── types/dominio.ts      Tipos del dominio, espejo del esquema SQL
│
└── tests/                    Pruebas de precios y codigos de pedido
```

### Tres decisiones que vale la pena conocer

**1. Los precios los pone la base, nunca el navegador.**
El checkout manda solo `producto_id` y `cantidad`. El servidor busca el precio en la base,
recalcula el total con las mismas funciones de `lib/precios.ts` y recien entonces guarda.
Si alguien edita el precio en su navegador, el pedido entra con el precio correcto.

**2. Los pedidos no son accesibles desde el navegador.**
Las politicas RLS de Postgres niegan a `anon` toda lectura y escritura sobre `pedidos`.
Crear un pedido y consultarlo por codigo pasan por rutas de servidor. El panel lee con la
sesion del personal, y la base vuelve a comprobar el permiso.

**3. El pago con tarjeta esta previsto, no inventado.**
En Nicaragua las pasarelas internacionales no se contratan directo; lo que se usa es el
modulo de comercio electronico de BAC, Banpro o Lafise. El sitio arranca con efectivo y
transferencia, que funcionan hoy, y la tarjeta queda detras de la interfaz `PasarelaPago`
(`lib/pagos/tipos.ts`): cuando el banco entregue credenciales se agrega un archivo y nada
mas cambia.

---

## Arrancarlo en tu maquina

Necesitas **Node 20.9 o mas** y una cuenta de Supabase (el plan gratuito alcanza).

```bash
git clone https://github.com/mbbcesarzuniga-sys/Proyecto-Personal.git
cd Proyecto-Personal
npm install
cp .env.example .env.local     # y rellena las llaves de Supabase
npm run dev                    # http://localhost:3000
```

### Preparar la base de datos

En el SQL Editor de tu proyecto de Supabase, corre en este orden:

1. `supabase/migrations/20260101000000_esquema_inicial.sql`
2. `supabase/migrations/20260101000100_crear_pedido.sql`
3. `supabase/seed.sql`

O con la CLI de Supabase: `npx supabase db push && npx supabase db reset`.

### Dar acceso al panel

El panel no se abre solo con tener cuenta: hay que estar en la tabla `perfiles`.

1. Supabase → Authentication → Users → **Add user** (correo y contrasena).
2. En el SQL Editor:

```sql
insert into perfiles (id, nombre, rol)
select id, 'Nombre de la persona', 'admin'
from auth.users where email = 'correo@ejemplo.com';
```

3. Entra en `/entrar`.

---

## Comandos

```bash
npm run dev         # desarrollo
npm run build       # build de produccion
npm start           # servir el build
npm test            # pruebas
npm run typecheck   # tipos
npm run lint        # estilo de codigo
npm run verify      # tipos + pruebas + build, todo junto
```

---

## Despliegue

Paso a paso en **[docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)**: Vercel, Netlify, Cloudflare y
un servidor propio con Docker, con lo que cuesta cada opcion, y como montar un sitio de
preproduccion para compartir.

### Produccion y preproduccion

El codigo sabe en que entorno corre (`src/lib/entorno.ts`). Vercel, Netlify y Cloudflare lo
marcan solos y solo la rama principal cuenta como produccion; en un servidor propio se pone
a mano con `SITIO_ENTORNO`. Fuera de produccion el sitio se cierra a los buscadores
(`robots.txt` con `Disallow: /` y `noindex` en cada pagina) y muestra una franja que avisa
que los pedidos no son reales.

---

## Antes de abrirlo al publico

- [ ] Numero real de WhatsApp en la tabla `configuracion` (clave `negocio`) y en `NEXT_PUBLIC_WHATSAPP`.
- [ ] Datos reales de la cuenta bancaria (clave `pagos`).
- [ ] Direccion y horario reales de la tienda.
- [ ] Revisar precios y costos de entrega con la dueña.
- [ ] Reemplazar las ilustraciones por fotos del producto.
- [ ] Crear la cuenta del personal en `perfiles`.
- [ ] Texto propio de la seccion "Nosotros".
