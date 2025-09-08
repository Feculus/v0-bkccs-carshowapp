import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const createClient = () => {
  if (supabaseUrl === "https://placeholder.supabase.co" || supabaseKey === "placeholder-key") {
    console.warn(
      "Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
