"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export async function archiveVehicle(vehicleId: number) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Update the vehicle status to archived
    const { error } = await supabase
      .from("vehicles")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (error) {
      console.error("Error archiving vehicle:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the admin page to reflect changes
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error archiving vehicle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive vehicle",
    }
  }
}

export async function unarchiveVehicle(vehicleId: number) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Update the vehicle status back to active
    const { error } = await supabase
      .from("vehicles")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (error) {
      console.error("Error unarchiving vehicle:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the admin page to reflect changes
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error unarchiving vehicle:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unarchive vehicle",
    }
  }
}
