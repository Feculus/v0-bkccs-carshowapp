"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Heart, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import type { Vehicle } from "@/lib/types"

const supabase = createClient()

export default function VoteSuccessPage() {
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicle")

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (vehicleId) {
      loadVehicle()
    }
  }, [vehicleId])

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", vehicleId).single()

      if (error) {
        console.error("Error loading vehicle:", error)
        return
      }

      setVehicle(data)
    } catch (error) {
      console.error("Error loading vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPrimaryImageUrl = (vehicle: Vehicle): string => {
    if (vehicle.image_1_url) return vehicle.image_1_url
    if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
      return vehicle.photos[0]
    }
    return `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(vehicle.make + " " + vehicle.model)}`
  }

  const handleShare = async () => {
    if (navigator.share && vehicle) {
      try {
        await navigator.share({
          title: `I voted for ${vehicle.year} ${vehicle.make} ${vehicle.model} for Best in Show!`,
          text: `Check out this amazing ${vehicle.year} ${vehicle.make} ${vehicle.model} at the 2025 CRUISERFEST Show-N-Shine!`,
          url: `${window.location.origin}/vehicle/${vehicle.profile_url}`,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else if (vehicle) {
      // Fallback to copying to clipboard
      const shareText = `I voted for ${vehicle.year} ${vehicle.make} ${vehicle.model} for Best in Show at the 2025 CRUISERFEST Show-N-Shine! Check it out: ${window.location.origin}/vehicle/${vehicle.profile_url}`
      navigator.clipboard.writeText(shareText)
      alert("Share text copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
          <p className="text-[#3A403D]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-[#3A403D] mb-4">Vehicle not found.</p>
            <Button asChild>
              <Link href="/vehicles">Browse Vehicles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const primaryImageUrl = getPrimaryImageUrl(vehicle)

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#A9BF88] rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#3A403D] mb-4">Vote Submitted Successfully!</h1>
          <p className="text-[#3A403D]/80 text-lg max-w-2xl mx-auto">
            Thank you for participating in the 2025 CRUISERFEST Show-N-Shine voting! Your vote for Best in Show has been
            recorded.
          </p>
        </div>

        <Card className="bg-white shadow-lg mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-[#3A403D] flex items-center justify-center">
              <Heart className="h-6 w-6 mr-2 text-[#BF6849] fill-current" />
              You Voted For
            </CardTitle>
            <CardDescription>Your Best in Show selection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="aspect-video relative overflow-hidden rounded-lg">
                <Image
                  src={primaryImageUrl || "/placeholder.svg"}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[#BF6849] text-white text-lg px-4 py-2">#{vehicle.entry_number}</Badge>
                  <Badge variant="outline" className="border-[#BF6849] text-[#BF6849] text-lg px-4 py-2">
                    <Trophy className="h-4 w-4 mr-1" />
                    Best in Show
                  </Badge>
                </div>
                <h2 className="text-3xl font-bold text-[#3A403D]">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
                <p className="text-[#3A403D]/80 text-lg">by {vehicle.full_name}</p>
                <p className="text-[#3A403D]/60">
                  {vehicle.city}, {vehicle.state}
                </p>
                {vehicle.description && (
                  <p className="text-[#3A403D]/80 text-sm bg-[#F2EEEB] p-3 rounded-lg">{vehicle.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="bg-blue-50 border-2 border-blue-200 shadow-lg mb-8">
          <CardContent className="text-center py-6">
            <h3 className="text-xl font-bold text-[#3A403D] mb-3">Important Reminder</h3>
            <p className="text-[#3A403D]/80 mb-4">
              Your vote is <strong>final and cannot be changed</strong>. You have successfully voted for this vehicle as
              your choice for Best in Show.
            </p>
            <p className="text-sm text-[#3A403D]/60">
              Results will be announced at the awards ceremony. Thank you for participating!
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse All Vehicles
            </Link>
          </Button>
          <Button onClick={handleShare} variant="outline" className="bg-transparent">
            <Share2 className="h-4 w-4 mr-2" />
            Share Your Vote
          </Button>
          <Button asChild className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
            <Link href="/results">View Live Results</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
