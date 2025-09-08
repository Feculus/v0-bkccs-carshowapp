import { createClient } from "@/utils/supabase/client"

export interface VotingSchedule {
  id: number
  voting_opens_at: string
  voting_closes_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VotingStatus = "loading" | "closed" | "open" | "ended"

export class VotingStatusManager {
  private static instance: VotingStatusManager
  private schedule: VotingSchedule | null = null
  private status: VotingStatus = "loading"
  private listeners: Array<(status: VotingStatus, schedule: VotingSchedule | null) => void> = []
  private pollInterval: NodeJS.Timeout | null = null
  private supabase = createClient()

  private constructor() {}

  static getInstance(): VotingStatusManager {
    if (!VotingStatusManager.instance) {
      VotingStatusManager.instance = new VotingStatusManager()
    }
    return VotingStatusManager.instance
  }

  // Subscribe to voting status changes
  subscribe(callback: (status: VotingStatus, schedule: VotingSchedule | null) => void): () => void {
    this.listeners.push(callback)

    // Immediately call with current status
    callback(this.status, this.schedule)

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback)
    }
  }

  // Start polling for voting status updates
  startPolling(intervalMs = 30000): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }

    // Initial load
    this.updateVotingStatus()

    // Poll for updates
    this.pollInterval = setInterval(() => {
      this.updateVotingStatus()
    }, intervalMs)
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  // Get current voting status
  getCurrentStatus(): { status: VotingStatus; schedule: VotingSchedule | null } {
    return { status: this.status, schedule: this.schedule }
  }

  private convertToMST(date: Date): Date {
    // Convert any date to MST (UTC-7) or MDT (UTC-6) depending on daylight saving
    const mstOffset = this.getMSTOffset(date)
    return new Date(date.getTime() + mstOffset)
  }

  private getMSTOffset(date: Date): number {
    // MST is UTC-7, MDT is UTC-6
    // This is a simplified approach - for production, consider using a proper timezone library
    const year = date.getFullYear()

    // Daylight saving time typically runs from second Sunday in March to first Sunday in November
    const dstStart = new Date(year, 2, 14 - new Date(year, 2, 1).getDay()) // Second Sunday in March
    const dstEnd = new Date(year, 10, 7 - new Date(year, 10, 1).getDay()) // First Sunday in November

    const isDST = date >= dstStart && date < dstEnd
    return isDST ? -6 * 60 * 60 * 1000 : -7 * 60 * 60 * 1000 // MDT or MST offset in milliseconds
  }

  private getCurrentMSTTime(): Date {
    return this.convertToMST(new Date())
  }

  // Update voting status from database
  private async updateVotingStatus(): Promise<void> {
    try {
      console.log("[v0] Updating voting status from database...")

      const { data: scheduleData, error } = await this.supabase
        .from("voting_schedule")
        .select("*")
        .eq("is_active", true)
        .single()

      console.log("[v0] Voting schedule query result:", { scheduleData, error })

      const previousStatus = this.status
      const previousSchedule = this.schedule

      if (scheduleData) {
        this.schedule = scheduleData

        const nowMST = this.getCurrentMSTTime()
        const opensAtMST = this.convertToMST(new Date(scheduleData.voting_opens_at))
        const closesAtMST = this.convertToMST(new Date(scheduleData.voting_closes_at))

        console.log("[v0] MST Time comparison:", {
          nowMST: nowMST.toISOString(),
          opensAtMST: opensAtMST.toISOString(),
          closesAtMST: closesAtMST.toISOString(),
          nowTime: nowMST.getTime(),
          opensTime: opensAtMST.getTime(),
          closesTime: closesAtMST.getTime(),
        })

        if (nowMST < opensAtMST) {
          this.status = "closed"
        } else if (nowMST >= opensAtMST && nowMST < closesAtMST) {
          this.status = "open"
        } else {
          this.status = "ended"
        }

        console.log("[v0] Determined voting status (MST):", this.status)
      } else {
        console.log("[v0] No active voting schedule found")
        this.schedule = null
        this.status = "closed"
      }

      // Notify listeners if status or schedule changed
      if (previousStatus !== this.status || JSON.stringify(previousSchedule) !== JSON.stringify(this.schedule)) {
        console.log("[v0] Voting status changed from", previousStatus, "to", this.status)
        this.notifyListeners()
      }
    } catch (error) {
      console.error("[v0] Error updating voting status:", error)
      this.status = "closed"
      this.schedule = null
      this.notifyListeners()
    }
  }

  // Notify all listeners of status change
  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.status, this.schedule)
      } catch (error) {
        console.error("Error in voting status listener:", error)
      }
    })
  }

  // Force refresh voting status
  async refresh(): Promise<void> {
    await this.updateVotingStatus()
  }

  getTimeUntilOpen(): number {
    if (!this.schedule) return 0

    const nowMST = this.getCurrentMSTTime().getTime()
    const opensAtMST = this.convertToMST(new Date(this.schedule.voting_opens_at)).getTime()

    return Math.max(0, opensAtMST - nowMST)
  }

  getTimeUntilClose(): number {
    if (!this.schedule) return 0

    const nowMST = this.getCurrentMSTTime().getTime()
    const closesAtMST = this.convertToMST(new Date(this.schedule.voting_closes_at)).getTime()

    return Math.max(0, closesAtMST - nowMST)
  }

  // Check if voting is currently open
  isVotingOpen(): boolean {
    return this.status === "open"
  }

  // Check if voting has ended
  hasVotingEnded(): boolean {
    return this.status === "ended"
  }

  // Cleanup resources
  destroy(): void {
    this.stopPolling()
    this.listeners = []
  }
}

// Export singleton instance
export const votingStatusManager = VotingStatusManager.getInstance()
