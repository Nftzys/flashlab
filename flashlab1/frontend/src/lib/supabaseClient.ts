import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dagnhaetkalledubxtwn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ25oYWV0a2FsbGVkdWJ4dHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjY5OTksImV4cCI6MjA2NTQwMjk5OX0.jmUP9TxVv0A9IkxmTCNNQ3FDQ6XjYo6j8EBKttrXUoM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
