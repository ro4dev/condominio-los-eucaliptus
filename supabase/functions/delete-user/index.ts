import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { propietario_id } = await req.json()
  if (!propietario_id) {
    return new Response(JSON.stringify({ error: 'propietario_id requerido' }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: prop, error: propError } = await supabase
    .from('propietarios')
    .delete()
    .eq('id', propietario_id)
    .select()
  if (propError) {
    return new Response(JSON.stringify({ error: propError.message }), { status: 500 })
  }
  if (!prop?.length) {
    return new Response(JSON.stringify({ error: 'Propietario no encontrado' }), { status: 404 })
  }

  const email = prop[0].email

  const { data: users } = await supabase.auth.admin.listUsers()
  const user = users?.users.find(u => u.email === email)
  if (user) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})