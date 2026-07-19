-- ============================================
-- Revert: eliminar GRANTs manuales de 018
-- ============================================

REVOKE SELECT ON public.admin_users FROM authenticated;
REVOKE SELECT ON public.config FROM authenticated;
