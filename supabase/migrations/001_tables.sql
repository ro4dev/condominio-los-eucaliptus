-- ============================================
-- Condominio Los Eucaliptus - Tablas
-- ============================================

-- PARCELAS
CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  rol TEXT,
  metros NUMERIC NOT NULL,
  estado TEXT DEFAULT 'Habitada',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PROPIETARIOS
CREATE TABLE propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL,
  rut TEXT,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  telefono TEXT,
  email TEXT,
  tipo TEXT DEFAULT 'Propietario',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GASTOS COMUNES
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  descripcion TEXT,
  archivo TEXT,
  pagado TEXT DEFAULT 'No',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INGRESOS/EGRESOS
CREATE TABLE flujo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Egreso')),
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  descripcion TEXT,
  comprobante TEXT,
  registrado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTICIAS
CREATE TABLE noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE,
  fecha_hasta DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DOCUMENTOS
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  fecha DATE,
  descripcion TEXT,
  archivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RECLAMOS/SUGERENCIAS
CREATE TABLE reclamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('Reclamo', 'Sugerencia')),
  parcela_id UUID REFERENCES parcelas(id) ON DELETE SET NULL,
  asunto TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PROVEEDORES
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro TEXT NOT NULL,
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  web_instagram TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ASAMBLEAS
CREATE TABLE asambleas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Ordinaria', 'Extraordinaria')),
  temario TEXT NOT NULL,
  acuerdos TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ASAMBLEA ASISTENTES (junction table)
CREATE TABLE asamblea_asistentes (
  asamblea_id UUID REFERENCES asambleas(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  PRIMARY KEY (asamblea_id, parcela_id)
);

-- ENCUESTAS
CREATE TABLE encuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  alternativas JSONB DEFAULT '[]'::jsonb,
  fecha_termino DATE,
  quorum INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ENCUESTAS VOTOS
CREATE TABLE encuestas_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id UUID REFERENCES encuestas(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  seleccion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(encuesta_id, parcela_id)
);

-- CONFIG (key-value store)
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SEED DATA: configuración inicial
INSERT INTO config (key, value) VALUES
  ('montos', '{"gasto_comun_base": 50000, "fondo_reserva": 15000}'),
  ('categorias_documentos', '["Estatuto", "Actas", "Contratos", "Seguros", "Planos"]'),
  ('rubros_proveedores', '["Jardinería", "Limpieza", "Electricidad", "Plomería", "Seguridad", "Mantenimiento", "Otro"]')
ON CONFLICT (key) DO NOTHING;
