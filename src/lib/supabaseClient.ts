import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wsdkbwondvovsulfoezv.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZGtid29uZHZvdnN1bGZvZXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjA3MTAsImV4cCI6MjA3OTczNjcxMH0.QOpiH_7mRBWiGwNq4lUZZ227P00aZI5M3TvNdmWf1ZY"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
console.log('Environment:', {
  url: supabaseUrl ? 'URL is set' : 'URL is MISSING',
  key: supabaseAnonKey ? 'Key is set' : 'Key is MISSING'
});
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
