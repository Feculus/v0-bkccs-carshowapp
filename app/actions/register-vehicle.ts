"use server"

import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

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
}

export async function registerVehicle(formData: FormData) {
  try {
    console.log("=== VEHICLE REGISTRATION SERVER ACTION START ===")
    console.log("FormData entries:")
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
      } else {
        console.log(`${key}: ${value}`)
      }
    }

    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is missing")
      return { success: false, error: "Database configuration error: Missing Supabase URL" }
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing")
      return { success: false, error: "Database configuration error: Missing service role key" }
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is missing")
      return { success: false, error: "Storage configuration error: Missing blob token" }
    }

    // Extract form data
    const vehicleData: VehicleRegistrationData = {
      full_name: formData.get("full_name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      make: formData.get("make") as string,
      model: formData.get("model") as string,
      year: Number.parseInt(formData.get("year") as string),
      category_id: formData.get("category_id") ? Number.parseInt(formData.get("category_id") as string) : undefined,
      description: (formData.get("description") as string) || undefined,
    }

    console.log("Parsed vehicle data:", vehicleData)

    // Validate required fields
    if (
      !vehicleData.full_name ||
      !vehicleData.email ||
      !vehicleData.city ||
      !vehicleData.state ||
      !vehicleData.make ||
      !vehicleData.model ||
      !vehicleData.year
    ) {
      return { success: false, error: "Missing required fields" }
    }

    // Get uploaded files
    const files: File[] = []
    let fileIndex = 0
    while (formData.get(`photo_${fileIndex}`)) {
      const file = formData.get(`photo_${fileIndex}`) as File
      if (file && file.size > 0) {
        console.log(`Found photo_${fileIndex}: ${file.name} (${file.size} bytes, ${file.type})`)
        files.push(file)
      }
      fileIndex++
    }

    console.log(`Total files found: ${files.length}`)

    if (files.length === 0) {
      console.log("ERROR: No files found in FormData")
      return { success: false, error: "At least one photo is required" }
    }

    if (files.length > 5) {
      return { success: false, error: "Maximum 5 photos allowed" }
    }

    // Validate files
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: `File "${file.name}" is not a supported image type` }
      }
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: `File "${file.name}" is too large. Maximum size is 5MB` }
      }
    }

    // Generate unique entry number and profile URL
    const entryNumber = Math.floor(Math.random() * 9000) + 1000
    const profileUrl = `${vehicleData.make}-${vehicleData.model}-${entryNumber}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")

    console.log(`Generated entry number: ${entryNumber}, profile URL: ${profileUrl}`)

    // Create Supabase client directly with service role key for server actions
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Test database connection
    console.log("Testing database connection...")
    const { data: testData, error: testError } = await supabase
      .from("vehicles")
      .select("count", { count: "exact", head: true })

    if (testError) {
      console.error("Database connection test failed:", testError)
      return { success: false, error: `Database connection failed: ${testError.message}` }
    }

    console.log("Database connection successful")

    // Insert vehicle record
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
      // Automatically set category_id to 25 for all registrations
      category_id: 25,
      description: vehicleData.description || null,
      photos: [], // Initialize as empty array
      profile_url: profileUrl,
    }

    console.log("Inserting vehicle record with data:", vehicleInsertData)
    const { data: vehicleData_db, error: vehicleError } = await supabase
      .from("vehicles")
      .insert(vehicleInsertData)
      .select()
      .single()

    if (vehicleError) {
      console.error("Vehicle creation error:", vehicleError)
      return { success: false, error: `Failed to create vehicle record: ${vehicleError.message}` }
    }

    if (!vehicleData_db) {
      console.error("No vehicle data returned after insert")
      return { success: false, error: "Failed to create vehicle record: No data returned" }
    }

    console.log(`Vehicle record created successfully with ID: ${vehicleData_db.id}`)

    // Upload photos to Vercel Blob
    const photoUrls: string[] = []

    console.log("Starting photo uploads...")
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`\n--- Uploading photo ${i + 1}/${files.length} ---`)
      console.log(`File: ${file.name}`)
      console.log(`Size: ${file.size} bytes`)
      console.log(`Type: ${file.type}`)

      try {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `vehicle-${vehicleData_db.id}-${i + 1}-${Date.now()}.${fileExt}`
        console.log(`Generated filename: ${fileName}`)

        console.log("Calling put() with:")
        console.log(`- Path: vehicle-photos/${fileName}`)
        console.log(`- File size: ${file.size}`)
        console.log(`- Access: public`)
        console.log(`- Token length: ${process.env.BLOB_READ_WRITE_TOKEN?.length}`)

        const blob = await put(`vehicle-photos/${fileName}`, file, {
          access: "public",
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        console.log(`Upload successful for photo ${i + 1}:`)
        console.log(`- URL: ${blob.url}`)
        console.log(`- Pathname: ${blob.pathname}`)
        console.log(`- Size: ${blob.size}`)

        photoUrls.push(blob.url)
      } catch (uploadError) {
        console.error(`ERROR uploading photo ${i + 1}:`, uploadError)
        console.error("Upload error details:", {
          message: uploadError instanceof Error ? uploadError.message : "Unknown",
          stack: uploadError instanceof Error ? uploadError.stack : undefined,
        })

        // Clean up vehicle record and any uploaded photos
        await supabase.from("vehicles").delete().eq("id", vehicleData_db.id)
        return {
          success: false,
          error: `Failed to upload photo ${i + 1}: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
        }
      }
    }

    console.log(`\n=== ALL UPLOADS COMPLETE ===`)
    console.log(`Total photos uploaded: ${photoUrls.length}`)
    console.log(`Photo URLs:`, photoUrls)

    if (photoUrls.length === 0) {
      console.error("ERROR: No photo URLs generated despite successful uploads")
      await supabase.from("vehicles").delete().eq("id", vehicleData_db.id)
      return { success: false, error: "Photo upload failed - no URLs generated" }
    }

    // Update vehicle record with photo URLs
    const updateData: any = {
      photos: photoUrls,
    }

    // Set individual image URL columns
    if (photoUrls.length >= 1) {
      updateData.image_1_url = photoUrls[0]
      console.log(`Setting image_1_url: ${photoUrls[0]}`)
    }
    if (photoUrls.length >= 2) {
      updateData.image_2_url = photoUrls[1]
      console.log(`Setting image_2_url: ${photoUrls[1]}`)
    }
    if (photoUrls.length >= 3) {
      updateData.image_3_url = photoUrls[2]
      console.log(`Setting image_3_url: ${photoUrls[2]}`)
    }
    if (photoUrls.length >= 4) {
      updateData.image_4_url = photoUrls[3]
      console.log(`Setting image_4_url: ${photoUrls[3]}`)
    }
    if (photoUrls.length >= 5) {
      updateData.image_5_url = photoUrls[4]
      console.log(`Setting image_5_url: ${photoUrls[4]}`)
    }

    console.log("Final update data:", updateData)

    console.log("Updating vehicle record...")
    const { data: updateResult, error: updateError } = await supabase
      .from("vehicles")
      .update(updateData)
      .eq("id", vehicleData_db.id)
      .select()

    if (updateError) {
      console.error("Update error:", updateError)
      return { success: false, error: `Failed to update vehicle with photos: ${updateError.message}` }
    }

    console.log("Vehicle update completed successfully!")
    console.log("Update result:", updateResult)

    // Verify the update
    console.log("Verifying update...")
    const { data: updatedVehicle, error: fetchError } = await supabase
      .from("vehicles")
      .select("id, entry_number, photos, image_1_url, image_2_url, image_3_url, image_4_url, image_5_url")
      .eq("id", vehicleData_db.id)
      .single()

    if (fetchError) {
      console.error("Verification fetch error:", fetchError)
    } else {
      console.log("VERIFICATION - Updated vehicle data:", updatedVehicle)
    }

    console.log("=== REGISTRATION COMPLETED SUCCESSFULLY ===")

    return { success: true, vehicleId: vehicleData_db.id }
  } catch (error) {
    console.error("FATAL ERROR in registration:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return {
      success: false,
      error: `Registration failed: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
    }
  }
}
