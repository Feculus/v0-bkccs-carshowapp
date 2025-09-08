"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal, Award, Heart, ArrowLeft, Crown, EyeOff, Clock } from "lucide-react"
import Link from "next/link"
import type { Vehicle } from "@/lib/types"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"
import { getPublishedAdminAwards, type AdminAward } from "@/lib/admin-awards"
import { getResultsPublicationStatus, checkAndUpdateScheduledPublication } from "@/lib/results-utils"

const supabase = createClient()

interface VehicleWithVotes extends Vehicle {
  vote_count: number
  vote_percentage: number
}

export default function ResultsPage() {
  const [vehicles, setVehicles] = useState<VehicleWithVotes[]>([])
  const [loading, setLoading] = useState(true)
  const [totalVotes, setTotalVotes] = useState(0)
  const [adminAwards, setAdminAwards] = useState<AdminAward[]>([])
  const [resultsPublished, setResultsPublished] = useState(false)
  const [publicationStatus, setPublicationStatus] = useState<any>(null)

  const loadResults = useCallback(async () => {
    try {
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .neq("status", "archived")
        .order("created_at", { ascending: false })

      if (!vehiclesData) return

      // Get vote counts for each vehicle
      const vehiclesWithVotes: VehicleWithVotes[] = []
      let totalVoteCount = 0

      for (const vehicle of vehiclesData) {
        const { count } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("vehicle_id", vehicle.id)

        const voteCount = count || 0
        totalVoteCount += voteCount

        vehiclesWithVotes.push({
          ...vehicle,
          vote_count: voteCount,
          vote_percentage: 0, // Will calculate after we have total
        })
      }

      // Calculate percentages
      const vehiclesWithPercentages = vehiclesWithVotes.map((vehicle) => ({
        ...vehicle,
        vote_percentage: totalVoteCount > 0 ? (vehicle.vote_count / totalVoteCount) * 100 : 0,
      }))

      // Sort by vote count (highest first)
      vehiclesWithPercentages.sort((a, b) => b.vote_count - a.vote_count)

      setVehicles(vehiclesWithPercentages)
      setTotalVotes(totalVoteCount)

      const publishedAwards = await getPublishedAdminAwards(supabase)
      setAdminAwards(publishedAwards)
    } catch (error) {
      console.error("Error loading results:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const checkResultsStatusAndLoad = useCallback(async () => {
    try {
      await checkAndUpdateScheduledPublication()
      const status = await getResultsPublicationStatus()
      setPublicationStatus(status)
      setResultsPublished(status.arePublished)

      if (status.arePublished) {
        loadResults()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error("Error checking results status:", error)
      setLoading(false)
    }
  }, [loadResults])

  useEffect(() => {
    checkResultsStatusAndLoad()
  }, [checkResultsStatusAndLoad])

  useEffect(() => {
    if (!resultsPublished) return

    const interval = setInterval(() => {
      loadResults()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [resultsPublished, loadResults])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await checkAndUpdateScheduledPublication()
        const status = await getResultsPublicationStatus()
        setPublicationStatus(status)

        if (status.arePublished && !resultsPublished) {
          setResultsPublished(true)
          // loadResults will be triggered by the resultsPublished useEffect above
        }
      } catch (error) {
        console.error("Error checking publication status:", error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [resultsPublished])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-[#3A403D]/60">#{rank}</span>
    }
  }

  const getPrimaryImageUrl = (vehicle: Vehicle): string => {
    if (vehicle.image_1_url) return vehicle.image_1_url
    if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
      return vehicle.photos[0]
    }
    return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(vehicle.make + " " + vehicle.model)}`
  }

  if (!resultsPublished) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <Card className="bg-white shadow-lg">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-[#3A403D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                {publicationStatus?.isScheduled ? (
                  <Clock className="h-10 w-10 text-[#3A403D]/40" />
                ) : (
                  <EyeOff className="h-10 w-10 text-[#3A403D]/40" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#3A403D] mb-4">
                {publicationStatus?.isScheduled ? "Results Coming Soon" : "Results Not Yet Available"}
              </h2>
              <p className="text-[#3A403D]/60 mb-6">
                {publicationStatus?.isScheduled
                  ? `Results are scheduled to be published on ${new Date(publicationStatus.scheduledFor).toLocaleDateString()} at ${new Date(publicationStatus.scheduledFor).toLocaleTimeString()}. Check back then to see the live voting results!`
                  : "Voting results will be available at the close of the voting period. Please check back later or visit the event for updates."}
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                  <Link href="/vehicles">Browse Vehicle Collection</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
          <p className="text-[#3A403D]">Loading voting results...</p>
        </div>
      </div>
    )
  }

  const winner = vehicles.length > 0 ? vehicles[0] : null

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 sm:mb-8">
          <Button asChild variant="ghost" className="text-[#3A403D] hover:bg-[#3A403D] hover:text-white">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#3A403D] mb-4">Best in Show Results</h1>
          <p className="text-sm sm:text-base text-[#3A403D]/60 max-w-2xl mx-auto mb-4 px-2">
            See how the competition is shaping up! Results are updated in real-time as votes come in.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-[#3A403D]/50">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-refreshing every 60 seconds</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>{totalVotes} total votes cast</span>
          </div>
        </div>

        {/* Current Leader */}
        {winner && winner.vote_count > 0 && (
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg mb-8 sm:mb-12">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="flex items-center justify-center mb-2 sm:mb-4">
                <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-xl sm:text-3xl font-bold text-[#3A403D]">Current Leader</CardTitle>
              <CardDescription className="text-sm sm:text-base text-[#3A403D]/80">
                Leading the Best in Show competition
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0 sm:items-center">
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  <Image
                    src={getPrimaryImageUrl(winner) || "/placeholder.svg"}
                    alt={`${winner.year} ${winner.make} ${winner.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="text-center sm:text-left space-y-3 sm:space-y-4">
                  <div className="inline-block">
                    <Badge className="bg-yellow-500 text-white text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2">
                      #{winner.entry_number}
                    </Badge>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-[#3A403D] leading-tight">
                    {winner.year} {winner.make} {winner.model}
                  </h2>
                  <p className="text-sm sm:text-lg text-[#3A403D]/80">
                    by {winner.full_name} from {winner.city}, {winner.state}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-lg sm:text-2xl font-bold text-[#BF6849]">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                    <span>{winner.vote_count} votes</span>
                    <span className="text-xs sm:text-sm text-[#3A403D]/60">({winner.vote_percentage.toFixed(1)}%)</span>
                  </div>
                  <Button asChild className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white w-full sm:w-auto">
                    <Link href={`/vehicle/${winner.profile_url}`}>View Vehicle Details</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Results */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-[#3A403D] flex items-center">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-[#BF6849]" />
                  Best in Show Standings
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  {totalVotes} total votes • {vehicles.length} vehicles competing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#3A403D]/60">No vehicles registered yet.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {vehicles.map((vehicle, index) => (
                  <div key={vehicle.id} className="p-3 sm:p-4 bg-[#F2EEEB] rounded-lg">
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                      {/* Rank and basic info row for mobile */}
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full border-2 border-[#3A403D]/10 flex-shrink-0">
                          {getRankIcon(index + 1)}
                        </div>

                        <div className="w-16 h-12 sm:w-20 sm:h-16 relative overflow-hidden rounded-lg bg-white flex-shrink-0">
                          <Image
                            src={getPrimaryImageUrl(vehicle) || "/placeholder.svg"}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 64px, 80px"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#3A403D] text-sm sm:text-base leading-tight">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-[#3A403D]/60 text-xs sm:text-sm">
                            #{vehicle.entry_number} • {vehicle.full_name}
                          </p>
                        </div>

                        {/* Vote count - always visible on mobile */}
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center text-[#BF6849] font-bold text-sm sm:text-base">
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 fill-current" />
                            {vehicle.vote_count}
                          </div>
                          <p className="text-xs text-[#3A403D]/60">{vehicle.vote_percentage.toFixed(1)}%</p>
                        </div>
                      </div>

                      {/* Progress bar and details - full width on mobile */}
                      <div className="space-y-2 sm:flex-1 sm:min-w-0">
                        <Progress value={vehicle.vote_percentage} className="h-2" />
                        <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                          <span className="text-xs text-[#3A403D]/60">
                            {vehicle.city}, {vehicle.state}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="self-start sm:self-auto bg-transparent"
                          >
                            <Link href={`/vehicle/${vehicle.profile_url}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Special Awards Section */}
        {adminAwards.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold text-[#3A403D] mb-4">Special Awards</h2>
              <p className="text-sm sm:text-base text-[#3A403D]/60 px-2">
                Recognizing exceptional vehicles in unique categories
              </p>
            </div>

            <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-8">
              {adminAwards.map((award) => (
                <Card
                  key={award.category_name}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg"
                >
                  <CardHeader className="text-center pb-4 sm:pb-6">
                    <div className="flex items-center justify-center mb-2 sm:mb-4">
                      <Award className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600" />
                    </div>
                    <CardTitle className="text-lg sm:text-2xl font-bold text-[#3A403D]">
                      {award.category_name}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-[#3A403D]/80">
                      Special Recognition Award
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {award.vehicle && (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/80 rounded-lg">
                          <div className="w-16 h-12 sm:w-20 sm:h-16 relative overflow-hidden rounded-lg bg-white flex-shrink-0">
                            <Image
                              src={getPrimaryImageUrl(award.vehicle) || "/placeholder.svg"}
                              alt={`${award.vehicle.year} ${award.vehicle.make} ${award.vehicle.model}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 64px, 80px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2 mb-2">
                              <Badge className="bg-amber-600 text-white text-xs sm:text-sm self-start">
                                #{award.vehicle.entry_number}
                              </Badge>
                              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 hidden sm:block" />
                            </div>
                            <h3 className="font-bold text-[#3A403D] text-sm sm:text-lg leading-tight">
                              {award.vehicle.year} {award.vehicle.make} {award.vehicle.model}
                            </h3>
                            <p className="text-[#3A403D]/80 text-xs sm:text-base">by {award.vehicle.full_name}</p>
                            <p className="text-[#3A403D]/60 text-xs sm:text-sm">
                              {award.vehicle.city}, {award.vehicle.state}
                            </p>
                          </div>
                        </div>

                        {award.notes && (
                          <div className="bg-white/60 rounded-lg p-3">
                            <p className="text-xs sm:text-sm text-[#3A403D]/80 italic">"{award.notes}"</p>
                          </div>
                        )}

                        <div className="text-center">
                          <Button size="sm" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                            <Link href={`/vehicle/${award.vehicle.id}`}>View Vehicle Details</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center mt-8 sm:mt-12">
          <Card className="bg-blue-50 border border-blue-200">
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-base text-[#3A403D]/80">
                <strong>Note:</strong> Results are updated in real-time. Voting continues until the official close time.
                The winner will be announced at the awards ceremony.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
