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
-- POLÍTICAS: Usuarios autenticados pueden leer todo
-- ============================================

CREATE POLICY "parcelas_select" ON parcelas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "propietarios_select" ON propietarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "gastos_select" ON gastos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "flujo_select" ON flujo
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "noticias_select" ON noticias
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "documentos_select" ON documentos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "reclamos_select" ON reclamos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "asambleas_select" ON asambleas
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- POLÍTICAS: Solo admin puede escribir
-- (por ahora, cualquier autenticado puede escribir)
-- Después se puede restringir con un campo "role" en profiles
-- ============================================

CREATE POLICY "parcelas_insert" ON parcelas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "propietarios_insert" ON propietarios
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "flujo_insert" ON flujo
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "noticias_insert" ON noticias
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "documentos_insert" ON documentos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reclamos_insert" ON reclamos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "asambleas_insert" ON asambleas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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
