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
  role TEXT NOT NULL CHECK (role IN ('Presidente', 'Secretario')),
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
