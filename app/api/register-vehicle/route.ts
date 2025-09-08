import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

interface VehicleRegistrationData {
  full_name: string
  email: string
  phone?: string
  city: string
  state: string
  make: string
  model: string
  year: number
  category_id?: number
  description?: string
  photo_urls: string[]
}

function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "").substring(0, 255)
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

function validateYear(year: number): boolean {
  const currentYear = new Date().getFullYear()
  return year >= 1900 && year <= currentYear + 1
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("=== VEHICLE REGISTRATION API START ===")

    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    console.log("Request from IP:", clientIP)

    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is missing")
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing")
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 500 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is missing")
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 500 })
    }

    // Create Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    console.log("Checking current registration count...")
    const { count, error: countError } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (countError) {
      console.error("Error checking registration count:", countError)
      return NextResponse.json(
        { success: false, error: "Unable to process registration at this time" },
        { status: 500 },
      )
    }

    console.log(`Current active registration count: ${count}`)

    if (count !== null && count >= 50) {
      console.log("Registration limit reached - rejecting new registration")
      return NextResponse.json(
        {
          success: false,
          error:
            "Registration is now closed. We have reached the maximum of 50 vehicle entries for the 2025 CRUISERFEST Show-N-Shine.",
          registrationClosed: true,
        },
        { status: 400 },
      )
    }

    // Parse JSON data instead of FormData
    const rawData = await request.json()

    const vehicleData: VehicleRegistrationData = {
      full_name: sanitizeString(rawData.full_name || ""),
      email: sanitizeString(rawData.email || ""),
      phone: rawData.phone ? sanitizeString(rawData.phone) : undefined,
      city: sanitizeString(rawData.city || ""),
      state: sanitizeString(rawData.state || ""),
      make: sanitizeString(rawData.make || ""),
      model: sanitizeString(rawData.model || ""),
      year: Number.parseInt(rawData.year) || 0,
      category_id: rawData.category_id ? Number.parseInt(rawData.category_id) : undefined,
      description: rawData.description ? sanitizeString(rawData.description) : undefined,
      photo_urls: Array.isArray(rawData.photo_urls) ? rawData.photo_urls.slice(0, 5) : [],
    }

    console.log("Parsed vehicle data:", vehicleData)

    // Enhanced validation
    if (
      !vehicleData.full_name ||
      !vehicleData.email ||
      !vehicleData.city ||
      !vehicleData.state ||
      !vehicleData.make ||
      !vehicleData.model ||
      !vehicleData.year
    ) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!validateEmail(vehicleData.email)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 })
    }

    if (!validateYear(vehicleData.year)) {
      return NextResponse.json({ success: false, error: "Invalid year" }, { status: 400 })
    }

    if (vehicleData.full_name.length < 2 || vehicleData.full_name.length > 100) {
      return NextResponse.json({ success: false, error: "Name must be between 2 and 100 characters" }, { status: 400 })
    }

    // Validate photo URLs
    if (!vehicleData.photo_urls || vehicleData.photo_urls.length === 0) {
      return NextResponse.json({ success: false, error: "At least one photo is required" }, { status: 400 })
    }

    if (vehicleData.photo_urls.length > 5) {
      return NextResponse.json({ success: false, error: "Maximum 5 photos allowed" }, { status: 400 })
    }

    for (const url of vehicleData.photo_urls) {
      if (!url.includes("blob.vercel-storage.com") && !url.includes("public.blob.vercel-storage.com")) {
        return NextResponse.json({ success: false, error: "Invalid photo URL" }, { status: 400 })
      }
    }

    console.log(`Total photo URLs received: ${vehicleData.photo_urls.length}`)

    // Generate unique entry number and profile URL
    const entryNumber = Math.floor(Math.random() * 9000) + 1000
    const profileUrl = `${vehicleData.make}-${vehicleData.model}-${entryNumber}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")

    console.log(`Generated entry number: ${entryNumber}, profile URL: ${profileUrl}`)

    // Test database connection
    console.log("Testing database connection...")
    const { data: testData, error: testError } = await supabase
      .from("vehicles")
      .select("count", { count: "exact", head: true })

    if (testError) {
      console.error("Database connection test failed:", testError)
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 500 })
    }

    console.log("Database connection successful")

    // Prepare vehicle data for insertion
    const vehicleInsertData = {
      entry_number: entryNumber,
      full_name: vehicleData.full_name,
      email: vehicleData.email,
      phone: vehicleData.phone || null,
      city: vehicleData.city,
      state: vehicleData.state,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      category_id: 25,
      description: vehicleData.description || null,
      photos: vehicleData.photo_urls,
      profile_url: profileUrl,
      // Set individual image URL columns
      image_1_url: vehicleData.photo_urls[0] || null,
      image_2_url: vehicleData.photo_urls[1] || null,
      image_3_url: vehicleData.photo_urls[2] || null,
      image_4_url: vehicleData.photo_urls[3] || null,
      image_5_url: vehicleData.photo_urls[4] || null,
    }

    console.log("Inserting vehicle record with data:", vehicleInsertData)

    // Insert vehicle record with all data at once
    const { data: vehicleData_db, error: vehicleError } = await supabase
      .from("vehicles")
      .insert(vehicleInsertData)
      .select()
      .single()

    if (vehicleError) {
      console.error("Vehicle creation error:", vehicleError)
      return NextResponse.json({ success: false, error: "Unable to complete registration" }, { status: 500 })
    }

    if (!vehicleData_db) {
      console.error("No vehicle data returned after insert")
      return NextResponse.json({ success: false, error: "Unable to complete registration" }, { status: 500 })
    }

    console.log(`Vehicle record created successfully with ID: ${vehicleData_db.id}`)
    console.log("=== REGISTRATION COMPLETED SUCCESSFULLY ===")

    return NextResponse.json({ success: true, vehicleId: vehicleData_db.id })
  } catch (error) {
    console.error("FATAL ERROR in registration:", error)

    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Registration failed. Please try again." }, { status: 500 })
  }
}
