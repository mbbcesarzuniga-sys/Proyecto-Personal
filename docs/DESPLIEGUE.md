# Como desplegar El Horno de Carazo en la nube

El sitio tiene dos piezas, y se despliegan por separado:

1. **La base de datos** → Supabase (PostgreSQL gestionado).
2. **La aplicacion web** → Vercel, Netlify, Cloudflare o un servidor propio.

Hace falta hacer la base primero, porque la aplicacion necesita sus llaves.

---

## Parte 1 · La base de datos en Supabase

Esta parte es igual sea cual sea el hosting que elijas despues.

### 1.1 Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta.
2. **New project**.
   - **Name**: `el-horno-de-carazo`
   - **Database password**: generala y guardala en un gestor de contrasenas. No se vuelve a mostrar.
   - **Region**: `East US (North Virginia)` — es la mas cercana a Nicaragua de las disponibles.
3. Esperas unos 2 minutos a que termine de levantarse.

### 1.2 Crear las tablas

En el menu lateral: **SQL Editor** → **New query**. Pega y corre cada archivo **en este orden**,
uno por uno (boton *Run*):

| Orden | Archivo del repositorio |
|---|---|
| 1 | `supabase/migrations/20260101000000_esquema_inicial.sql` |
| 2 | `supabase/migrations/20260101000100_crear_pedido.sql` |
| 3 | `supabase/seed.sql` |

Para comprobar que quedo: **Table Editor** debe mostrar `productos` con 16 filas y
`zonas_entrega` con 6.

### 1.3 Copiar las llaves

**Project Settings** → **API**. Vas a necesitar tres valores:

| En Supabase | Variable del proyecto | Es secreta? |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | No |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` | **Si** |

> **La `service_role` salta todas las reglas de seguridad de la base.** Va solo en las
> variables de entorno del servidor. Nunca en el codigo, nunca en un repositorio, nunca en
> una variable que empiece con `NEXT_PUBLIC_`.

### 1.4 Crear la cuenta del personal

1. **Authentication** → **Users** → **Add user** → *Create new user*. Pone el correo y una
   contrasena, y marca el correo como confirmado.
2. **SQL Editor**, y corre esto cambiando el correo y el nombre:

```sql
insert into perfiles (id, nombre, rol)
select id, 'Nombre de la persona', 'admin'
from auth.users
where email = 'correo@ejemplo.com';
```

Tener cuenta no alcanza: si no esta en `perfiles`, el panel la rechaza.

### 1.5 Poner los datos reales del negocio

```sql
update configuracion
set valor = '{
  "nombre": "El Horno de Carazo",
  "ciudad": "Jinotepe, Carazo",
  "whatsapp": "505XXXXXXXX",
  "horario": "Lunes a sabado 6:00 a.m. - 7:00 p.m.",
  "direccion": "Costado norte del parque central, Jinotepe"
}'::jsonb
where clave = 'negocio';

update configuracion
set valor = '{
  "transferencia": {
    "banco": "BAC Nicaragua",
    "cuenta": "NUMERO REAL DE CUENTA",
    "titular": "TITULAR REAL",
    "instruccion": "Envia el comprobante por WhatsApp para confirmar tu pedido."
  },
  "tarjeta_activa": false
}'::jsonb
where clave = 'pagos';
```

**Costo:** el plan gratuito de Supabase da 500 MB de base y 50.000 usuarios activos al mes.
Para una panaderia sobra con holgura. Lo unico a tener en cuenta: en el plan gratuito el
proyecto se **pausa tras 7 dias sin actividad**. Con el sitio en linea recibiendo visitas no
pasa, pero si vas a tardar en publicarlo, entra de vez en cuando. El plan Pro son **US$25 al
mes** y quita la pausa.

---

## Parte 2 · La aplicacion web

### Opcion A · Vercel (la recomendada)

Vercel es de los creadores de Next.js. Es la ruta con menos cosas que configurar y que menos
se rompe: todo lo que usa este proyecto (server actions, middleware, revalidacion de cache)
funciona sin ajustes.

1. Entra a [vercel.com](https://vercel.com) y **Continue with GitHub**.
2. **Add New** → **Project** → elegi el repositorio `Proyecto-Personal`.
3. Vercel detecta Next.js solo. No cambies nada del build.
4. Abri **Environment Variables** y agrega las cinco:

```
NEXT_PUBLIC_SUPABASE_URL        https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   ey...
SUPABASE_SERVICE_ROLE_KEY       ey...
NEXT_PUBLIC_WHATSAPP            505XXXXXXXX
NEXT_PUBLIC_SITE_URL            https://tu-dominio.vercel.app
```

5. **Deploy**. Tarda 2-3 minutos.
6. Cuando termine, volve a Environment Variables y corregi `NEXT_PUBLIC_SITE_URL` con la URL
   real que te dio Vercel, y **Redeploy**. Esa variable alimenta el `sitemap.xml`, asi que si
   queda mal Google indexa direcciones equivocadas.

**Dominio propio** (`elhornodecarazo.com`):

1. Compra el dominio donde prefieras (Namecheap, Cloudflare, GoDaddy).
2. En Vercel: **Settings** → **Domains** → **Add**.
3. Vercel te muestra los registros DNS a crear donde compraste el dominio.
4. El certificado HTTPS se emite solo, gratis.
5. Actualiza `NEXT_PUBLIC_SITE_URL` al dominio nuevo y vuelve a desplegar.

**Costo:** el plan Hobby es **gratis** y alcanza de sobra para este sitio. Es para uso no
comercial segun los terminos de Vercel; una tienda que vende es uso comercial, asi que lo
correcto es el plan **Pro, US$20 al mes por usuario**. Empeza en Hobby para probarlo y pasa
a Pro al publicarlo de verdad.

---

### Opcion B · Netlify

Equivalente en precio y facilidad. Next.js funciona mediante un adaptador que Netlify
instala solo.

1. [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → GitHub.
2. Elegi el repositorio. Build command `npm run build`, no toques el resto.
3. **Site configuration** → **Environment variables**: las mismas cinco de arriba.
4. **Deploy site**.

**Costo:** plan gratuito con 100 GB de trafico al mes; **US$19 al mes** por usuario el plan Pro.

---

### Opcion C · Cloudflare Pages

La mas barata a volumen (trafico ilimitado en el plan gratuito) y con buena latencia desde
Centroamerica. A cambio corre sobre *workerd* en vez de Node, asi que hay un paso extra.

1. Instala el adaptador:

```bash
npm install --save-dev @opennextjs/cloudflare
```

2. En Cloudflare: **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Build command: `npx opennextjs-cloudflare build`. Output: `.open-next/assets`.
4. Agrega las variables de entorno (las secretas como **Secret**, no como texto plano).

**Costo:** gratis hasta 100.000 peticiones diarias; **US$5 al mes** el plan Workers Paid.

---

### Opcion D · Tu propio servidor (VPS con Docker)

Tiene sentido si ya pagas un servidor o si queres todo bajo tu control. Pide mas
mantenimiento: actualizaciones, certificados y respaldos corren por tu cuenta.

Crea un `Dockerfile` en la raiz:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Usuario sin privilegios: si alguien escapa del proceso, no es root.
RUN addgroup -S horno && adduser -S horno -G horno
COPY --from=build --chown=horno:horno /app/.next ./.next
COPY --from=build --chown=horno:horno /app/node_modules ./node_modules
COPY --from=build --chown=horno:horno /app/package.json ./
COPY --from=build --chown=horno:horno /app/public ./public
USER horno
EXPOSE 3000
CMD ["npm", "start"]
```

Y a correr:

```bash
docker build -t horno-carazo .
docker run -d --name horno -p 3000:3000 --env-file .env.local --restart unless-stopped horno-carazo
```

Despues pone Nginx o Caddy delante para HTTPS. Caddy saca el certificado solo:

```
elhornodecarazo.com {
  reverse_proxy localhost:3000
}
```

**Costo:** un VPS de 2 GB cuesta entre **US$6 y US$12 al mes** (Hetzner, DigitalOcean,
Vultr), mas tu tiempo de mantenimiento.

---

## Cual elegir

| | Vercel | Netlify | Cloudflare | VPS propio |
|---|---|---|---|---|
| Esfuerzo de puesta en marcha | Minimo | Minimo | Medio | Alto |
| Costo comercial al mes | US$20 | US$19 | US$5 | US$6-12 |
| Hay plan gratis util | Si (no comercial) | Si | Si | No |
| Mantenimiento tuyo | Ninguno | Ninguno | Poco | Todo |
| Velocidad desde Nicaragua | Muy buena | Muy buena | Excelente | Depende |

**Para esta panaderia: Vercel.** La diferencia de precio con Cloudflare son US$15 al mes, y
a cambio no hay adaptadores ni configuracion que se pueda romper. Si el sitio crece y el
costo empieza a pesar, mudarse a Cloudflare despues es un cambio de un dia.

---

## Despues de desplegar: comprobar que quedo bien

Recorre esta lista en el sitio publicado, no en tu maquina:

- [ ] El inicio carga y muestra productos con sus precios.
- [ ] Agregar algo a la bolsa; cerrar el navegador y volver: la bolsa sigue ahi.
- [ ] Cambiar de municipio: el costo de envio cambia.
- [ ] Un pedido de C$600 o mas en Jinotepe: el envio sale gratis.
- [ ] Hacer un pedido de prueba completo: aparece la pagina con el codigo.
- [ ] Ese codigo funciona en `/pedido`.
- [ ] El pedido aparece en `/admin/pedidos`.
- [ ] Avanzar el estado desde el panel: el cliente lo ve en su pagina de seguimiento.
- [ ] `/admin` sin haber entrado redirige al login.
- [ ] Cambiar un precio en el panel: se refleja en la tienda.
- [ ] Todo lo anterior desde un telefono.
- [ ] Borrar los pedidos de prueba:
      `delete from pedidos where cliente_nombre = 'Prueba';`

## Cada vez que haya un cambio

Con Vercel, Netlify o Cloudflare, cada `git push` a la rama principal despliega solo. No hay
que hacer nada mas.

```bash
git add -A
git commit -m "Describe el cambio"
git push
```

Antes de hacer push, conviene correr `npm run verify`: comprueba tipos, pruebas y build de
una sola vez, y evita desplegar algo roto.

## Si algo falla

| Sintoma | Causa casi siempre |
|---|---|
| `Falta la variable de entorno …` | Una variable sin cargar en el hosting. Tras agregarla hay que **volver a desplegar**. |
| El sitio carga pero sin productos | Las migraciones o el `seed.sql` no corrieron, o el proyecto de Supabase esta pausado. |
| El login no deja entrar | La cuenta existe en Authentication pero no esta en `perfiles`. |
| Los pedidos no se guardan | Falta `SUPABASE_SERVICE_ROLE_KEY`, o no corrio la migracion `crear_pedido`. |
| El `sitemap.xml` apunta a localhost | `NEXT_PUBLIC_SITE_URL` quedo con el valor de desarrollo. |
