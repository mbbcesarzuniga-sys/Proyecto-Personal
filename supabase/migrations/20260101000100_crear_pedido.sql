-- ===========================================================================
-- crear_pedido: inserta el pedido y sus renglones en UNA transaccion.
--
-- Por que una funcion y no dos inserts desde la aplicacion: la API REST de
-- Supabase no agrupa dos tablas en una transaccion. Sin esto, si el segundo
-- insert falla quedaria un pedido sin productos, que la panaderia veria
-- como un pedido vacio. Aqui o entra todo o no entra nada.
-- ===========================================================================

create or replace function crear_pedido(
  p_codigo           text,
  p_modo             modo_entrega,
  p_zona_id          text,
  p_cliente_nombre   text,
  p_cliente_telefono text,
  p_direccion        text,
  p_cuando           text,
  p_nota             text,
  p_metodo_pago      metodo_pago,
  p_subtotal         int,
  p_envio            int,
  p_total            int,
  -- [{"producto_id":"croissant","nombre_producto":"...","precio_unitario":45,"cantidad":2,"subtotal":90}]
  p_renglones        jsonb
)
returns table (id uuid, codigo text)
language plpgsql
volatile
set search_path = public
as $$
declare
  v_id uuid;
  v_suma int;
begin
  if p_renglones is null or jsonb_array_length(p_renglones) = 0 then
    raise exception 'Un pedido necesita al menos un producto' using errcode = '22023';
  end if;

  -- Defensa en profundidad: aunque la aplicacion ya calculo los montos,
  -- verificamos que los renglones sumen el subtotal declarado.
  select coalesce(sum((r->>'subtotal')::int), 0) into v_suma
  from jsonb_array_elements(p_renglones) r;

  if v_suma <> p_subtotal then
    raise exception 'El subtotal (%) no coincide con la suma de los renglones (%)',
      p_subtotal, v_suma using errcode = '22023';
  end if;

  if p_total <> p_subtotal + p_envio then
    raise exception 'El total no es subtotal + envio' using errcode = '22023';
  end if;

  insert into pedidos (
    codigo, modo, zona_id, cliente_nombre, cliente_telefono, direccion,
    cuando, nota, metodo_pago, subtotal, envio, total
  ) values (
    p_codigo, p_modo, p_zona_id, p_cliente_nombre, p_cliente_telefono, p_direccion,
    p_cuando, p_nota, p_metodo_pago, p_subtotal, p_envio, p_total
  )
  returning pedidos.id into v_id;

  insert into pedido_renglones (
    pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal
  )
  select
    v_id,
    r->>'producto_id',
    r->>'nombre_producto',
    (r->>'precio_unitario')::int,
    (r->>'cantidad')::int,
    (r->>'subtotal')::int
  from jsonb_array_elements(p_renglones) r;

  return query select v_id, p_codigo;
end;
$$;

-- Solo el servidor de la aplicacion (service role) crea pedidos.
revoke all on function crear_pedido from public;
revoke all on function crear_pedido from anon, authenticated;
