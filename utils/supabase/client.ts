import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const isSupabaseConfigured = () => {
  return supabaseUrl !== "https://placeholder.supabase.co" && supabaseKey !== "placeholder-key"
}

export const createClient = () => {
  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )
    return {
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
            order: (column: string, options?: any) => ({
              limit: (count: number) => Promise.resolve({ data: [], error: new Error("Supabase not configured") }),
            }),
            neq: (column: string, value: any) => ({
              order: (column: string, options?: any) => ({
                limit: (count: number) => Promise.resolve({ data: [], error: new Error("Supabase not configured") }),
              }),
            }),
          }),
          neq: (column: string, value: any) => ({
            order: (column: string, options?: any) => ({
              limit: (count: number) => Promise.resolve({ data: [], error: new Error("Supabase not configured") }),
            }),
          }),
          order: (column: string, options?: any) => ({
            limit: (count: number) => Promise.resolve({ data: [], error: new Error("Supabase not configured") }),
          }),
        }),
        update: (data: any) => ({
          eq: (column: string, value: any) =>
            Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        }),
        insert: (data: any) => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        delete: () => ({
          eq: (column: string, value: any) =>
            Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error("Supabase not configured") }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signUp: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        signOut: () => Promise.resolve({ error: new Error("Supabase not configured") }),
      },
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
