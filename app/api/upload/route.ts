import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename")

  console.log("=== UPLOAD API DEBUG ===")
  console.log("Upload API called with filename:", filename)

  if (!filename) {
    console.error("No filename provided")
    return NextResponse.json({ error: "Filename is required" }, { status: 400 })
  }

  // Sanitize filename to prevent path traversal attacks
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 100)
  if (sanitizedFilename !== filename) {
    console.error("Invalid filename provided:", filename)
    return NextResponse.json({ error: "Invalid filename format" }, { status: 400 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set")
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 })
  }

  try {
    // Get the file as a blob from the request
    const fileBlob = await request.blob()

    if (!fileBlob || fileBlob.size === 0) {
      console.error("No file data received")
      return NextResponse.json({ error: "No file data received" }, { status: 400 })
    }

    const maxFileSize = 10 * 1024 * 1024 // 10MB limit
    if (fileBlob.size > maxFileSize) {
      console.error("File too large:", fileBlob.size)
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(fileBlob.type)) {
      console.error("Invalid file type:", fileBlob.type)
      return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 })
    }

    console.log(`Processing upload: ${sanitizedFilename}`)
    console.log(`File size: ${fileBlob.size} bytes`)
    console.log(`File type: ${fileBlob.type}`)

    // Upload to Vercel Blob with organized folder structure and specific token
    console.log("Attempting blob upload...")
    const blob = await put(`vehicle-photos/${sanitizedFilename}`, fileBlob, {
      access: "public",
      addRandomSuffix: true, // Enable random suffix to prevent filename conflicts
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    console.log(`Upload successful:`, {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      downloadUrl: blob.downloadUrl,
    })
  } catch (error) {
    console.error("Upload error:", error)

    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
