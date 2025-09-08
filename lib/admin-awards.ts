import type { SupabaseClient } from "@supabase/supabase-js"
import type { AdminAward } from "@/types/admin-awards"

// Predefined special award categories
export const SPECIAL_AWARD_CATEGORIES = [
  "Most Original",
  "Least Original",
  "Rustiest Relic",
  "XOverland - Spirit of Adventure Award",
  "Best in Show",
]

export async function getAdminAwards(supabase: SupabaseClient): Promise<AdminAward[]> {
  console.log("[v0] Fetching admin awards...")

  const { data, error } = await supabase
    .from("admin_awards")
    .select(`
      *,
      vehicle:vehicles(
        id,
        entry_number,
        make,
        model,
        year,
        full_name,
        city,
        state,
        image_1_url,
        photos
      )
    `)
    .order("category_name")

  if (error) {
    console.error("Error fetching admin awards:", error)
    throw new Error(`Failed to fetch admin awards: ${error.message}`)
  }

  // Create a map of existing awards by category
  const existingAwards = new Map((data || []).map((award) => [award.category_name, award]))

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
}

export async function getPublishedAdminAwards(supabase: SupabaseClient): Promise<AdminAward[]> {
  console.log("[v0] Fetching published admin awards...")

  const { data, error } = await supabase
    .from("admin_awards")
    .select(`
      *,
      vehicle:vehicles(
        id,
        entry_number,
        make,
        model,
        year,
        full_name,
        city,
        state,
        image_1_url,
        photos
      )
    `)
    .eq("is_published", true)
    .not("vehicle_id", "is", null)
    .order("category_name")

  if (error) {
    console.error("Error fetching published admin awards:", error)
    throw new Error(`Failed to fetch published admin awards: ${error.message}`)
  }

  return data || []
}

export async function assignAdminAward(
  supabase: SupabaseClient,
  categoryName: string,
  vehicleId: number,
  awardedBy: string,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Assigning admin award:", { categoryName, vehicleId, awardedBy })

    const { data: existingAward, error: fetchError } = await supabase
      .from("admin_awards")
      .select("id")
      .eq("category_name", categoryName)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error checking existing award:", fetchError)
      throw fetchError
    }

    let result
    if (existingAward) {
      result = await supabase
        .from("admin_awards")
        .update({
          vehicle_id: vehicleId,
          awarded_by: awardedBy,
          awarded_at: new Date().toISOString(),
          notes: notes || null,
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAward.id)
    } else {
      result = await supabase.from("admin_awards").insert({
        category_name: categoryName,
        vehicle_id: vehicleId,
        awarded_by: awardedBy,
        awarded_at: new Date().toISOString(),
        notes: notes || null,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    if (result.error) {
      console.error("Error assigning admin award:", result.error)
      throw result.error
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
  supabase: SupabaseClient,
  categoryName: string,
  isPublished: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Publishing admin award:", { categoryName, isPublished })

    const { error } = await supabase
      .from("admin_awards")
      .update({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("category_name", categoryName)

    if (error) {
      console.error("Error publishing admin award:", error)
      throw error
    }

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

export async function removeAdminAward(
  supabase: SupabaseClient,
  categoryName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[v0] Removing admin award:", { categoryName })

    const { error } = await supabase
      .from("admin_awards")
      .update({
        vehicle_id: null,
        awarded_by: null,
        awarded_at: new Date().toISOString(),
        notes: null,
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("category_name", categoryName)

    if (error) {
      console.error("Error removing admin award:", error)
      throw error
    }

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
