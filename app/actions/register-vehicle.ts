"use server"

import { put } from "@vercel/blob"
import { executeQuery } from "@/utils/neon/server"

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
    const databaseUrl = process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error("Database URL is missing")
      return { success: false, error: "Database configuration error: Missing database URL" }
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

    // Test database connection
    console.log("Testing database connection...")
    const { data: testData, error: testError } = await executeQuery("SELECT 1 as test")

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
    const { data: vehicleData_db, error: vehicleError } = await executeQuery(
      `
      INSERT INTO vehicles (
        owner_name, owner_email, owner_phone,
        vehicle_year, vehicle_make, vehicle_model,
        vehicle_description, photos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [
        vehicleData.full_name,
        vehicleData.email,
        vehicleData.phone || null,
        vehicleData.year,
        vehicleData.make,
        vehicleData.model,
        vehicleData.description || null,
        JSON.stringify([]),
      ],
    )

    if (vehicleError) {
      console.error("Vehicle creation error:", vehicleError)
      return { success: false, error: `Failed to create vehicle record: ${vehicleError.message}` }
    }

    if (!vehicleData_db || vehicleData_db.length === 0) {
      console.error("No vehicle data returned after insert")
      return { success: false, error: "Failed to create vehicle record: No data returned" }
    }

    const vehicleData_db_first = vehicleData_db[0]
    console.log(`Vehicle record created successfully with ID: ${vehicleData_db_first.id}`)

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
        const fileName = `vehicle-${vehicleData_db_first.id}-${i + 1}-${Date.now()}.${fileExt}`
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
        await executeQuery("DELETE FROM vehicles WHERE id = $1", [vehicleData_db_first.id])
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
      await executeQuery("DELETE FROM vehicles WHERE id = $1", [vehicleData_db_first.id])
      return { success: false, error: "Photo upload failed - no URLs generated" }
    }

    // Update vehicle record with photo URLs
    const updateData: any = {
      photos: JSON.stringify(photoUrls),
    }

    // Set individual image URL columns
    if (photoUrls.length >= 1) updateData.image_url_1 = photoUrls[0]
    if (photoUrls.length >= 2) updateData.image_url_2 = photoUrls[1]
    if (photoUrls.length >= 3) updateData.image_url_3 = photoUrls[2]
    if (photoUrls.length >= 4) updateData.image_url_4 = photoUrls[3]
    if (photoUrls.length >= 5) updateData.image_url_5 = photoUrls[4]

    const fields = Object.keys(updateData)
    const values = Object.values(updateData)
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ")

    console.log("Final update data:", updateData)

    console.log("Updating vehicle record...")
    const { data: updateResult, error: updateError } = await executeQuery(
      `
      UPDATE vehicles 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [vehicleData_db_first.id, ...values],
    )

    if (updateError) {
      console.error("Update error:", updateError)
      return { success: false, error: `Failed to update vehicle with photos: ${updateError.message}` }
    }

    console.log("Vehicle update completed successfully!")
    console.log("Update result:", updateResult)

    // Verify the update
    console.log("Verifying update...")
    const { data: updatedVehicle, error: fetchError } = await executeQuery(
      `
      SELECT id, entry_number, photos, image_url_1, image_url_2, image_url_3, image_url_4, image_url_5
      FROM vehicles
      WHERE id = $1
    `,
      [vehicleData_db_first.id],
    )

    if (fetchError) {
      console.error("Verification fetch error:", fetchError)
    } else {
      console.log("VERIFICATION - Updated vehicle data:", updatedVehicle)
    }

    console.log("=== REGISTRATION COMPLETED SUCCESSFULLY ===")

    return { success: true, vehicleId: vehicleData_db_first.id }
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
