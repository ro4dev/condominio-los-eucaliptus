-- ============================================
-- Condominio Eucaliptus - Schema inicial
-- ============================================

-- PARCELAS
CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  rol TEXT,
  metros NUMERIC,
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
  parcela_id UUID REFERENCES parcelas(id) ON DELETE SET NULL,
  periodo TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  descripcion TEXT,
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
  fecha_hasta DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DOCUMENTOS
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
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
  contacto TEXT,
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
  asistentes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Habilitar cuando se configure Auth
-- ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE flujo ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reclamos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE asambleas ENABLE ROW LEVEL SECURITY;
