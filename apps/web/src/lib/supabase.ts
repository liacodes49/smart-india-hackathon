import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ltooatgwthsmevikctgp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b29hdGd3dGhzbWV2aWtjdGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1Njg0ODUsImV4cCI6MjEwNTE0NDQ4NX0.kACyAhT8Gt2MNhOzvlIjQHsjU59qqaLMjvrjM6TLgTs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
