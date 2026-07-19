-- ============================================
-- Migrar a roles JWT + eliminar admin_users
-- ============================================

-- 1. Policies UPDATE/DELETE para authenticated
-- (parcelas necesita UPDATE para renameParcelas)
CREATE POLICY "parcelas_update" ON parcelas
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "propietarios_update" ON propietarios
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "gastos_update" ON gastos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "reclamos_update" ON reclamos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "asambleas_update" ON asambleas
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "config_update" ON config
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "config_insert" ON config
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "config_delete" ON config
  FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Policies admin: acceso total (JWT role = 'admin')
CREATE POLICY "admin_all_parcelas" ON parcelas
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_all_propietarios" ON propietarios
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_all_gastos" ON gastos
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_all_reclamos" ON reclamos
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_all_asambleas" ON asambleas
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_all_asamblea_asistentes" ON asamblea_asistentes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_all_config" ON config
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 3. Eliminar tabla admin_users
DROP TABLE IF EXISTS admin_users;

-- 4. Políticas DELETE para authenticated (solo sus propios datos donde aplique)
CREATE POLICY "reclamos_delete" ON reclamos
  FOR DELETE USING (auth.role() = 'authenticated');
