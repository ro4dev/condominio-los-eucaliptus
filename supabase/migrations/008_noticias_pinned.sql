-- ============================================
-- Condominio Los Eucaliptus - Noticias pinnables en Home
-- ============================================

ALTER TABLE noticias ADD COLUMN pinned BOOLEAN DEFAULT false;
