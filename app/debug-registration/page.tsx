"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { registerVehicle } from "@/app/actions/register-vehicle"

export default function DebugRegistrationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData(e.currentTarget)

      // Log what we're sending
      console.log("=== CLIENT SIDE DEBUG ===")
      console.log("FormData entries:")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
        } else {
          console.log(`${key}: ${value}`)
        }
      }

      const result = await registerVehicle(formData)
      setResult(result)
      console.log("Registration result:", result)
    } catch (error) {
      console.error("Client error:", error)
      setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#3A403D]">Debug Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Full Name:</label>
                <Input name="full_name" defaultValue="Test User" required />
              </div>

              <div>
                <label>Email:</label>
                <Input name="email" type="email" defaultValue="test@example.com" required />
              </div>

              <div>
                <label>City:</label>
                <Input name="city" defaultValue="Test City" required />
              </div>

              <div>
                <label>State:</label>
                <Input name="state" defaultValue="TS" required />
              </div>

              <div>
                <label>Make:</label>
                <Input name="make" defaultValue="Test" required />
              </div>

              <div>
                <label>Model:</label>
                <Input name="model" defaultValue="Car" required />
              </div>

              <div>
                <label>Year:</label>
                <Input name="year" type="number" defaultValue="2020" required />
              </div>

              <div>
                <label>Photo 1:</label>
                <Input name="photo_0" type="file" accept="image/*" required />
              </div>

              <div>
                <label>Photo 2 (optional):</label>
                <Input name="photo_1" type="file" accept="image/*" />
              </div>

              <Button type="submit" disabled={loading} className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                {loading ? "Testing..." : "Test Registration"}
              </Button>
            </form>

            {result && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Result:</h3>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
