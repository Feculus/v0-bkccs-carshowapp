"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload } from "lucide-react"

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError("")
    }
  }

  const testUpload = async () => {
    if (!file) return

    setUploading(true)
    setError("")
    setResult(null)

    try {
      const filename = `test-${Date.now()}.${file.name.split(".").pop()}`

      console.log("Testing upload with:", {
        filename,
        fileSize: file.size,
        fileType: file.type,
      })

      const response = await fetch(`/api/upload?filename=${filename}`, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
          "Content-Length": file.size.toString(),
        },
      })

      console.log("Response status:", response.status)

      const responseText = await response.text()
      console.log("Response text:", responseText)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${responseText}`)
      }

      const result = JSON.parse(responseText)
      setResult(result)
      console.log("Upload successful:", result)
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setUploading(false)
    }
  }

  const checkEnvironment = async () => {
    try {
      const response = await fetch("/api/check-env")
      const data = await response.json()
      console.log("Environment check:", data)
    } catch (err) {
      console.error("Environment check failed:", err)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#3A403D]">Test Blob Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="border-[#3A403D]/20 focus:border-[#BF6849]"
              />
            </div>

            {file && (
              <div className="p-4 bg-[#F2EEEB] rounded-lg">
                <p>
                  <strong>File:</strong> {file.name}
                </p>
                <p>
                  <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p>
                  <strong>Type:</strong> {file.type}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                onClick={testUpload}
                disabled={!file || uploading}
                className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Test Upload"}
              </Button>

              <Button onClick={checkEnvironment} variant="outline">
                Check Environment
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">
                  <strong>Error:</strong>
                </p>
                <pre className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{error}</pre>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
