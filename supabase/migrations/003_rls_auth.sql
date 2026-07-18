-- ============================================
-- Condominio Eucaliptus - RLS + Auth
-- Ejecutar después de habilitar Auth en el dashboard
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujo ENABLE ROW LEVEL SECURITY;
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE asambleas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: Lectura pública (cualquier rol)
-- Se restringirá cuando se implemente auth
-- ============================================

DROP POLICY IF EXISTS "parcelas_select" ON parcelas;
DROP POLICY IF EXISTS "propietarios_select" ON propietarios;
DROP POLICY IF EXISTS "gastos_select" ON gastos;
DROP POLICY IF EXISTS "flujo_select" ON flujo;
DROP POLICY IF EXISTS "noticias_select" ON noticias;
DROP POLICY IF EXISTS "documentos_select" ON documentos;
DROP POLICY IF EXISTS "reclamos_select" ON reclamos;
DROP POLICY IF EXISTS "proveedores_select" ON proveedores;
DROP POLICY IF EXISTS "asambleas_select" ON asambleas;

CREATE POLICY "parcelas_select" ON parcelas
  FOR SELECT USING (true);

CREATE POLICY "propietarios_select" ON propietarios
  FOR SELECT USING (true);

CREATE POLICY "gastos_select" ON gastos
  FOR SELECT USING (true);

CREATE POLICY "flujo_select" ON flujo
  FOR SELECT USING (true);

CREATE POLICY "noticias_select" ON noticias
  FOR SELECT USING (true);

CREATE POLICY "documentos_select" ON documentos
  FOR SELECT USING (true);

CREATE POLICY "reclamos_select" ON reclamos
  FOR SELECT USING (true);

CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT USING (true);

CREATE POLICY "asambleas_select" ON asambleas
  FOR SELECT USING (true);

-- ============================================
-- POLÍTICAS: Escritura pública (cualquier rol)
-- Se restringirá cuando se implemente auth
-- ============================================

DROP POLICY IF EXISTS "parcelas_insert" ON parcelas;
DROP POLICY IF EXISTS "propietarios_insert" ON propietarios;
DROP POLICY IF EXISTS "gastos_insert" ON gastos;
DROP POLICY IF EXISTS "flujo_insert" ON flujo;
DROP POLICY IF EXISTS "noticias_insert" ON noticias;
DROP POLICY IF EXISTS "documentos_insert" ON documentos;
DROP POLICY IF EXISTS "reclamos_insert" ON reclamos;
DROP POLICY IF EXISTS "proveedores_insert" ON proveedores;
DROP POLICY IF EXISTS "asambleas_insert" ON asambleas;

CREATE POLICY "parcelas_insert" ON parcelas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "propietarios_insert" ON propietarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "flujo_insert" ON flujo
  FOR INSERT WITH CHECK (true);

CREATE POLICY "noticias_insert" ON noticias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "documentos_insert" ON documentos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reclamos_insert" ON reclamos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "asambleas_insert" ON asambleas
  FOR INSERT WITH CHECK (true);

-- ============================================
-- TABLA DE PERFILES (para rol admin/user)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
