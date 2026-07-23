import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { email, nombre_completo, rut, telefono, tipo, parcela_id } = await req.json()
  if (!email || !nombre_completo) {
    return new Response(JSON.stringify({ error: 'Email y nombre son requeridos' }), { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let user

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { nombre_completo, tipo, parcela_id },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      user = users?.find(function(u) { return u.email === email })
      if (!user) {
        return new Response(JSON.stringify({ error: 'Usuario no encontrado en Auth' }), { status: 500 })
      }
    } else {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400 })
    }
  } else {
    user = authData.user
  }

  const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  if (inviteError) {
    if (!authData) await supabaseAdmin.auth.admin.deleteUser(user.id)
    return new Response(JSON.stringify({ error: inviteError.message }), { status: 500 })
  }

  const { data: propData, error: propError } = await supabaseAdmin
    .from('propietarios')
    .insert({ email, nombre_completo, rut, telefono, tipo, parcela_id })
    .select()

  if (propError) {
    return new Response(JSON.stringify({ error: propError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ data: propData[0] }), { status: 200 })
})
