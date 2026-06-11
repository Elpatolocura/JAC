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

-- Insertar usuarios iniciales (password = su propia cédula = forzará cambio)
INSERT INTO usuarios (username, password, cedula, name, role, barrio) VALUES
  ('presidente_progreso', '123456', '123456', 'Carlos Martínez', 'Presidente', 'El Progreso'),
  ('secretario_progreso', '123456', '123456', 'María Gómez', 'Secretario', 'El Progreso'),
  ('presidente_villa', '123456', '123456', 'Luis Hernández', 'Presidente', 'Villa Nueva'),
  ('secretario_villa', '123456', '123456', 'Sofía Ramírez', 'Secretario', 'Villa Nueva'),
  ('presidente_olivos', '123456', '123456', 'Andrés Castillo', 'Presidente', 'Los Olivos'),
  ('secretario_olivos', '123456', '123456', 'Carolina Pérez', 'Secretario', 'Los Olivos'),
  ('presidente_florida', '123456', '123456', 'Jorge Medina', 'Presidente', 'La Florida'),
  ('secretario_florida', '123456', '123456', 'Ana Rodríguez', 'Secretario', 'La Florida'),
  ('ranceth', '123456', '123456', 'Ranceth', 'Presidente', 'Torices')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- Migraciones (ejecutar si ya existen las tablas)
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cedula TEXT DEFAULT '';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';
ALTER TABLE registros ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Afiliado';
