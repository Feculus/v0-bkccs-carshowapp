"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

const supabase = createClient()

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("[v0] Starting admin login process...")

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        console.log("[v0] Login successful, user:", data.user.email)
        console.log("[v0] Current URL before redirect:", window.location.href)
        console.log("[v0] Redirecting to /admin...")

        router.push("/admin")
        console.log("[v0] router.push('/admin') called")

        // Add a small delay and check if redirect worked
        setTimeout(() => {
          console.log("[v0] URL after router.push:", window.location.href)
          if (!window.location.pathname.includes("/admin")) {
            console.log("[v0] Router.push failed, trying window.location.href")
            window.location.href = "/admin"
          }
        }, 100)

        // Also try router.replace as backup
        setTimeout(() => {
          console.log("[v0] Final URL check:", window.location.href)
          if (!window.location.pathname.includes("/admin")) {
            console.log("[v0] All redirects failed, forcing navigation")
            router.replace("/admin")
          }
        }, 500)
      }
    } catch (error: any) {
      console.log("[v0] Login error:", error.message)
      setError(error.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center py-8">
      <div className="max-w-md w-full px-4">
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-[#3A403D]">Admin Login</CardTitle>
            <CardDescription className="text-[#3A403D]/60">
              Sign in to access the CRUISERFEST Show-N-Shine admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#3A403D]/20 focus:border-[#BF6849]"
                  placeholder="admin@autoshow.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-[#3A403D]/20 focus:border-[#BF6849] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A403D]/60 hover:text-[#3A403D] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
