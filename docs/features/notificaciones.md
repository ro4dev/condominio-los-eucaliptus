# Notificaciones — diseño (sin implementar)

> **Estado: diseño solamente.** El envío de correo no está operativo en el proyecto (el plan de la auditoría de seguridad todavía no habilita SMTP). Este documento define QUÉ notificar y CÓMO se podría entregar, para implementar cuando exista la infraestructura.

## 1. Objetivo

Que el vecino se entere de lo que le importa sin entrar a la página: vencimientos de su cuota, respuestas a sus reclamos, avisos nuevos y eventos próximos (asambleas, encuestas).

## 2. Casos de uso (priorizados)

| # | Caso | Trigger | Destinatario |
|---|------|---------|--------------|
| 1 | Cuota emitida | Se emite cuota para parcela (gasto nuevo con `pagado='No'`) | Propietario de la parcela |
| 2 | Vencimiento/recordatorio | Cuota pendiente + N días desde emisión (configurable) | Propietario deudor |
| 3 | Pago registrado | Gasto pasa a `pagado='Sí'` | Propietario (confirmación) |
| 4 | Reclamo respondido/estado | Admin actualiza/elimina reclamo | Quien creó el reclamo |
| 5 | Nueva noticia/aviso | Noticia creada | Todos los propietarios |
| 6 | Asamblea próxima | Asamblea creada | Todos los propietarios |
| 7 | Encuesta abierta | Encuesta creada | Todos los propietarios |
| 8 | Quorum alcanzado | Último voto que completa quorum | Admin |

Casos 1-3 requieren el **match email ↔ parcela** (propietario → su parcela), el mismo problema pendiente de la auditoría de seguridad (`propietarios_select` expone PII). Es prerrequisito de los casos personalizados.

## 3. Destino del propietario (match parcela)

Hoy no hay vínculo entre un usuario autenticado y su parcela. Para notificar a la persona correcta se necesita, en orden de robustez:

1. **`propietarios.email` = email del usuario** (ya existe el campo). Confiable pero requiere que el propietario se registre con el mismo email.
2. **`registrado_por` en reclamos** → respuesta al autor.
3. (Futuro) campo `user_id` en `propietarios` vinculado a `auth.users.id`.

## 4. Canales

### 4.1 In-app (v1 recomendado, sin infraestructura)

- Tabla `notificaciones` (destinatario = email de usuario o `todos`):

```sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario TEXT,             -- email usuario, 'todos', o 'admin'
  tipo TEXT NOT NULL,            -- 'cuota', 'reclamo', 'noticia', 'asamblea', 'encuesta'
  mensaje TEXT NOT NULL,
  link TEXT,                     -- pestaña destino (home, finanzas, reclamos...)
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- Badge en el header (`md-badge` sobre el ícono `notifications` en el menú de usuario) con el conteo de no leídas.
- Lista de notificaciones en el menú de usuario, marcado de leída al abrir.
- Se insertan desde JS en los mismos puntos donde ya hay escritura (`handleForm`, etc.).
- Funciona 100% con Supabase + RLS sin email, y en demo con memoria.

### 4.2 Email (requiere infraestructura)

Opciones (todas dependen de configuración fuera del frontend estático):

| Opción | Cómo | Pros | Contras |
|--------|------|------|---------|
| Supabase Auth custom SMTP | Settings → Auth → SMTP + templates | Nativo, sin costo adicional | Solo cubre emails transaccionales de auth (confirmación, reset), no emails arbitrarios del sistema |
| Edge Function + Resend/SendGrid | Edge Function invocada vía cron (pg_cron) o tras insert | Emails arbitrarios | Requiere API key externa + deploy Edge Function |
| Supabase Email Integrations / `pg_net` + webhook | Webhook a provider de email | Todo en Supabase | Configuración avanzada |

**Recomendado cuando se implemente**: Edge Function + Resend (o SendGrid) disparada por un cron mensual de recordatorio de cuotas + eventos (asambleas/encuestas). Los casos 1, 3 y 4 (acción del usuario) se pueden enviar en el momento vía Edge Function `invoke` desde el frontend.

### 4.3 Push (fuera de scope)

Requiere service worker + Firebase/Web Push. GitHub Pages lo soporta, pero es un proyecto aparte. No recomendado en esta fase.

## 5. Preferencias

Futuro: campo por usuario (`preferencias_notificaciones` en una tabla `perfil_usuario` o en `user_metadata`) para opt-in/opt-out por caso de uso.

## 6. Plan de implementación (cuando corresponda)

1. **Fase A (in-app)**: tabla `notificaciones` + badge + lista en menú. Prerrequisito: match email↔parcela (fix de seguridad de `propietarios_select`).
2. **Fase B (email)**: Edge Function con Resend + cron para recordatorios masivos (casos 2, 5, 6, 7) e invocación inmediata para acciones individuales (casos 1, 3, 4).
3. **Fase C**: preferencias y plantillas en español.

## 7. RLS

```sql
-- notificaciones: el propietario ve solo las suyas; admin ve todas
CREATE POLICY "notificaciones_select" ON notificaciones
  FOR SELECT TO authenticated
  USING (
    destinatario = auth.jwt() ->> 'email'
    OR destinatario = 'todos'
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "notificaciones_insert" ON notificaciones
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notificaciones_update" ON notificaciones
  FOR UPDATE TO authenticated
  USING (destinatario = auth.jwt() ->> 'email' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 8. Dependencias

- **Match email↔parcela**: resuelto por el fix de auditoría de seguridad (`propietarios_select` restringido + join por email).
- **Email**: Edge Function + provider SMTP (Resend/SendGrid) — no disponible hoy.
- **Demo**: `notificaciones` en memoria, badge y lista funcionan igual.
