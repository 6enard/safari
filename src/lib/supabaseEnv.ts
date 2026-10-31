const FALLBACK_URL = 'https://cpwteybqwsdwwfnkbkcd.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwd3RleWJxd3Nkd3dmbmtia2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MTY2MTYsImV4cCI6MjEwODk5MjYxNn0.oloWIm6XEz8kfLPHbwPeaFed6mbQeNAfpjt4L0mKFkE';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;
