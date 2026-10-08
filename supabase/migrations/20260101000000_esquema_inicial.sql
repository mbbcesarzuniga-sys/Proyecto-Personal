-- ===========================================================================
-- El Horno de Carazo - esquema inicial
-- Moneda: cordobas nicaraguenses (NIO). Todos los montos son ENTEROS en
-- cordobas. No usamos centavos porque el negocio no cobra fracciones, y
-- enteros evitan errores de redondeo en coma flotante.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- Tipos
-- --------------------------------------------------------------------------
create type modo_entrega as enum ('entrega', 'retiro');

create type estado_pedido as enum (
  'recibido',       -- el cliente lo envio, la panaderia aun no lo ve
  'confirmado',     -- la panaderia lo acepto
  'en_preparacion',
  'listo',          -- listo para retiro o para salir
  'en_camino',
  'entregado',
  'cancelado'
);

create type metodo_pago as enum ('efectivo', 'transferencia', 'tarjeta');

create type estado_pago as enum ('pendiente', 'verificando', 'pagado', 'fallido', 'reembolsado');

create type rol_usuario as enum ('admin', 'staff');

-- --------------------------------------------------------------------------
-- Catalogo
-- --------------------------------------------------------------------------
create table categorias (
  id          text primary key,
  nombre      text not null,
  orden       int  not null default 0,
  activa      boolean not null default true
);

create table productos (
  id              text primary key,
  categoria_id    text not null references categorias(id) on update cascade,
  nombre          text not null,
  descripcion     text not null default '',
  -- Precio unitario en cordobas enteros.
  precio          int  not null check (precio >= 0),
  unidad          text not null default 'c/u',
  etiqueta        text,                        -- "El mas pedido", "Recien horneado"
  ilustracion     text,                        -- clave del SVG en src/lib/ilustraciones.ts
  disponible      boolean not null default true,
  en_vitrina_hoy  boolean not null default false,
  -- Horas minimas de anticipacion. 0 = se vende del dia.
  anticipacion_horas int not null default 0 check (anticipacion_horas >= 0),
  orden           int  not null default 0,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create index productos_categoria_idx on productos (categoria_id, orden);
create index productos_vitrina_idx   on productos (en_vitrina_hoy) where en_vitrina_hoy;

-- --------------------------------------------------------------------------
-- Zonas de entrega
-- --------------------------------------------------------------------------
create table zonas_entrega (
  id                text primary key,
  nombre            text not null,
  costo             int  not null check (costo >= 0),
  -- Si el subtotal alcanza este monto, el envio es gratis. NULL = nunca gratis.
  envio_gratis_desde int check (envio_gratis_desde > 0),
  activa            boolean not null default true,
  orden             int not null default 0
);

-- --------------------------------------------------------------------------
-- Paquetes de encargo (eventos)
-- --------------------------------------------------------------------------
create table paquetes_evento (
  id       text primary key,
  nombre   text not null,
  -- [{ "descripcion": "...", "por_persona": 0.05, "precio": 1100 }]
  -- por_persona: cuantas unidades se necesitan por invitado.
  renglones jsonb not null,
  activo   boolean not null default true,
  orden    int not null default 0
);

-- --------------------------------------------------------------------------
-- Configuracion del negocio (una fila por clave)
-- --------------------------------------------------------------------------
create table configuracion (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Pedidos
-- --------------------------------------------------------------------------
create table pedidos (
  id              uuid primary key default gen_random_uuid(),
  -- Codigo corto que el cliente usa para dar seguimiento: HC-260408-7F3A
  codigo          text not null unique,
  estado          estado_pedido not null default 'recibido',
  modo            modo_entrega  not null,
  zona_id         text references zonas_entrega(id),

  cliente_nombre   text not null,
  cliente_telefono text not null,
  direccion        text,
  cuando           text not null,        -- "Hoy en la tarde", "Manana en la manana"
  nota             text,

  metodo_pago      metodo_pago not null,
  estado_pago      estado_pago not null default 'pendiente',
  pago_referencia  text,                 -- numero de transferencia o id de la pasarela
  pago_comprobante_url text,

  -- Montos congelados al momento del pedido (enteros, cordobas).
  subtotal        int not null check (subtotal >= 0),
  envio           int not null check (envio >= 0),
  total           int not null check (total >= 0),

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),

  -- Si es entrega, exigimos direccion y zona.
  constraint entrega_requiere_direccion
    check (modo <> 'entrega' or (direccion is not null and length(btrim(direccion)) > 0)),
  constraint entrega_requiere_zona
    check (modo <> 'entrega' or zona_id is not null)
);

create index pedidos_estado_idx on pedidos (estado, creado_en desc);
create index pedidos_creado_idx on pedidos (creado_en desc);

create table pedido_renglones (
  id         uuid primary key default gen_random_uuid(),
  pedido_id  uuid not null references pedidos(id) on delete cascade,
  -- Guardamos el producto por referencia Y por copia: si manana cambia el
  -- precio o se borra el producto, el pedido historico no se altera.
  producto_id      text references productos(id) on delete set null,
  nombre_producto  text not null,
  precio_unitario  int  not null check (precio_unitario >= 0),
  cantidad         int  not null check (cantidad > 0),
  subtotal         int  not null check (subtotal >= 0)
);

create index pedido_renglones_pedido_idx on pedido_renglones (pedido_id);

-- Bitacora de cambios de estado: quien lo movio y cuando.
create table pedido_eventos (
  id         uuid primary key default gen_random_uuid(),
  pedido_id  uuid not null references pedidos(id) on delete cascade,
  estado     estado_pedido not null,
  nota       text,
  actor      text,              -- email del staff, o 'sistema'
  creado_en  timestamptz not null default now()
);

create index pedido_eventos_pedido_idx on pedido_eventos (pedido_id, creado_en);

-- --------------------------------------------------------------------------
-- Personal autorizado al panel
-- --------------------------------------------------------------------------
create table perfiles (
  id     uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol    rol_usuario not null default 'staff',
  creado_en timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Triggers
-- --------------------------------------------------------------------------
create or replace function tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger productos_actualizado before update on productos
  for each row execute function tocar_actualizado_en();

create trigger pedidos_actualizado before update on pedidos
  for each row execute function tocar_actualizado_en();

-- Cada cambio de estado queda registrado solo.
create or replace function registrar_evento_pedido()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') or (new.estado is distinct from old.estado) then
    insert into pedido_eventos (pedido_id, estado, actor)
    values (new.id, new.estado, coalesce(auth.jwt() ->> 'email', 'sistema'));
  end if;
  return new;
end;
$$;

create trigger pedidos_bitacora after insert or update of estado on pedidos
  for each row execute function registrar_evento_pedido();

-- --------------------------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
--
-- Regla general:
--   * El catalogo es de lectura publica (solo lo activo/disponible).
--   * Los pedidos NO son accesibles desde el navegador. Toda escritura y
--     lectura de pedidos pasa por rutas de servidor con la service role key.
--   * El personal autenticado ve y mueve pedidos desde el panel.
-- --------------------------------------------------------------------------
alter table categorias       enable row level security;
alter table productos        enable row level security;
alter table zonas_entrega    enable row level security;
alter table paquetes_evento  enable row level security;
alter table configuracion    enable row level security;
alter table pedidos          enable row level security;
alter table pedido_renglones enable row level security;
alter table pedido_eventos   enable row level security;
alter table perfiles         enable row level security;

create or replace function es_personal()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from perfiles where id = auth.uid());
$$;

-- Catalogo: lectura publica de lo activo
create policy "catalogo publico: categorias" on categorias
  for select to anon, authenticated using (activa);

create policy "catalogo publico: productos" on productos
  for select to anon, authenticated using (disponible);

create policy "catalogo publico: zonas" on zonas_entrega
  for select to anon, authenticated using (activa);

create policy "catalogo publico: paquetes" on paquetes_evento
  for select to anon, authenticated using (activo);

create policy "catalogo publico: configuracion" on configuracion
  for select to anon, authenticated using (true);

-- Catalogo: escritura solo personal
create policy "personal escribe categorias" on categorias
  for all to authenticated using (es_personal()) with check (es_personal());

create policy "personal escribe productos" on productos
  for all to authenticated using (es_personal()) with check (es_personal());

create policy "personal escribe zonas" on zonas_entrega
  for all to authenticated using (es_personal()) with check (es_personal());

create policy "personal escribe paquetes" on paquetes_evento
  for all to authenticated using (es_personal()) with check (es_personal());

create policy "personal escribe configuracion" on configuracion
  for all to authenticated using (es_personal()) with check (es_personal());

-- Pedidos: solo personal autenticado. El cliente consulta via API de servidor.
create policy "personal ve pedidos" on pedidos
  for select to authenticated using (es_personal());

create policy "personal actualiza pedidos" on pedidos
  for update to authenticated using (es_personal()) with check (es_personal());

create policy "personal ve renglones" on pedido_renglones
  for select to authenticated using (es_personal());

create policy "personal ve eventos" on pedido_eventos
  for select to authenticated using (es_personal());

create policy "cada quien ve su perfil" on perfiles
  for select to authenticated using (id = auth.uid() or es_personal());
