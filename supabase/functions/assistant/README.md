# Secure Groq assistant setup

Deploy the function and save the Groq secret in Supabase - never in a `VITE_*` variable or client-side source file.

```powershell
supabase secrets set GROQ_API_KEY="your-rotated-groq-key"
supabase functions deploy assistant
```

The web app automatically uses this function when `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are configured. Until then, the AI page keeps using
the local Dijkstra route planner as an offline fallback.
