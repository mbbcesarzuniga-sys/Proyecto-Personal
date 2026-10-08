-- ===========================================================================
-- Datos iniciales. Son los mismos del prototipo: 4 categorias, 14 productos,
-- 6 zonas de Carazo y 4 paquetes de evento.
-- Idempotente: se puede correr varias veces sin duplicar.
-- ===========================================================================

insert into categorias (id, nombre, orden) values
  ('pan',         'Panaderia',            1),
  ('reposteria',  'Reposteria',           2),
  ('tradicion',   'Tradicion de Carazo',  3),
  ('cafe',        'Cafeteria',            4)
on conflict (id) do update set nombre = excluded.nombre, orden = excluded.orden;

insert into productos (id, categoria_id, nombre, descripcion, precio, unidad, etiqueta, ilustracion, en_vitrina_hoy, anticipacion_horas, orden) values
  ('croissant',   'pan',        'Croissant de mantequilla',  'Hojaldrado, sale a las 7:00 a.m.',                      45,  'c/u',      'Recien horneado', 'croissant',   true,  0,  1),
  ('molde',       'pan',        'Pan de molde',              'Blanco o integral, rebanado.',                          95,  'unidad',   null,              'molde',       false, 0,  2),
  ('baguette',    'pan',        'Baguette',                  'Corteza crujiente, para sandwiches.',                   60,  'c/u',      null,              'baguette',    true,  0,  3),
  ('relleno',     'pan',        'Pan relleno de pollo',      'El favorito para la merienda de las 3:00.',             35,  'c/u',      null,              'relleno',     false, 0,  4),
  ('tres-leches', 'reposteria', 'Tres leches',               'Porcion individual con crema batida.',                  80,  'porcion',  'El mas pedido',   'tres-leches', true,  0,  1),
  ('cheesecake',  'reposteria', 'Cheesecake de maracuya',    'Base de galleta y salsa de maracuya.',                  95,  'porcion',  null,              'cheesecake',  false, 0,  2),
  ('cupcakes',    'reposteria', 'Cupcakes',                  'Caja de 6, sabores surtidos.',                         270,  'caja',     null,              'cupcakes',    false, 0,  3),
  ('pastel',      'reposteria', 'Pastel de chocolate',       'Para 20 personas. Por encargo con 48 h.',             1100,  'entero',   null,              'pastel',      false, 48, 4),
  ('rosquillas',  'tradicion',  'Rosquillas',                'Bolsa de 20, de maiz y queso.',                         70,  'bolsa',    null,              'rosquillas',  true,  0,  1),
  ('cosa-horno',  'tradicion',  'Cosa de horno',             'Porcion de la receta de la casa.',                      45,  'porcion',  null,              'cosa-horno',  false, 0,  2),
  ('galletas',    'tradicion',  'Galletas de mantequilla',   'Bolsa de 12, para el cafe.',                           120,  'bolsa',    null,              'galletas',    false, 0,  3),
  ('latte',       'cafe',       'Cafe latte',                'Con cafe de Carazo, caliente o frio.',                  70,  'vaso',     null,              'latte',       false, 0,  1),
  ('frappe',      'cafe',       'Frappe de cafe',            'Con crema batida.',                                     90,  'vaso',     null,              'frappe',      false, 0,  2),
  ('cafe',        'cafe',       'Cafe de Carazo molido',     'Libra, tueste medio, de fincas de la meseta.',          200,  'libra',    null,              'cafe',        false, 0,  3),
  -- Cajas de regalo
  ('caja-viajero','tradicion',  'Caja de rosquillas',        'Para llevar de viaje, sellada al vacio.',              480,  'caja',     'Para regalar',    'caja-viajero',false, 24, 4),
  ('caja-familia','tradicion',  'Desde afuera, para tu gente','La encargas desde el exterior y la entregamos aqui.', 450,  'caja',     null,              'caja-familia',false, 24, 5)
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre       = excluded.nombre,
  descripcion  = excluded.descripcion,
  precio       = excluded.precio,
  unidad       = excluded.unidad,
  etiqueta     = excluded.etiqueta,
  ilustracion  = excluded.ilustracion,
  anticipacion_horas = excluded.anticipacion_horas,
  orden        = excluded.orden;

-- Costos del prototipo. Envio gratis desde C$600 solo en Jinotepe.
insert into zonas_entrega (id, nombre, costo, envio_gratis_desde, orden) values
  ('jinotepe',    'Jinotepe',       40, 600, 1),
  ('dolores',     'Dolores',        50, null, 2),
  ('diriamba',    'Diriamba',       60, null, 3),
  ('sanmarcos',   'San Marcos',     70, null, 4),
  ('santateresa', 'Santa Teresa',   80, null, 5),
  ('lapaz',       'La Paz de Carazo',80, null, 6)
on conflict (id) do update set
  nombre = excluded.nombre, costo = excluded.costo,
  envio_gratis_desde = excluded.envio_gratis_desde, orden = excluded.orden;

insert into paquetes_evento (id, nombre, renglones, orden) values
  ('cumple',  'Paquete cumpleanos', '[
    {"descripcion":"Pastel de chocolate (20 personas)","por_persona":0.05,"precio":1100},
    {"descripcion":"Cupcakes (caja de 6)","por_persona":0.1,"precio":270},
    {"descripcion":"Frappe de cafe","por_persona":0.1,"precio":90}
  ]'::jsonb, 1),
  ('baby',    'Paquete baby shower o bautizo', '[
    {"descripcion":"Cupcakes (caja de 6)","por_persona":0.17,"precio":270},
    {"descripcion":"Tres leches (porcion)","por_persona":0.5,"precio":80},
    {"descripcion":"Galletas de mantequilla (bolsa de 12)","por_persona":0.08,"precio":120}
  ]'::jsonb, 2),
  ('oficina', 'Paquete oficina o reunion', '[
    {"descripcion":"Croissant de mantequilla","por_persona":1,"precio":45},
    {"descripcion":"Pan relleno de pollo","por_persona":0.5,"precio":35},
    {"descripcion":"Cafe de Carazo molido (libra)","por_persona":0.04,"precio":200}
  ]'::jsonb, 3),
  ('fiesta',  'Paquete fiesta familiar', '[
    {"descripcion":"Pastel de chocolate (20 personas)","por_persona":0.05,"precio":1100},
    {"descripcion":"Rosquillas (bolsa de 20)","por_persona":0.1,"precio":70},
    {"descripcion":"Cosa de horno (porcion)","por_persona":0.5,"precio":45}
  ]'::jsonb, 4)
on conflict (id) do update set nombre = excluded.nombre, renglones = excluded.renglones;

insert into configuracion (clave, valor) values
  ('negocio', '{
    "nombre": "El Horno de Carazo",
    "ciudad": "Jinotepe, Carazo",
    "whatsapp": "50500000000",
    "horario": "Lunes a sabado 6:00 a.m. - 7:00 p.m. Domingo 6:00 a.m. - 12:00 m.",
    "direccion": "Costado norte del parque central, Jinotepe, Carazo"
  }'::jsonb),
  ('pagos', '{
    "transferencia": {
      "banco": "BAC Nicaragua",
      "cuenta": "000000000",
      "titular": "El Horno de Carazo S.A.",
      "instruccion": "Envia el comprobante por WhatsApp para confirmar tu pedido."
    },
    "tarjeta_activa": false
  }'::jsonb),
  ('horarios_entrega', '["Hoy en la tarde","Manana en la manana","Manana en la tarde"]'::jsonb)
on conflict (clave) do update set valor = excluded.valor, actualizado_en = now();
