"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Heart, MapPin, ArrowLeft, Car } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import type { Vehicle } from "@/lib/types"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("newest")

  useEffect(() => {
    console.log("[v0] VehiclesPage component mounted")
    try {
      loadData()
    } catch (err) {
      console.error("[v0] Error in initial loadData:", err)
      setError("Failed to initialize page")
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && !error) {
      console.log("[v0] Filtering vehicles with searchTerm:", searchTerm, "sortBy:", sortBy)
      try {
        filterVehicles()
      } catch (err) {
        console.error("[v0] Error in filterVehicles:", err)
      }
    }
  }, [searchTerm, sortBy, loading, error])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Starting to load vehicles...")

      const supabase = createClient()

      // Load vehicles with vote counts and all image columns
      const { data: vehiclesData, error } = await supabase
        .from("vehicles")
        .select(`
        *,
        category:categories(*),
        votes!votes_vehicle_id_fkey(id)
      `)
        .neq("status", "archived")
        .order("created_at", { ascending: false })

      console.log("[v0] Supabase query result:", { vehiclesData, error })
      console.log("[v0] Number of vehicles found:", vehiclesData?.length || 0)

      if (error) {
        console.error("[v0] Supabase query error:", error)
        setError(`Database error: ${error.message}`)
        return
      }

      if (vehiclesData) {
        console.log(
          "[v0] Loaded vehicles with image URLs:",
          vehiclesData.map((v) => ({
            id: v.id,
            make: v.make,
            model: v.model,
            status: v.status,
            image_1_url: v.image_1_url,
            image_2_url: v.image_2_url,
            photos: v.photos,
          })),
        )

        // Process vote counts
        const processedVehicles = vehiclesData.map((vehicle) => ({
          ...vehicle,
          vote_count: vehicle.votes?.length || 0,
        }))
        setVehicles(processedVehicles)
        console.log("[v0] Processed vehicles set to state:", processedVehicles.length)
      } else {
        console.log("[v0] No vehicles data returned from query")
        setVehicles([])
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      setError(`Failed to load vehicles: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const filterVehicles = async () => {
    try {
      console.log("[v0] Starting filterVehicles with:", { searchTerm, sortBy })
      const supabase = createClient()

      let query = supabase
        .from("vehicles")
        .select(`
          *,
          category:categories(*),
          votes!votes_vehicle_id_fkey(id)
        `)
        .neq("status", "archived")

      if (searchTerm) {
        const searchValue = searchTerm.trim()
        if (searchValue) {
          const isNumeric = /^\d+$/.test(searchValue)

          if (isNumeric) {
            const yearValue = Number.parseInt(searchValue, 10)
            query = query
              .or(
                `full_name.ilike.%${searchValue}%,make.ilike.%${searchValue}%,model.ilike.%${searchValue}%,city.ilike.%${searchValue}%,state.ilike.%${searchValue}%`,
              )
              .or(`year.eq.${yearValue}`)
          } else {
            const sanitizedValue = searchValue.replace(/[%_]/g, "\\$&")
            query = query.or(
              `full_name.ilike.%${sanitizedValue}%,make.ilike.%${sanitizedValue}%,model.ilike.%${sanitizedValue}%,city.ilike.%${sanitizedValue}%,state.ilike.%${sanitizedValue}%`,
            )
          }
        }
      }

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false })
          break
        case "oldest":
          query = query.order("created_at", { ascending: true })
          break
        case "year-desc":
          query = query.order("year", { ascending: false })
          break
        case "year-asc":
          query = query.order("year", { ascending: true })
          break
        case "make":
          query = query.order("make", { ascending: true })
          break
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Filter query error:", error)
        return
      }

      if (data) {
        const processedVehicles = data.map((vehicle) => ({
          ...vehicle,
          vote_count: vehicle.votes?.length || 0,
        }))
        setVehicles(processedVehicles)
        console.log("[v0] Filtered vehicles count:", processedVehicles.length)
      }
    } catch (error) {
      console.error("[v0] Error in filterVehicles:", error)
    }
  }

  // Helper function to get the primary image URL
  const getPrimaryImageUrl = (vehicle: Vehicle): string | null => {
    // First try the new individual image columns
    if (vehicle.image_1_url) return vehicle.image_1_url

    // Fallback to photos array for backward compatibility
    if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
      return vehicle.photos[0]
    }

    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <Car className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Error Loading Vehicles</h2>
          </div>
          <p className="text-[#3A403D] mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-[#BF6849] hover:bg-[#BF6849]/90">
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
          <p className="text-[#3A403D]">Loading vehicle collection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <Button asChild variant="ghost" className="text-[#3A403D] hover:bg-[#3A403D] hover:text-white">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#3A403D] mb-4">Vehicle Collection</h1>
          <p className="text-[#3A403D]/60 max-w-2xl mx-auto">
            Explore all registered vehicles for the 2025 CRUISERFEST Show-N-Shine. Click on any vehicle to view details
            and cast your vote.
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#3A403D]/40" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#3A403D]/20 focus:border-[#BF6849]"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-[#3A403D]/20 focus:border-[#BF6849]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="year-desc">Year (Newest)</SelectItem>
                  <SelectItem value="year-asc">Year (Oldest)</SelectItem>
                  <SelectItem value="make">Make (A-Z)</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-center flex items-center justify-center">
                <span className="text-[#3A403D]/60">
                  {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} found
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Grid */}
        {vehicles.length === 0 ? (
          <Card className="bg-white shadow-lg">
            <CardContent className="text-center py-12">
              <p className="text-[#3A403D]/60 mb-4">No vehicles found matching your criteria.</p>
              <Button
                onClick={() => {
                  setSearchTerm("")
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => {
              const primaryImageUrl = getPrimaryImageUrl(vehicle)

              return (
                <Link key={vehicle.id} href={`/vehicle/${vehicle.profile_url}`}>
                  <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {primaryImageUrl ? (
                        <Image
                          src={primaryImageUrl || "/placeholder.svg"}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          onError={(e) => {
                            console.error("Image failed to load:", primaryImageUrl)
                            e.currentTarget.src = `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(vehicle.make + " " + vehicle.model)}`
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F2EEEB] flex items-center justify-center">
                          <div className="text-center text-[#3A403D]/40">
                            <div className="w-16 h-16 bg-[#3A403D]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                              <Car className="h-8 w-8" />
                            </div>
                            <p className="text-sm">No Photo</p>
                          </div>
                        </div>
                      )}

                      {/* Overlay with vote count */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                        <Heart className="h-3 w-3 text-[#BF6849]" />
                        <span className="text-xs font-semibold text-[#3A403D]">{vehicle.vote_count || 0}</span>
                      </div>

                      {/* Entry number badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-[#BF6849] text-white">#{vehicle.entry_number}</Badge>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="">
                          <h3 className="font-bold text-[#3A403D] text-lg leading-tight">
                            {vehicle.year} {vehicle.make}
                          </h3>
                        </div>

                        <p className="text-[#3A403D]/80 font-medium">{vehicle.model}</p>

                        <div className="flex items-center text-[#3A403D]/60 text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {vehicle.city}, {vehicle.state}
                        </div>

                        <p className="text-[#3A403D]/60 text-sm">by {vehicle.full_name}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
