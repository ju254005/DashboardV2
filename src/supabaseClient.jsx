import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ohhpnmfojehffncwneck.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oaHBubWZvamVoZmZuY3duZWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODk4NDYsImV4cCI6MjA3MzY2NTg0Nn0.F4NOCkIH-kcDs_DM3AUAqJCNRUzosVUJcLw6pY4NSdQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
