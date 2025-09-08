"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Award, Trophy, Eye, EyeOff, Edit, Trash2, Plus, AlertCircle, Check, Search } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import {
  getAdminAwards,
  assignAdminAward,
  publishAdminAward,
  removeAdminAward,
  SPECIAL_AWARD_CATEGORIES,
  type AdminAward,
} from "@/lib/admin-awards"
import type { Vehicle } from "@/lib/types"

export function AdminAwardsManager() {
  const [awards, setAwards] = useState<AdminAward[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [supabase] = useState(() => createClient())

  // Award assignment state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [awardNotes, setAwardNotes] = useState("")
  const [vehicleSearch, setVehicleSearch] = useState("")
  const [assigning, setAssigning] = useState(false)

  // Status messages
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error("Error getting current user:", error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      console.log("[v0] Loading admin awards data...")

      const awardsData = await getAdminAwards(supabase)
      console.log("[v0] Loaded awards data:", awardsData)
      setAwards(awardsData)

      // Load all active vehicles for selection
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active")
        .order("entry_number")

      if (vehiclesError) {
        throw vehiclesError
      }

      console.log("[v0] Loaded vehicles data:", vehiclesData?.length, "vehicles")
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error("Error loading admin awards data:", error)
      setError(`Failed to load awards data: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignAward = async () => {
    if (!selectedCategory || !selectedVehicleId || !user?.email) {
      setError("Please select a category and vehicle")
      return
    }

    console.log("[v0] Assigning award:", { selectedCategory, selectedVehicleId, userEmail: user.email })

    setAssigning(true)
    setError("")
    setSuccess("")

    try {
      const result = await assignAdminAward(
        supabase,
        selectedCategory,
        Number.parseInt(selectedVehicleId),
        user.email,
        awardNotes,
      )

      console.log("[v0] Award assignment result:", result)

      if (result.success) {
        setSuccess(`Award assigned successfully to ${selectedCategory}`)
        setAssignDialogOpen(false)
        setSelectedCategory("")
        setSelectedVehicleId("")
        setAwardNotes("")
        setVehicleSearch("")
        await loadData()
      } else {
        setError(result.error || "Failed to assign award")
      }
    } catch (error) {
      console.error("Error assigning award:", error)
      setError(`Failed to assign award: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setAssigning(false)
    }
  }

  const handlePublishToggle = async (categoryName: string, currentlyPublished: boolean) => {
    setError("")
    setSuccess("")

    try {
      const result = await publishAdminAward(supabase, categoryName, !currentlyPublished)

      if (result.success) {
        setSuccess(`Award ${!currentlyPublished ? "published" : "unpublished"} successfully`)
        await loadData()
      } else {
        setError(result.error || "Failed to update publication status")
      }
    } catch (error) {
      console.error("Error toggling publication:", error)
      setError(`Failed to update publication status: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleRemoveAward = async (categoryName: string) => {
    if (!confirm(`Are you sure you want to remove the award for "${categoryName}"?`)) {
      return
    }

    setError("")
    setSuccess("")

    try {
      const result = await removeAdminAward(supabase, categoryName)

      if (result.success) {
        setSuccess("Award removed successfully")
        await loadData()
      } else {
        setError(result.error || "Failed to remove award")
      }
    } catch (error) {
      console.error("Error removing award:", error)
      setError(`Failed to remove award: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const getPrimaryImageUrl = (vehicle: Vehicle): string => {
    if (vehicle.image_1_url) return vehicle.image_1_url
    if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
      return vehicle.photos[0]
    }
    return `/placeholder.svg?height=100&width=150&text=${encodeURIComponent(vehicle.make + " " + vehicle.model)}`
  }

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicleSearch === "" ||
      `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.full_name} #${vehicle.entry_number}`
        .toLowerCase()
        .includes(vehicleSearch.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
        <p className="text-[#3A403D]">Loading special awards...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#3A403D] flex items-center">
            <Award className="h-6 w-6 mr-2 text-[#BF6849]" />
            Special Awards Management
          </h2>
          <p className="text-[#3A403D]/60">Assign special awards to vehicles from predefined categories</p>
        </div>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Assign Award
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Special Award</DialogTitle>
              <DialogDescription>Select a category and vehicle to assign a special award</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <Label htmlFor="category">Award Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select award category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIAL_AWARD_CATEGORIES.map((categoryName) => {
                      const existingAward = awards.find((a) => a.category_name === categoryName)
                      return (
                        <SelectItem key={categoryName} value={categoryName}>
                          {categoryName}
                          {existingAward?.vehicle && " (Currently assigned)"}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Search */}
              <div>
                <Label htmlFor="vehicle-search">Search Vehicles</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#3A403D]/40" />
                  <Input
                    id="vehicle-search"
                    placeholder="Search by entry #, make, model, or owner..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <Label htmlFor="vehicle">Select Vehicle ({filteredVehicles.length} available)</Label>
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">#{vehicle.entry_number}</span>
                          <span>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </span>
                          <span className="text-sm text-[#3A403D]/60">by {vehicle.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Vehicle Preview */}
              {selectedVehicleId && (
                <div className="border rounded-lg p-4 bg-[#F2EEEB]">
                  {(() => {
                    const vehicle = vehicles.find((v) => v.id.toString() === selectedVehicleId)
                    if (!vehicle) return null

                    return (
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-16 relative overflow-hidden rounded-lg bg-white">
                          <Image
                            src={getPrimaryImageUrl(vehicle) || "/placeholder.svg"}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#3A403D]">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h4>
                          <p className="text-sm text-[#3A403D]/80">
                            Entry #{vehicle.entry_number} • {vehicle.full_name}
                          </p>
                          <p className="text-sm text-[#3A403D]/60">
                            {vehicle.city}, {vehicle.state}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this award..."
                  value={awardNotes}
                  onChange={(e) => setAwardNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)} disabled={assigning}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignAward}
                  disabled={assigning || !selectedCategory || !selectedVehicleId}
                  className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white"
                >
                  {assigning ? "Assigning..." : "Assign Award"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Messages */}
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Awards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {awards.map((award) => (
          <Card key={award.category_name} className="bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#3A403D]">{award.category_name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {award.is_published ? (
                    <Badge className="bg-green-500 text-white">
                      <Eye className="h-3 w-3 mr-1" />
                      Published
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-400 text-gray-600">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Draft
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {award.vehicle ? (
                <div className="space-y-4">
                  {/* Winner Display */}
                  <div className="flex items-center space-x-4 p-4 bg-[#F2EEEB] rounded-lg">
                    <div className="w-20 h-16 relative overflow-hidden rounded-lg bg-white">
                      <Image
                        src={getPrimaryImageUrl(award.vehicle) || "/placeholder.svg"}
                        alt={`${award.vehicle.year} ${award.vehicle.make} ${award.vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Trophy className="h-4 w-4 text-[#BF6849]" />
                        <Badge className="bg-[#BF6849] text-white">#{award.vehicle.entry_number}</Badge>
                      </div>
                      <h4 className="font-semibold text-[#3A403D]">
                        {award.vehicle.year} {award.vehicle.make} {award.vehicle.model}
                      </h4>
                      <p className="text-sm text-[#3A403D]/80">by {award.vehicle.full_name}</p>
                      <p className="text-sm text-[#3A403D]/60">
                        {award.vehicle.city}, {award.vehicle.state}
                      </p>
                    </div>
                  </div>

                  {/* Award Details */}
                  {(award.awarded_by || award.notes) && (
                    <div className="text-sm text-[#3A403D]/80 space-y-1">
                      {award.awarded_by && (
                        <p>
                          <strong>Awarded by:</strong> {award.awarded_by}
                        </p>
                      )}
                      {award.awarded_at && (
                        <p>
                          <strong>Date:</strong> {new Date(award.awarded_at).toLocaleDateString()}
                        </p>
                      )}
                      {award.notes && (
                        <p>
                          <strong>Notes:</strong> {award.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePublishToggle(award.category_name, award.is_published)}
                      className={award.is_published ? "text-orange-600" : "text-green-600"}
                    >
                      {award.is_published ? (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory(award.category_name)
                        setSelectedVehicleId(award.vehicle!.id.toString())
                        setAwardNotes(award.notes || "")
                        setAssignDialogOpen(true)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveAward(award.category_name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#3A403D]/60">
                  <Award className="h-12 w-12 mx-auto mb-4 text-[#3A403D]/40" />
                  <p className="mb-4">No winner assigned yet</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(award.category_name)
                      setAssignDialogOpen(true)
                    }}
                    className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign Winner
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
