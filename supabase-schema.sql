-- ============================================
-- Esquema Supabase para JAC App
-- ============================================

-- Tabla de usuarios (presidentes/secretarios)
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  cedula TEXT DEFAULT '',
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Presidente', 'Secretario', 'Tesorero')),
  ciudad TEXT DEFAULT '',
  barrio TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de registros de inscripción
CREATE TABLE IF NOT EXISTS registros (
  id BIGSERIAL PRIMARY KEY,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  cedula TEXT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT DEFAULT '',
  barrio TEXT NOT NULL,
  password TEXT DEFAULT '',
  role TEXT DEFAULT 'Afiliado',
  observacion TEXT DEFAULT '',
  fecha TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_registros_cedula ON registros (cedula);
CREATE INDEX IF NOT EXISTS idx_registros_barrio ON registros (barrio);

-- ============================================
-- Migraciones (ejecutar si ya existen las tablas)
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cedula TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ciudad TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cambio_requerido BOOLEAN DEFAULT TRUE;

-- RLS para usuarios (necesario para getUsuarios)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_select_usuarios ON usuarios;
CREATE POLICY anon_select_usuarios ON usuarios FOR SELECT USING (true);
ALTER TABLE registros ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Afiliado';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS ciudad TEXT DEFAULT '';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS cambio_requerido BOOLEAN DEFAULT TRUE;

-- Tabla de códigos de registro (admin los genera)
CREATE TABLE IF NOT EXISTS codigos_registro (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  usado_por TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar códigos de ejemplo (el admin puede agregar más)
INSERT INTO codigos_registro (codigo) VALUES
  ('JAC2026'),
  ('ADMIN001'),
  ('SECRET123')
ON CONFLICT (codigo) DO NOTHING;

-- Políticas RLS para codigos_registro
ALTER TABLE codigos_registro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_select_codigos ON codigos_registro;
CREATE POLICY anon_select_codigos ON codigos_registro FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_update_codigos ON codigos_registro;
CREATE POLICY anon_update_codigos ON codigos_registro FOR UPDATE USING (true);

-- ============================================
-- Tabla de solicitudes de eliminación (Ley 1581/2012)
-- ============================================
CREATE TABLE IF NOT EXISTS solicitudes_eliminacion (
  id BIGSERIAL PRIMARY KEY,
  registro_id TEXT NOT NULL,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  cedula TEXT NOT NULL,
  barrio TEXT NOT NULL,
  motivos TEXT NOT NULL,
  observacion TEXT DEFAULT '',
  solicitado_por TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE solicitudes_eliminacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_solicitudes ON solicitudes_eliminacion;
CREATE POLICY anon_insert_solicitudes ON solicitudes_eliminacion FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_select_solicitudes ON solicitudes_eliminacion;
CREATE POLICY anon_select_solicitudes ON solicitudes_eliminacion FOR SELECT USING (true);

-- ============================================
-- Tabla de soporte/mensajes
-- ============================================
CREATE TABLE IF NOT EXISTS soporte (
  id BIGSERIAL PRIMARY KEY,
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  usuario TEXT DEFAULT '',
  barrio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE soporte ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_soporte ON soporte;
CREATE POLICY anon_insert_soporte ON soporte FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_select_soporte ON soporte;
CREATE POLICY anon_select_soporte ON soporte FOR SELECT USING (true);

-- ============================================
-- Tabla de actas de reunión
-- ============================================
CREATE TABLE IF NOT EXISTS actas (
  id BIGSERIAL PRIMARY KEY,
  numero TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  lugar TEXT NOT NULL,
  tipo TEXT NOT NULL,
  orden_dia TEXT NOT NULL,
  desarrollo TEXT NOT NULL,
  acuerdos TEXT DEFAULT '',
  imagenes TEXT DEFAULT '',
  barrio TEXT NOT NULL,
  creado_por TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE actas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_actas ON actas;
CREATE POLICY anon_insert_actas ON actas FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_select_actas ON actas;
CREATE POLICY anon_select_actas ON actas FOR SELECT USING (true);

-- Migración para tabla existente
ALTER TABLE actas ADD COLUMN IF NOT EXISTS imagenes TEXT DEFAULT '';

-- Eliminar actas duplicadas (conserva la más antigua)
DELETE FROM actas a USING actas b WHERE a.id > b.id AND a.numero = b.numero AND a.barrio = b.barrio;

-- Restricción única: no pueden existir dos actas con el mismo número en el mismo barrio
ALTER TABLE actas ADD CONSTRAINT actas_numero_barrio_unique UNIQUE (numero, barrio);

-- Bucket de almacenamiento para evidencias (ejecutar en Storage > Create bucket o SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('evidencias', 'evidencias', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY anon_select_evidencias ON storage.objects FOR SELECT USING (bucket_id = 'evidencias');
-- CREATE POLICY anon_insert_evidencias ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidencias');

-- ============================================
-- Tabla de reuniones / videollamadas
-- ============================================
CREATE TABLE IF NOT EXISTS reuniones (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  duracion_minutos INTEGER DEFAULT 60,
  sala_nombre TEXT UNIQUE NOT NULL,
  creado_por TEXT NOT NULL,
  creador_nombre TEXT DEFAULT '',
  barrio TEXT NOT NULL,
  ciudad TEXT DEFAULT '',
  estado TEXT DEFAULT 'programada' CHECK (estado IN ('programada','en_curso','finalizada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reuniones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_reuniones ON reuniones;
CREATE POLICY anon_insert_reuniones ON reuniones FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_select_reuniones ON reuniones;
CREATE POLICY anon_select_reuniones ON reuniones FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_update_reuniones ON reuniones;
CREATE POLICY anon_update_reuniones ON reuniones FOR UPDATE USING (true);
DROP POLICY IF EXISTS anon_delete_reuniones ON reuniones;
CREATE POLICY anon_delete_reuniones ON reuniones FOR DELETE USING (true);

-- ============================================
-- Tabla de invitaciones a reuniones (miembros internos)
-- ============================================
CREATE TABLE IF NOT EXISTS invitaciones_reunion (
  id BIGSERIAL PRIMARY KEY,
  reunion_id BIGINT NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
  invitado_username TEXT NOT NULL,
  invitado_nombre TEXT DEFAULT '',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmada','rechazada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invitaciones_reunion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_invitaciones ON invitaciones_reunion;
CREATE POLICY anon_insert_invitaciones ON invitaciones_reunion FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_select_invitaciones ON invitaciones_reunion;
CREATE POLICY anon_select_invitaciones ON invitaciones_reunion FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_update_invitaciones ON invitaciones_reunion;
CREATE POLICY anon_update_invitaciones ON invitaciones_reunion FOR UPDATE USING (true);

-- ============================================
-- Tabla de invitados externos por cédula
-- ============================================
CREATE TABLE IF NOT EXISTS invitados_externos (
  id BIGSERIAL PRIMARY KEY,
  reunion_id BIGINT NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
  cedula TEXT NOT NULL,
  nombre TEXT DEFAULT '',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invitados_externos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_externos ON invitados_externos;
CREATE POLICY anon_insert_externos ON invitados_externos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_select_externos ON invitados_externos;
CREATE POLICY anon_select_externos ON invitados_externos FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_update_externos ON invitados_externos;
CREATE POLICY anon_update_externos ON invitados_externos FOR UPDATE USING (true);

-- ============================================
-- Tabla de asistencia a reuniones (auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS asistencia_reuniones (
  id BIGSERIAL PRIMARY KEY,
  reunion_id BIGINT NOT NULL REFERENCES reuniones(id) ON DELETE CASCADE,
  participante_username TEXT DEFAULT '',
  participante_cedula TEXT DEFAULT '',
  participante_nombre TEXT DEFAULT '',
  rol TEXT NOT NULL,
  hora_ingreso TIMESTAMPTZ DEFAULT NOW(),
  hora_salida TIMESTAMPTZ
);

ALTER TABLE asistencia_reuniones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_asistencia ON asistencia_reuniones;
CREATE POLICY anon_insert_asistencia ON asistencia_reuniones FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_select_asistencia ON asistencia_reuniones;
CREATE POLICY anon_select_asistencia ON asistencia_reuniones FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_update_asistencia ON asistencia_reuniones;
CREATE POLICY anon_update_asistencia ON asistencia_reuniones FOR UPDATE USING (true);
