import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
    tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) + "..." || "Not found",
    nodeEnv: process.env.NODE_ENV,
  })
}
