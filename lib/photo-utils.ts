import { put, del } from "@vercel/blob"

export interface PhotoUploadResult {
  success: boolean
  url?: string
  error?: string
}

export async function uploadVehiclePhotoToBlob(
  file: File,
  vehicleId: number,
  photoIndex: number,
): Promise<PhotoUploadResult> {
  try {
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "File size must be less than 5MB" }
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Only JPEG, PNG, and WebP images are allowed" }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    const fileName = `vehicle-${vehicleId}-${photoIndex}-${Date.now()}.${fileExt}`

    // Upload to Vercel Blob with your specific token
    const blob = await put(`vehicle-photos/${fileName}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return { success: true, url: blob.url }
  } catch (error) {
    console.error("Photo upload error:", error)
    return { success: false, error: "Upload failed" }
  }
}

export async function deleteVehiclePhotoFromBlob(photoUrl: string): Promise<boolean> {
  try {
    await del(photoUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return true
  } catch (error) {
    console.error("Error deleting photo:", error)
    return false
  }
}

export function getOptimizedPhotoUrl(originalUrl: string, width?: number, height?: number): string {
  // Vercel Blob doesn't have built-in image optimization
  // You could use Vercel's Image Optimization API or a service like Cloudinary
  return originalUrl
}

export async function uploadMultiplePhotos(files: File[], vehicleId: number): Promise<string[]> {
  const uploadPromises = files.map((file, index) => uploadVehiclePhotoToBlob(file, vehicleId, index + 1))

  const results = await Promise.all(uploadPromises)

  // Check if any uploads failed
  const failedUploads = results.filter((result) => !result.success)
  if (failedUploads.length > 0) {
    throw new Error(`Failed to upload ${failedUploads.length} photos`)
  }

  return results.map((result) => result.url!).filter(Boolean)
}
