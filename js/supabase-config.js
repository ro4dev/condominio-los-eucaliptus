var SUPABASE_URL = 'https://ebfnusykfvcardunmilq.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZm51c3lrZnZjYXJkdW5taWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTk5NzQsImV4cCI6MjA5OTg5NTk3NH0.r6vvxtNutgkEc9thD4IUucpVzxGLHkE7_ovgoqKMUd8';

var supabaseClient = null;

function initSupabase() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  return false;
}
