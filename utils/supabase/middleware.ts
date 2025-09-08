import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const updateSession = async (request: NextRequest) => {
  console.log("[v0] Middleware: Processing request for", request.nextUrl.pathname)

  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  if (request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin/login")) {
    console.log("[v0] Middleware: Checking auth for admin route")
    console.log(
      "[v0] Middleware: Available cookies:",
      request.cookies.getAll().map((c) => c.name),
    )

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      console.log(
        "[v0] Middleware: Auth check result - User:",
        user?.email || "none",
        "Error:",
        error?.message || "none",
      )

      if (error || !user) {
        console.log("[v0] Middleware: No user found, redirecting to login")
        const url = request.nextUrl.clone()
        url.pathname = "/admin/login"
        return NextResponse.redirect(url)
      }

      console.log("[v0] Middleware: User authenticated, allowing access")
    } catch (error) {
      console.error("[v0] Middleware: Auth check failed:", error)
      const url = request.nextUrl.clone()
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
