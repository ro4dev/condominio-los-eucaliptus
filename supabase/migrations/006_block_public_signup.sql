-- ============================================
-- Condominio Los Eucaliptus - Bloquear signup público (Fase 4, opción A)
-- ============================================
-- Cierra el autoregistro: solo el admin crea cuentas vía `create-user`,
-- que setea `app_metadata.role` en el usuario.
-- Un signup desde la API pública (o la UI) no tiene `app_metadata.role`
-- y es rechazado con una excepción ANTES de insertar en `auth.users`.

create or replace function public.block_public_signup()
returns trigger
language plpgsql
as $$
begin
  if new.raw_app_meta_data is null
     or coalesce(new.raw_app_meta_data ->> 'role', '') = '' then
    raise exception 'Signup público deshabilitado. Contacta al administrador para crear tu cuenta.';
  end if;
  return new;
end;
$$;

create trigger auth_users_block_public_signup
  before insert on auth.users
  for each row
  execute function public.block_public_signup();
