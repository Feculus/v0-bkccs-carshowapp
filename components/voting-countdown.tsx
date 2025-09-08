"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar } from "lucide-react"

interface VotingCountdownProps {
  opensAt: string
  closesAt: string
  className?: string
}

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
  isOpen: boolean
  hasEnded: boolean
}

function convertToMST(date: Date): Date {
  const year = date.getFullYear()
  const dstStart = new Date(year, 2, 14 - new Date(year, 2, 1).getDay())
  const dstEnd = new Date(year, 10, 7 - new Date(year, 10, 1).getDay())

  const isDST = date >= dstStart && date < dstEnd
  const offsetHours = isDST ? -6 : -7 // MDT or MST offset

  return new Date(date.getTime() + offsetHours * 60 * 60 * 1000)
}

function getCurrentMSTTime(): Date {
  return convertToMST(new Date())
}

function formatMSTDateTime(dateString: string): { date: string; time: string } {
  const utcDate = new Date(dateString)
  const mstDate = convertToMST(utcDate)

  return {
    date: mstDate.toLocaleDateString("en-US", {
      timeZone: "America/Denver",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: mstDate.toLocaleTimeString("en-US", {
      timeZone: "America/Denver",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }),
  }
}

export function VotingCountdown({ opensAt, closesAt, className = "" }: VotingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOpen: false,
    hasEnded: false,
  })

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const nowMST = getCurrentMSTTime().getTime()
      const openTimeMST = convertToMST(new Date(opensAt)).getTime()
      const closeTimeMST = convertToMST(new Date(closesAt)).getTime()

      if (nowMST < openTimeMST) {
        // Voting hasn't opened yet - show countdown to opening
        const difference = openTimeMST - nowMST

        const hours = Math.floor(difference / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeRemaining({
          hours: Math.max(0, hours),
          minutes: Math.max(0, minutes),
          seconds: Math.max(0, seconds),
          isOpen: false,
          hasEnded: false,
        })
      } else if (nowMST >= openTimeMST && nowMST < closeTimeMST) {
        // Voting is currently open
        setTimeRemaining({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOpen: true,
          hasEnded: false,
        })
      } else {
        // Voting has ended
        setTimeRemaining({
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOpen: false,
          hasEnded: true,
        })
      }
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [opensAt, closesAt])

  const formatTime = (value: number): string => {
    return value.toString().padStart(2, "0")
  }

  const { date: openDate, time: openTime } = formatMSTDateTime(opensAt)

  if (timeRemaining.isOpen) {
    return (
      <div
        className={`flex items-center justify-center p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">Voting is Open!</h3>
          <p className="text-green-700 text-sm">Cast your vote now</p>
        </div>
      </div>
    )
  }

  if (timeRemaining.hasEnded) {
    return (
      <div className={`flex items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Voting Has Ended</h3>
          <p className="text-gray-600 text-sm">Thank you for participating!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 bg-[#BF6849]/5 border border-[#BF6849]/20 rounded-lg ${className}`}>
      <div className="text-center">
        <div className="w-12 h-12 bg-[#BF6849] rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-6 w-6 text-white" />
        </div>

        <h3 className="text-lg font-semibold text-[#3A403D] mb-2">Voting Opens In</h3>

        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-center">
            <div className="bg-[#BF6849] text-white text-2xl font-bold rounded-lg px-3 py-2 min-w-[60px]">
              {formatTime(timeRemaining.hours)}
            </div>
            <p className="text-xs text-[#3A403D]/60 mt-1">Hours</p>
          </div>

          <div className="text-[#BF6849] text-2xl font-bold">:</div>

          <div className="text-center">
            <div className="bg-[#BF6849] text-white text-2xl font-bold rounded-lg px-3 py-2 min-w-[60px]">
              {formatTime(timeRemaining.minutes)}
            </div>
            <p className="text-xs text-[#3A403D]/60 mt-1">Minutes</p>
          </div>

          <div className="text-[#BF6849] text-2xl font-bold">:</div>

          <div className="text-center">
            <div className="bg-[#BF6849] text-white text-2xl font-bold rounded-lg px-3 py-2 min-w-[60px]">
              {formatTime(timeRemaining.seconds)}
            </div>
            <p className="text-xs text-[#3A403D]/60 mt-1">Seconds</p>
          </div>
        </div>

        <p className="text-sm text-[#3A403D]/70">
          Voting opens on {openDate} at {openTime}
        </p>
      </div>
    </div>
  )
}
