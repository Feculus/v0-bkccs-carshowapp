import { executeQuery } from "@/utils/neon/client"
import type { AdminAward } from "@/types/admin-awards"

// Predefined special award categories
export const SPECIAL_AWARD_CATEGORIES = [
  "Most Original",
  "Least Original",
  "Rustiest Relic",
  "XOverland - Spirit of Adventure Award",
  "Best in Show",
]

export async function getAdminAwards(): Promise<AdminAward[]> {
  console.log("[v0] Fetching admin awards...")

  try {
    const data = await executeQuery(`
      SELECT aa.*, 
             v.id as vehicle_id,
             v.entry_number,
             v.vehicle_make as make,
             v.vehicle_model as model,
             v.vehicle_year as year,
             v.full_name,
             v.city,
             v.state,
             v.image_1_url,
             v.photos
      FROM admin_awards aa
      LEFT JOIN vehicles v ON aa.vehicle_id = v.id
      ORDER BY aa.category_name
    `)

    // Create a map of existing awards by category
    const existingAwards = new Map(
      data.map((award: any) => [
        award.category_name,
        {
          ...award,
          vehicle: award.vehicle_id
            ? {
                id: award.vehicle_id,
                entry_number: award.entry_number,
                make: award.make,
                model: award.model,
                year: award.year,
                full_name: award.full_name,
                city: award.city,
                state: award.state,
                image_1_url: award.image_1_url,
                photos: award.photos,
              }
            : null,
        },
      ]),
    )

    // Return all categories, with existing data or empty placeholders
    return SPECIAL_AWARD_CATEGORIES.map((categoryName) => {
      const existing = existingAwards.get(categoryName)
      if (existing) {
        return existing
      }

      // Return placeholder for categories that don't exist yet
      return {
        id: 0,
        category_name: categoryName,
        vehicle_id: null,
        awarded_by: null,
        awarded_at: new Date().toISOString(),
        notes: null,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error("Error fetching admin awards:", error)
    throw new Error(`Failed to fetch admin awards: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getPublishedAdminAwards(): Promise<AdminAward[]> {
  console.log("[v0] Fetching published admin awards...")

  try {
    const data = await executeQuery(`
      SELECT aa.*, 
             v.id as vehicle_id,
             v.entry_number,
             v.vehicle_make as make,
             v.vehicle_model as model,
             v.vehicle_year as year,
             v.full_name,
             v.city,
             v.state,
             v.image_1_url,
             v.photos
      FROM admin_awards aa
      LEFT JOIN vehicles v ON aa.vehicle_id = v.id
      WHERE aa.is_published = true AND aa.vehicle_id IS NOT NULL
      ORDER BY aa.category_name
    `)

    return data.map((award: any) => ({
      ...award,
      vehicle: {
        id: award.vehicle_id,
        entry_number: award.entry_number,
        make: award.make,
        model: award.model,
        year: award.year,
        full_name: award.full_name,
        city: award.city,
        state: award.state,
        image_1_url: award.image_1_url,
        photos: award.photos,
      },
    }))
  } catch (error) {
    console.error("Error fetching published admin awards:", error)
    throw new Error(
      `Failed to fetch published admin awards: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function assignAdminAward(
  categoryName: string,
  vehicleId: number,
  awardedBy: string,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Assigning admin award:", { categoryName, vehicleId, awardedBy })

    const existingAwards = await executeQuery(
      `
      SELECT id FROM admin_awards WHERE category_name = $1
    `,
      [categoryName],
    )

    if (existingAwards.length > 0) {
      // Update existing award
      await executeQuery(
        `
        UPDATE admin_awards 
        SET vehicle_id = $1, awarded_by = $2, awarded_at = $3, notes = $4, 
            is_published = false, updated_at = $5
        WHERE category_name = $6
      `,
        [vehicleId, awardedBy, new Date().toISOString(), notes || null, new Date().toISOString(), categoryName],
      )
    } else {
      // Insert new award
      await executeQuery(
        `
        INSERT INTO admin_awards (category_name, vehicle_id, awarded_by, awarded_at, notes, is_published, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, false, $6, $7)
      `,
        [
          categoryName,
          vehicleId,
          awardedBy,
          new Date().toISOString(),
          notes || null,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      )
    }

    console.log("[v0] Admin award assigned successfully")
    return { success: true }
  } catch (error) {
    console.error("Error assigning admin award:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function publishAdminAward(
  categoryName: string,
  isPublished: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Publishing admin award:", { categoryName, isPublished })

    await executeQuery(
      `
      UPDATE admin_awards 
      SET is_published = $1, updated_at = $2
      WHERE category_name = $3
    `,
      [isPublished, new Date().toISOString(), categoryName],
    )

    console.log("[v0] Admin award publication status updated")
    return { success: true }
  } catch (error) {
    console.error("Error publishing admin award:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function removeAdminAward(categoryName: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Removing admin award:", { categoryName })

    await executeQuery(
      `
      UPDATE admin_awards 
      SET vehicle_id = NULL, awarded_by = NULL, awarded_at = $1, notes = NULL, 
          is_published = false, updated_at = $2
      WHERE category_name = $3
    `,
      [new Date().toISOString(), new Date().toISOString(), categoryName],
    )

    console.log("[v0] Admin award removed successfully")
    return { success: true }
  } catch (error) {
    console.error("Error removing admin award:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
