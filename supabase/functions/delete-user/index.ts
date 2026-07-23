import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { email, propietario_id } = await req.json()
  if (!email && !propietario_id) {
    return new Response(JSON.stringify({ error: 'Email o propietario_id requerido' }), { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  if (email) {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) return new Response(JSON.stringify({ error: listError.message }), { status: 500 })

    const user = users?.users.find(function(u) { return u.email === email })
    if (user) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteError) return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
    }
  }

  if (propietario_id) {
    await supabaseAdmin.from('propietarios').delete().eq('id', propietario_id)
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
