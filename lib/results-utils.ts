import { executeQuery } from "@/utils/neon/client"

export interface ResultsPublicationStatus {
  arePublished: boolean
  publishedAt: string | null
  scheduledFor: string | null
  isScheduled: boolean
}

export async function getResultsPublicationStatus(): Promise<ResultsPublicationStatus> {
  try {
    const { data: schedule, error } = await executeQuery(`
      SELECT results_published, results_publish_time
      FROM voting_schedule
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (error || !schedule || schedule.length === 0) {
      // Default to hidden if no schedule found
      return {
        arePublished: false,
        publishedAt: null,
        scheduledFor: null,
        isScheduled: false,
      }
    }

    const scheduleData = schedule[0]
    const now = new Date()
    const publishedAt = scheduleData.results_publish_time ? new Date(scheduleData.results_publish_time) : null

    // Check if results should be automatically published based on scheduled time
    const shouldBePublished = publishedAt && now >= publishedAt
    const actuallyPublished = scheduleData.results_published || shouldBePublished

    return {
      arePublished: actuallyPublished,
      publishedAt:
        scheduleData.results_published && scheduleData.results_publish_time ? scheduleData.results_publish_time : null,
      scheduledFor:
        !scheduleData.results_published && scheduleData.results_publish_time ? scheduleData.results_publish_time : null,
      isScheduled: !scheduleData.results_published && !!scheduleData.results_publish_time,
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
  try {
    const { data: schedule, error } = await executeQuery(`
      SELECT * FROM voting_schedule ORDER BY created_at DESC LIMIT 1
    `)

    if (error || !schedule || schedule.length === 0) return

    const scheduleData = schedule[0]
    const now = new Date()
    const publishedAt = scheduleData.results_publish_time ? new Date(scheduleData.results_publish_time) : null

    // If results are scheduled but not yet published, and the time has passed
    if (!scheduleData.results_published && publishedAt && now >= publishedAt) {
      await executeQuery(
        `
        UPDATE voting_schedule
        SET results_published = true, updated_at = NOW()
        WHERE id = $1
      `,
        [scheduleData.id],
      )
    }
  } catch (error) {
    console.error("Error updating scheduled publication:", error)
  }
}
