# Changelog

## [Unreleased]

### Added
- Supabase integration for backend data
- Modal forms for all sections (gastos, parcelas, propietarios, noticias, flujo, documentos, reclamos, proveedores, asambleas)
- Skeleton loading for registros table in gastos comunes
- Skeleton loading for stats cards in gastos comunes
- Supabase database migrations (schema + seed data)
- RLS policies for read access
- Block INSERT until auth is implemented
- Demo mode toggle for testing with local JSON files

### Fixed
- formatPeriodo handles full date strings (YYYY-MM-DD)
- Field names compatibility with Supabase (fecha, asistentes)
- RLS policies using USING (true) instead of auth.role()

### Changed
- Removed Google Apps Script backend
- Removed Google Forms integration
- Backend now uses Supabase (PostgreSQL + PostgREST)
- Frontend uses Supabase JS client for data fetching

## [1.0.0] - 2026-07-17

### Initial Release
- Basic SPA with tab navigation
- Data loading from Google Apps Script
- Demo mode with local JSON files
- Chart.js visualizations
- Responsive design
