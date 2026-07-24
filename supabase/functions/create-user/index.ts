import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { email, nombre_completo, rut, telefono, tipo, parcela_id } = await req.json()
  if (!email || !nombre_completo || !rut) {
    return new Response(JSON.stringify({ error: 'Email, nombre y rut son requeridos' }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const password = rut.replace(/[\.\-]/g, '')

  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users.find(u => u.email === email)
  if (existing) {
    return new Response(JSON.stringify({ error: 'El email ya está registrado como usuario' }), { status: 409 })
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre_completo, tipo, parcela_id },
  })
  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), { status: 400 })
  }

  const { data: propData, error: propError } = await supabase
    .from('propietarios')
    .insert({ email, nombre_completo, rut, telefono, tipo, parcela_id })
    .select()
  if (propError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return new Response(JSON.stringify({ error: propError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ data: propData[0] }), { status: 200 })
})