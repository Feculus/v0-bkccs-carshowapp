"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, ArrowLeft, MapPin, Calendar, User, Car, Info, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getCurrentVote, getVoteCount } from "@/lib/vote-utils"
import { VotingCountdown } from "@/components/voting-countdown"
import { useVotingStatus } from "@/hooks/use-voting-status"
import type { Vehicle, Category } from "@/lib/types"

interface VehicleProfileClientProps {
  vehicle: Vehicle & { category: Category }
  categories: Category[]
}

export default function VehicleProfileClient({ vehicle, categories }: VehicleProfileClientProps) {
  const [currentVote, setCurrentVote] = useState<any>(null)
  const [voteCount, setVoteCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Using the new voting status hook for real-time updates
  const { status: votingStatus, schedule: votingSchedule, isVotingOpen } = useVotingStatus()

  useEffect(() => {
    loadVotingData()
  }, [vehicle.category_id])

  // Refresh vote count when voting status changes
  useEffect(() => {
    if (votingStatus !== "loading") {
      refreshVoteCount()
    }
  }, [votingStatus])

  const loadVotingData = async () => {
    try {
      // Check if user has voted in this vehicle's category
      const existingVote = await getCurrentVote(vehicle.category_id)
      setCurrentVote(existingVote)

      // Get vote count for this vehicle
      const count = await getVoteCount(vehicle.id)
      setVoteCount(count)
    } catch (error) {
      console.error("Error loading voting data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Added function to refresh vote count for real-time updates
  const refreshVoteCount = async () => {
    try {
      const count = await getVoteCount(vehicle.id)
      setVoteCount(count)
    } catch (error) {
      console.error("Error refreshing vote count:", error)
    }
  }

  // Helper function to get all image URLs
  const getImageUrls = (vehicle: Vehicle): string[] => {
    const images: string[] = []

    // Add individual image URLs
    if (vehicle.image_1_url) images.push(vehicle.image_1_url)
    if (vehicle.image_2_url) images.push(vehicle.image_2_url)
    if (vehicle.image_3_url) images.push(vehicle.image_3_url)
    if (vehicle.image_4_url) images.push(vehicle.image_4_url)
    if (vehicle.image_5_url) images.push(vehicle.image_5_url)

    // Add legacy photos array
    if (vehicle.photos && Array.isArray(vehicle.photos)) {
      vehicle.photos.forEach((photo) => {
        if (photo && !images.includes(photo)) {
          images.push(photo)
        }
      })
    }

    return images
  }

  const imageUrls = getImageUrls(vehicle)
  const hasVotedForThisVehicle = currentVote && currentVote.vehicle_id === vehicle.id
  const hasVotedForDifferentVehicle = currentVote && currentVote.vehicle_id !== vehicle.id

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="text-[#3A403D] hover:bg-[#3A403D] hover:text-white">
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicles
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Header */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-[#BF6849] text-white text-lg px-4 py-2">#{vehicle.entry_number}</Badge>
                  <Badge variant="outline" className="border-[#A9BF88] text-[#A9BF88] text-lg px-4 py-2">
                    {vehicle.category.name}
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold text-[#3A403D]">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </CardTitle>
                <CardDescription className="text-lg text-[#3A403D]/80">
                  {vehicle.trim && `${vehicle.trim} • `}
                  Owned by {vehicle.full_name}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Images Gallery */}
            {imageUrls.length > 0 && (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                    {imageUrls.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative overflow-hidden rounded-lg ${index === 0 && imageUrls.length > 1 ? "md:col-span-2" : ""}`}
                      >
                        <div className={`aspect-video ${index === 0 && imageUrls.length > 1 ? "md:aspect-[2/1]" : ""}`}>
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Details */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-[#3A403D]">
                  <Info className="h-5 w-5 mr-2" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Car className="h-5 w-5 text-[#BF6849]" />
                    <div>
                      <p className="font-semibold text-[#3A403D]">Make & Model</p>
                      <p className="text-[#3A403D]/80">
                        {vehicle.make} {vehicle.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-[#BF6849]" />
                    <div>
                      <p className="font-semibold text-[#3A403D]">Year</p>
                      <p className="text-[#3A403D]/80">{vehicle.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-[#BF6849]" />
                    <div>
                      <p className="font-semibold text-[#3A403D]">Owner</p>
                      <p className="text-[#3A403D]/80">{vehicle.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-[#BF6849]" />
                    <div>
                      <p className="font-semibold text-[#3A403D]">Location</p>
                      <p className="text-[#3A403D]/80">
                        {vehicle.city}, {vehicle.state}
                      </p>
                    </div>
                  </div>
                </div>

                {vehicle.trim && (
                  <div className="pt-4 border-t border-[#3A403D]/10">
                    <p className="font-semibold text-[#3A403D] mb-1">Trim Level</p>
                    <p className="text-[#3A403D]/80">{vehicle.trim}</p>
                  </div>
                )}

                {vehicle.description && (
                  <div className="pt-4 border-t border-[#3A403D]/10">
                    <p className="font-semibold text-[#3A403D] mb-2">Description</p>
                    <p className="text-[#3A403D]/80 leading-relaxed">{vehicle.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Voting Sidebar */}
          <div className="space-y-6">
            {/* Vote Count */}
            <Card className="bg-white shadow-lg">
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-[#BF6849] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white fill-current" />
                </div>
                <div className="text-3xl font-bold text-[#3A403D] mb-2">{voteCount}</div>
                <p className="text-[#3A403D]/60">Vote{voteCount !== 1 ? "s" : ""}</p>
                {/* Added real-time update indicator */}
                {isVotingOpen && (
                  <div className="flex items-center justify-center mt-2 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    Live updates
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voting Actions */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#3A403D]">Cast Your Vote</CardTitle>
                <CardDescription>Vote for this vehicle in the {vehicle.category.name} category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF6849] mx-auto"></div>
                  </div>
                ) : votingStatus === "closed" && votingSchedule ? (
                  <VotingCountdown
                    opensAt={votingSchedule.voting_opens_at}
                    closesAt={votingSchedule.voting_closes_at}
                  />
                ) : votingStatus === "ended" ? (
                  <Alert className="border-gray-500 bg-gray-50">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <AlertDescription>
                      <strong>Voting has ended</strong>
                      <br />
                      Thank you for participating in the 2025 CRUISERFEST Show-N-Shine!
                    </AlertDescription>
                  </Alert>
                ) : hasVotedForThisVehicle ? (
                  <Alert className="border-[#A9BF88] bg-[#A9BF88]/5">
                    <Check className="h-4 w-4 text-[#A9BF88]" />
                    <AlertDescription>
                      <strong>You've already voted for this vehicle!</strong>
                      <br />
                      Your vote is recorded in the {vehicle.category.name} category.
                    </AlertDescription>
                  </Alert>
                ) : hasVotedForDifferentVehicle ? (
                  <Alert className="border-blue-500 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      You've already voted in the {vehicle.category.name} category. Voting for this vehicle will change
                      your vote.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {votingStatus === "open" && (
                  <Button
                    asChild
                    className={`w-full py-3 ${hasVotedForThisVehicle ? "bg-[#A9BF88] hover:bg-[#A9BF88]/90" : "bg-[#BF6849] hover:bg-[#BF6849]/90"} text-white`}
                    disabled={hasVotedForThisVehicle || vehicle.status === "archived"}
                  >
                    <Link href={`/vote?vehicle=${vehicle.id}&category=${vehicle.category_id}`}>
                      <Heart className="h-4 w-4 mr-2" />
                      {hasVotedForThisVehicle
                        ? "Already Voted"
                        : vehicle.status === "archived"
                          ? "Vehicle Archived"
                          : hasVotedForDifferentVehicle
                            ? "Change My Vote"
                            : "Vote for This Vehicle"}
                    </Link>
                  </Button>
                )}

                <div className="text-xs text-[#3A403D]/60 text-center">
                  {votingStatus === "open" ? (
                    <>
                      <p>• You can vote once per category</p>
                      <p>• You can change your vote anytime</p>
                    </>
                  ) : votingStatus === "closed" ? (
                    <p>• Voting will open soon - check back later!</p>
                  ) : (
                    <p>• Voting has ended for this event</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Info */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#3A403D]">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-[#A9BF88] text-white text-lg px-4 py-2 w-full justify-center">
                  {vehicle.category.name}
                </Badge>
                {vehicle.category.description && (
                  <p className="text-sm text-[#3A403D]/60 mt-3">{vehicle.category.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/vehicles">Browse All Vehicles</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/results">View Results</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
