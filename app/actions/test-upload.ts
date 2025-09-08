"use server"

import { put } from "@vercel/blob"

export async function testBlobUpload(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    console.log("Server action - testing blob upload")
    console.log("File:", file.name, file.size, file.type)
    console.log("BLOB_READ_WRITE_TOKEN exists:", !!process.env.BLOB_READ_WRITE_TOKEN)
    console.log("BLOB_READ_WRITE_TOKEN length:", process.env.BLOB_READ_WRITE_TOKEN?.length || 0)

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return { success: false, error: "BLOB_READ_WRITE_TOKEN not found in environment" }
    }

    const filename = `test-server-action-${Date.now()}.${file.name.split(".").pop()}`

    const blob = await put(`vehicle-photos/${filename}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log("Upload successful:", blob)

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    }
  } catch (error) {
    console.error("Server action upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
