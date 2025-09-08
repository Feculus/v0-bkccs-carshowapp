import { createClient } from "@/utils/supabase/client"

export interface ResultsPublicationStatus {
  arePublished: boolean
  publishedAt: string | null
  scheduledFor: string | null
  isScheduled: boolean
}

export async function getResultsPublicationStatus(): Promise<ResultsPublicationStatus> {
  const supabase = createClient()

  try {
    const { data: schedule, error } = await supabase
      .from("voting_schedule")
      .select("results_are_published, results_published_at")
      .eq("is_active", true)
      .single()

    if (error || !schedule) {
      // Default to hidden if no schedule found
      return {
        arePublished: false,
        publishedAt: null,
        scheduledFor: null,
        isScheduled: false,
      }
    }

    const now = new Date()
    const publishedAt = schedule.results_published_at ? new Date(schedule.results_published_at) : null

    // Check if results should be automatically published based on scheduled time
    const shouldBePublished = publishedAt && now >= publishedAt
    const actuallyPublished = schedule.results_are_published || shouldBePublished

    return {
      arePublished: actuallyPublished,
      publishedAt:
        schedule.results_are_published && schedule.results_published_at ? schedule.results_published_at : null,
      scheduledFor:
        !schedule.results_are_published && schedule.results_published_at ? schedule.results_published_at : null,
      isScheduled: !schedule.results_are_published && !!schedule.results_published_at,
    }
  } catch (error) {
    console.error("Error checking results publication status:", error)
    // Default to hidden on error
    return {
      arePublished: false,
      publishedAt: null,
      scheduledFor: null,
      isScheduled: false,
    }
  }
}

export async function checkAndUpdateScheduledPublication(): Promise<void> {
  const supabase = createClient()

  try {
    const { data: schedule, error } = await supabase.from("voting_schedule").select("*").eq("is_active", true).single()

    if (error || !schedule) return

    const now = new Date()
    const publishedAt = schedule.results_published_at ? new Date(schedule.results_published_at) : null

    // If results are scheduled but not yet published, and the time has passed
    if (!schedule.results_are_published && publishedAt && now >= publishedAt) {
      await supabase
        .from("voting_schedule")
        .update({
          results_are_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schedule.id)
    }
  } catch (error) {
    console.error("Error updating scheduled publication:", error)
  }
}
