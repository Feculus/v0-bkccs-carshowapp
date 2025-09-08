"use server"

import { put, del } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

export async function updateVehiclePhotos(vehicleId: number, formData: FormData) {
  try {
    console.log("[v0] Starting photo update for vehicle:", vehicleId)

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: "Database configuration error" }
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return { success: false, error: "Storage configuration error" }
    }

    // Create Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get current vehicle data
    const { data: currentVehicle, error: fetchError } = await supabase
      .from("vehicles")
      .select("photos, image_1_url, image_2_url, image_3_url, image_4_url, image_5_url")
      .eq("id", vehicleId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching vehicle:", fetchError)
      return { success: false, error: "Failed to fetch vehicle data" }
    }

    // Get existing photos to keep
    const existingPhotos: string[] = []
    for (let i = 0; i < 5; i++) {
      const keepPhoto = formData.get(`keep_photo_${i}`)
      if (keepPhoto === "true") {
        const photoUrl = currentVehicle.photos?.[i]
        if (photoUrl) {
          existingPhotos.push(photoUrl)
        }
      }
    }

    console.log("[v0] Keeping existing photos:", existingPhotos)

    // Get new files to upload
    const newFiles: File[] = []
    let fileIndex = 0
    while (formData.get(`new_photo_${fileIndex}`)) {
      const file = formData.get(`new_photo_${fileIndex}`) as File
      if (file && file.size > 0) {
        newFiles.push(file)
      }
      fileIndex++
    }

    console.log("[v0] New files to upload:", newFiles.length)

    // Validate total photos don't exceed 5
    if (existingPhotos.length + newFiles.length > 5) {
      return { success: false, error: "Maximum 5 photos allowed" }
    }

    // Validate new files
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    for (const file of newFiles) {
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: `File "${file.name}" is not a supported image type` }
      }
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: `File "${file.name}" is too large. Maximum size is 5MB` }
      }
    }

    // Upload new photos
    const newPhotoUrls: string[] = []
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      try {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `vehicle-${vehicleId}-${existingPhotos.length + i + 1}-${Date.now()}.${fileExt}`

        const blob = await put(`vehicle-photos/${fileName}`, file, {
          access: "public",
          addRandomSuffix: false,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })

        newPhotoUrls.push(blob.url)
        console.log("[v0] Uploaded new photo:", blob.url)
      } catch (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        return { success: false, error: `Failed to upload photo: ${file.name}` }
      }
    }

    // Combine existing and new photos
    const allPhotos = [...existingPhotos, ...newPhotoUrls]
    console.log("[v0] Final photo array:", allPhotos)

    // Delete photos that are no longer needed
    const photosToDelete = currentVehicle.photos?.filter((url: string) => !allPhotos.includes(url)) || []
    for (const photoUrl of photosToDelete) {
      try {
        await del(photoUrl, { token: process.env.BLOB_READ_WRITE_TOKEN })
        console.log("[v0] Deleted photo:", photoUrl)
      } catch (deleteError) {
        console.error("[v0] Error deleting photo:", deleteError)
        // Continue even if delete fails
      }
    }

    // Update vehicle record
    const updateData: any = {
      photos: allPhotos,
      image_1_url: allPhotos[0] || null,
      image_2_url: allPhotos[1] || null,
      image_3_url: allPhotos[2] || null,
      image_4_url: allPhotos[3] || null,
      image_5_url: allPhotos[4] || null,
    }

    const { error: updateError } = await supabase.from("vehicles").update(updateData).eq("id", vehicleId)

    if (updateError) {
      console.error("[v0] Update error:", updateError)
      return { success: false, error: "Failed to update vehicle photos" }
    }

    console.log("[v0] Photo update completed successfully")
    return { success: true, photos: allPhotos }
  } catch (error) {
    console.error("[v0] Fatal error in photo update:", error)
    return { success: false, error: "Photo update failed" }
  }
}
