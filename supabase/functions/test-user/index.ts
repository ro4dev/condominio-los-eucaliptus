import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { email } = await req.json()
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const res = await fetch(url + '/auth/v1/admin/users', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'apikey': key },
    body: JSON.stringify({ email, email_confirm: true }),
  })
  const data = await res.json()
  return new Response(JSON.stringify({ status: res.status, data }), { status: res.ok ? 200 : 400 })
})
