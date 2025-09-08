"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, LogOut, CheckCircle, Clock, Search, Users, UserCheck, UserPlus, Undo2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

const supabase = createClient()

interface Vehicle {
  id: number
  entry_number: number
  full_name: string
  make: string
  model: string
  year: number
  city: string
  state: string
  profile_url: string
  checked_in_at: string | null
  created_at: string
}

export default function CheckInPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [lastCheckedIn, setLastCheckedIn] = useState<Vehicle | null>(null)
  const [lastUndoAction, setLastUndoAction] = useState<Vehicle | null>(null)
  const [stats, setStats] = useState({
    totalVehicles: 0,
    checkedIn: 0,
    notCheckedIn: 0,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        window.location.href = "/admin/login"
        return
      }

      setUser(user)
      await loadVehicles()
    } catch (error) {
      console.error("Auth error:", error)
      window.location.href = "/admin/login"
    } finally {
      setLoading(false)
    }
  }

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, entry_number, full_name, make, model, year, city, state, profile_url, checked_in_at, created_at")
        .order("entry_number")

      if (error) throw error

      if (data) {
        setVehicles(data)

        // Calculate stats
        const checkedInCount = data.filter((v) => v.checked_in_at).length
        setStats({
          totalVehicles: data.length,
          checkedIn: checkedInCount,
          notCheckedIn: data.length - checkedInCount,
        })
      }
    } catch (error) {
      console.error("Error loading vehicles:", error)
    }
  }

  const handleManualCheckIn = async (vehicleId: number) => {
    try {
      console.log("[v0] Starting check-in for vehicle ID:", vehicleId)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      console.log("[v0] Current user:", user)
      console.log("[v0] Auth error:", authError)

      if (authError || !user) {
        alert("Authentication error. Please log in again.")
        window.location.href = "/admin/login"
        return
      }

      const { data: existingVehicle, error: fetchError } = await supabase
        .from("vehicles")
        .select("id, entry_number, full_name, checked_in_at")
        .eq("id", vehicleId)
        .single()

      console.log("[v0] Existing vehicle:", existingVehicle)
      console.log("[v0] Fetch error:", fetchError)

      if (fetchError) {
        console.error("[v0] Error fetching vehicle:", fetchError)
        alert(`Error finding vehicle: ${fetchError.message}`)
        return
      }

      if (existingVehicle?.checked_in_at) {
        alert("Vehicle is already checked in!")
        return
      }

      const timestamp = new Date().toISOString()
      console.log("[v0] Attempting to update with timestamp:", timestamp)

      const { data, error } = await supabase
        .from("vehicles")
        .update({
          checked_in_at: timestamp,
        })
        .eq("id", vehicleId)
        .select()

      console.log("[v0] Supabase update result:", { data, error })
      console.log("[v0] Update data details:", JSON.stringify(data, null, 2))
      console.log("[v0] Update error details:", JSON.stringify(error, null, 2))

      if (error) {
        console.error("[v0] Supabase error:", error)
        alert(`Check-in failed: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`)
        return
      }

      if (!data || data.length === 0) {
        console.error("[v0] No data returned from update")
        alert("Update appeared to succeed but no data was returned. Check database permissions.")
        return
      }

      console.log("[v0] Check-in successful, updated data:", data)

      const vehicle = vehicles.find((v) => v.id === vehicleId)
      if (vehicle) {
        setLastCheckedIn({ ...vehicle, checked_in_at: timestamp })
        setTimeout(() => setLastCheckedIn(null), 3000)
      }

      console.log("[v0] Reloading vehicles...")
      await loadVehicles()
      console.log("[v0] Vehicles reloaded")
    } catch (error) {
      console.error("[v0] Manual check-in error:", error)
      alert(`Check-in failed: ${error}`)
    }
  }

  const handleUndoCheckIn = async (vehicleId: number) => {
    try {
      console.log("[v0] Starting undo check-in for vehicle ID:", vehicleId)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        alert("Authentication error. Please log in again.")
        window.location.href = "/admin/login"
        return
      }

      const { data: existingVehicle, error: fetchError } = await supabase
        .from("vehicles")
        .select("id, entry_number, full_name, checked_in_at")
        .eq("id", vehicleId)
        .single()

      if (fetchError) {
        console.error("[v0] Error fetching vehicle:", fetchError)
        alert(`Error finding vehicle: ${fetchError.message}`)
        return
      }

      if (!existingVehicle?.checked_in_at) {
        alert("Vehicle is not checked in!")
        return
      }

      const { data, error } = await supabase
        .from("vehicles")
        .update({
          checked_in_at: null,
        })
        .eq("id", vehicleId)
        .select()

      if (error) {
        console.error("[v0] Supabase error:", error)
        alert(`Undo check-in failed: ${error.message}`)
        return
      }

      console.log("[v0] Undo check-in successful")

      const vehicle = vehicles.find((v) => v.id === vehicleId)
      if (vehicle) {
        setLastUndoAction({ ...vehicle, checked_in_at: null })
        setTimeout(() => setLastUndoAction(null), 3000)
      }

      await loadVehicles()
    } catch (error) {
      console.error("[v0] Undo check-in error:", error)
      alert(`Undo check-in failed: ${error}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/admin/login"
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchTerm === "" ||
      `${vehicle.entry_number} ${vehicle.full_name} ${vehicle.year} ${vehicle.make} ${vehicle.model}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "checked_in" && vehicle.checked_in_at) ||
      (statusFilter === "not_checked_in" && !vehicle.checked_in_at)

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
          <p className="text-[#3A403D]">Loading check-in system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2EEEB] to-[#E8E2DB] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <UserPlus className="h-8 w-8 text-[#BF6849]" />
            <div>
              <h1 className="text-3xl font-bold text-[#3A403D]">Vehicle Check-In</h1>
              <p className="text-[#3A403D]/60">2025 CRUISERFEST Show-N-Shine</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3A403D]/60 text-sm font-medium">Total Vehicles</p>
                  <p className="text-3xl font-bold text-[#3A403D]">{stats.totalVehicles}</p>
                </div>
                <Users className="h-12 w-12 text-[#BF6849]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3A403D]/60 text-sm font-medium">Checked In</p>
                  <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
                </div>
                <UserCheck className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3A403D]/60 text-sm font-medium">Not Checked In</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.notCheckedIn}</p>
                </div>
                <Clock className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Check-in Success */}
        {lastCheckedIn && (
          <Alert className="border-green-500 bg-green-50 mb-4">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              <strong>Successfully checked in:</strong>
              <br />
              Entry #{lastCheckedIn.entry_number} - {lastCheckedIn.year} {lastCheckedIn.make} {lastCheckedIn.model}
              <br />
              Owner: {lastCheckedIn.full_name}
            </AlertDescription>
          </Alert>
        )}

        {/* Undo Success Alert */}
        {lastUndoAction && (
          <Alert className="border-orange-500 bg-orange-50 mb-4">
            <Undo2 className="h-4 w-4 text-orange-500" />
            <AlertDescription className="text-orange-700">
              <strong>Successfully undid check-in:</strong>
              <br />
              Entry #{lastUndoAction.entry_number} - {lastUndoAction.year} {lastUndoAction.make} {lastUndoAction.model}
              <br />
              Owner: {lastUndoAction.full_name}
            </AlertDescription>
          </Alert>
        )}

        {/* Vehicle List */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[#3A403D]">Vehicle List</CardTitle>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search">Search Vehicles</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#3A403D]/40" />
                    <Input
                      id="search"
                      placeholder="Search by entry #, name, or vehicle..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* Status Filter Dropdown */}
                <div>
                  <Label htmlFor="status-filter">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vehicles</SelectItem>
                      <SelectItem value="checked_in">Checked In Only</SelectItem>
                      <SelectItem value="not_checked_in">Not Checked In Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Filter Results Summary */}
              <div className="text-sm text-[#3A403D]/60">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
                {statusFilter !== "all" && (
                  <span className="ml-2 text-[#BF6849] font-medium">
                    ({statusFilter === "checked_in" ? "Checked In" : "Not Checked In"})
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    vehicle.checked_in_at
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200 hover:border-[#BF6849]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className="bg-[#BF6849] text-white">#{vehicle.entry_number}</Badge>
                        {vehicle.checked_in_at && (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-[#3A403D]">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-[#3A403D]/80">{vehicle.full_name}</p>
                      <p className="text-sm text-[#3A403D]/60">
                        {vehicle.city}, {vehicle.state}
                      </p>
                      {vehicle.checked_in_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Checked in: {new Date(vehicle.checked_in_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {/* Conditional Buttons for Check-in and Undo */}
                    <div className="flex gap-2">
                      {!vehicle.checked_in_at ? (
                        <Button
                          size="sm"
                          onClick={() => handleManualCheckIn(vehicle.id)}
                          className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white"
                        >
                          Check In
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUndoCheckIn(vehicle.id)}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <Undo2 className="h-3 w-3 mr-1" />
                          Undo Check-In
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Empty State for Filtered Results */}
              {filteredVehicles.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-[#3A403D]/20 mx-auto mb-4" />
                  <p className="text-[#3A403D]/60">
                    {statusFilter === "all"
                      ? "No vehicles match your search criteria."
                      : `No ${statusFilter === "checked_in" ? "checked in" : "unchecked"} vehicles found.`}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
