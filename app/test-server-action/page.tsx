"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload } from "lucide-react"
import { testBlobUpload } from "@/app/actions/test-upload"

export default function TestServerActionPage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await testBlobUpload(formData)

      if (result.success) {
        setResult(result)
      } else {
        setError(result.error || "Upload failed")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#3A403D]">Test Server Action Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  name="file"
                  type="file"
                  accept="image/*"
                  required
                  className="border-[#3A403D]/20 focus:border-[#BF6849]"
                />
              </div>

              <Button type="submit" disabled={uploading} className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Test Server Action Upload"}
              </Button>
            </form>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-6">
                <p className="text-red-700">
                  <strong>Error:</strong>
                </p>
                <pre className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-6">
                <p className="text-green-700">
                  <strong>Success!</strong>
                </p>
                <pre className="text-sm text-green-600 mt-2 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                {result.url && (
                  <div className="mt-4">
                    <p className="text-green-700 mb-2">
                      <strong>Uploaded Image:</strong>
                    </p>
                    <img
                      src={result.url || "/placeholder.svg"}
                      alt="Uploaded test"
                      className="max-w-full h-auto rounded-lg border"
                      style={{ maxHeight: "300px" }}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
