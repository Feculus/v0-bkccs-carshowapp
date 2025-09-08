"use client"

import { useState, useEffect } from "react"
import { votingStatusManager, type VotingStatus, type VotingSchedule } from "@/lib/voting-status"

export function useVotingStatus() {
  const [status, setStatus] = useState<VotingStatus>("loading")
  const [schedule, setSchedule] = useState<VotingSchedule | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to voting status changes
    const unsubscribe = votingStatusManager.subscribe((newStatus, newSchedule) => {
      setStatus(newStatus)
      setSchedule(newSchedule)
      setLoading(false)
    })

    votingStatusManager.startPolling(10000)

    // Cleanup on unmount
    return () => {
      unsubscribe()
      votingStatusManager.stopPolling()
    }
  }, [])

  // Force refresh voting status
  const refresh = async () => {
    setLoading(true)
    await votingStatusManager.refresh()
  }

  return {
    status,
    schedule,
    loading,
    refresh,
    isVotingOpen: votingStatusManager.isVotingOpen(),
    hasVotingEnded: votingStatusManager.hasVotingEnded(),
    timeUntilOpen: votingStatusManager.getTimeUntilOpen(),
    timeUntilClose: votingStatusManager.getTimeUntilClose(),
  }
}
