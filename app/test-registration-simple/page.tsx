"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { registerVehicle } from "@/app/actions/register-vehicle"

export default function TestRegistrationSimplePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError("")

    try {
      console.log("=== SIMPLE TEST START ===")

      const formData = new FormData(e.currentTarget)

      // Create a simple test image file
      const canvas = document.createElement("canvas")
      canvas.width = 100
      canvas.height = 100
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ff0000"
        ctx.fillRect(0, 0, 100, 100)
      }

      // Convert canvas to blob and then to file
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png")
      })

      const testFile = new File([blob], "test-image.png", { type: "image/png" })
      formData.append("photo_0", testFile)

      console.log("Test FormData entries:")
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
        } else {
          console.log(`${key}: ${value}`)
        }
      }

      console.log("Calling registerVehicle...")
      const result = await registerVehicle(formData)

      console.log("Raw result:", result)
      console.log("Result type:", typeof result)
      console.log("Result keys:", result ? Object.keys(result) : "no keys")

      setResult(result)
    } catch (error) {
      console.error("Test error:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#3A403D]">Simple Registration Test</CardTitle>
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

              <Button type="submit" disabled={loading} className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                {loading ? "Testing..." : "Test Registration (Auto-generates test image)"}
              </Button>
            </form>

            {error && (
              <div className="mt-6 p-4 border border-red-500 rounded-lg bg-red-50">
                <h3 className="font-bold text-red-700 mb-2">Error:</h3>
                <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {result && (
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Result:</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Type:</strong> {typeof result}
                  </p>
                  <p>
                    <strong>Has success property:</strong> {"success" in result ? "Yes" : "No"}
                  </p>
                  {result.success !== undefined && (
                    <p>
                      <strong>Success:</strong> {result.success ? "true" : "false"}
                    </p>
                  )}
                  {result.error && (
                    <p>
                      <strong>Error:</strong> {result.error}
                    </p>
                  )}
                  {result.vehicleId && (
                    <p>
                      <strong>Vehicle ID:</strong> {result.vehicleId}
                    </p>
                  )}
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">Raw Result (JSON)</summary>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto mt-2">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
