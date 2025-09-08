import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("=== BLOB STORAGE TEST ===")

  // Check environment variables
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  console.log("BLOB_READ_WRITE_TOKEN exists:", !!blobToken)
  console.log("BLOB_READ_WRITE_TOKEN length:", blobToken?.length || 0)
  console.log("BLOB_READ_WRITE_TOKEN starts with:", blobToken?.substring(0, 20) + "...")

  // List all environment variables that start with BLOB
  const blobEnvVars = Object.keys(process.env).filter((key) => key.startsWith("BLOB"))
  console.log("Available BLOB environment variables:", blobEnvVars)

  // List all environment variables for debugging
  console.log("All environment variables:", Object.keys(process.env).sort())

  return NextResponse.json({
    blobTokenExists: !!blobToken,
    blobTokenLength: blobToken?.length || 0,
    blobEnvVars,
    message: blobToken ? "Blob storage is configured" : "Blob storage is NOT configured",
  })
}
