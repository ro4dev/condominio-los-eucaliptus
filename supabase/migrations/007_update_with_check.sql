-- ============================================
-- Condominio Los Eucaliptus - WITH CHECK admin en UPDATE policies (Fase 7, M3)
-- ============================================
-- Las UPDATE policies de la migración 002 solo tienen USING (admin).
-- Sin WITH CHECK, un usuario no-admin no puede editar filas (USING lo impide),
-- pero la política queda mal definida: al agregar WITH CHECK se garantiza que
-- cualquier UPDATE solo deje filas administrables por admin.
-- Se re-crean las 11 policies UPDATE (drop + create, mismo nombre).

drop policy if exists "parcelas_update" on parcelas;
create policy "parcelas_update" on parcelas
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "propietarios_update" on propietarios;
create policy "propietarios_update" on propietarios
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "gastos_update" on gastos;
create policy "gastos_update" on gastos
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "flujo_update" on flujo;
create policy "flujo_update" on flujo
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "noticias_update" on noticias;
create policy "noticias_update" on noticias
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "documentos_update" on documentos;
create policy "documentos_update" on documentos
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "reclamos_update" on reclamos;
create policy "reclamos_update" on reclamos
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "proveedores_update" on proveedores;
create policy "proveedores_update" on proveedores
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "asambleas_update" on asambleas;
create policy "asambleas_update" on asambleas
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "encuestas_update" on encuestas;
create policy "encuestas_update" on encuestas
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

drop policy if exists "config_update" on config;
create policy "config_update" on config
  for update to authenticated
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
