-- ============================================
-- Fix: Grant permissions on admin_users y config
-- ============================================

GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON public.config TO authenticated;
