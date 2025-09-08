"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Shield,
  Users,
  Car,
  Download,
  Eye,
  Edit,
  LogOut,
  Clock,
  Archive,
  ArchiveRestore,
  Trophy,
  BarChart3,
  RefreshCw,
} from "lucide-react"
import type { Vehicle, Vote } from "@/lib/types"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { AdminAwardsManager } from "@/components/admin-awards-manager"
import { updateVehiclePhotos } from "./actions/update-vehicle-photos"
import { archiveVehicle, unarchiveVehicle } from "./actions/archive-vehicle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const supabase = createClient()

export default function AdminPage() {
  console.log("[v0] AdminPage component is mounting...")

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalVotes: 0,
  })

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    make: "",
    model: "",
    year: "",
    description: "",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  const [editPhotos, setEditPhotos] = useState<string[]>([])
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{ [key: number]: number }>({})
  const [photoError, setPhotoError] = useState<string>("")

  const [votingSchedule, setVotingSchedule] = useState<any>(null)
  const [votingControlLoading, setVotingControlLoading] = useState(false)
  const [openDateTime, setOpenDateTime] = useState("")
  const [closeDateTime, setCloseDateTime] = useState("")
  const [resultsPublishDateTime, setResultsPublishDateTime] = useState("")
  const [resultsPublishLoading, setResultsPublishLoading] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState("")

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingScheduleUpdate, setPendingScheduleUpdate] = useState<{
    openDateTime: string
    closeDateTime: string
  } | null>(null)
  const [showResultsConfirmModal, setShowResultsConfirmModal] = useState(false)
  const [pendingResultsUpdate, setPendingResultsUpdate] = useState<{
    publishDateTime: string
    isPublishing: boolean
  } | null>(null)
  const [toastMessage, setToastMessage] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [checkinFilter, setCheckinFilter] = useState<string>("all")

  const [showArchived, setShowArchived] = useState(false)

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean
    vehicleId: number | null
    action: "archive" | "unarchive"
    title: string
    description: string
  }>({
    isOpen: false,
    vehicleId: null,
    action: "archive",
    title: "",
    description: "",
  })

  const [totalVotes, setTotalVotes] = useState(0)
  const [uniqueVoters, setUniqueVoters] = useState(0)
  const [topVehicleVotes, setTopVehicleVotes] = useState(0)
  const [topVotedVehicles, setTopVotedVehicles] = useState<any[]>([])

  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    console.log("[v0] AdminPage useEffect is running...")
    console.log("[v0] Component mounted successfully")
    checkAuth()
    setSelectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)

    const fetchVotingResults = async () => {
      try {
        const { data: votesData, error: votesError } = await supabase.from("votes").select(`
            *,
            vehicle:vehicles!votes_vehicle_id_fkey(full_name, make, model, year, entry_number)
          `)

        if (votesError) {
          console.error("Error fetching votes:", votesError)
          return
        }

        if (!votesData) {
          console.log("No votes data received")
          return
        }

        // Calculate total votes
        // setTotalVotes(votesData.length)

        // Calculate unique voters
        // const voterIPs = new Set(votesData.map((vote) => vote.voter_ip))
        // setUniqueVoters(voterIPs.size)

        // Group votes by vehicle
        // const vehicleVotes: { [key: number]: number } = {}
        // votesData.forEach((vote) => {
        //   const vehicleId = vote.vehicle_id
        //   vehicleVotes[vehicleId] = (vehicleVotes[vehicleId] || 0) + 1
        // })

        // Sort vehicles by vote count
        // const sortedVehicles = Object.entries(vehicleVotes)
        //   .sort(([, a], [, b]) => b - a)
        //   .map(([vehicleId, voteCount]) => {
        //     const vehicle = vehicles.find((v) => v.id === parseInt(vehicleId))
        //     return { ...vehicle, vote_count: voteCount }
        //   })
        //   .filter((vehicle): vehicle is Vehicle => vehicle !== undefined) as Vehicle[]

        // Set top voted vehicles
        // setTopVotedVehicles(sortedVehicles)

        // Set top vehicle votes
        // if (sortedVehicles.length > 0) {
        //   setTopVehicleVotes(sortedVehicles[0].vote_count || 0)
        // }
      } catch (error) {
        console.error("Error fetching voting results:", error)
      }
    }

    // fetchVotingResults()
  }, [])

  useEffect(() => {
    if (user) {
      loadVehicles()
      loadVotingSchedule()
      loadVotingStats()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      console.log("[v0] Starting auth check...")
      console.log("[v0] Current URL:", window.location.href)

      console.log("[v0] Supabase client:", supabase)
      console.log("[v0] Supabase client type:", typeof supabase)

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      console.log("[v0] Auth result:", {
        user: user ? { id: user.id, email: user.email } : null,
        error: error ? { message: error.message, status: error.status } : null,
      })

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()
      console.log("[v0] Session check:", {
        session: session ? { user_id: session.user?.id, expires_at: session.expires_at } : null,
        sessionError: sessionError ? { message: sessionError.message } : null,
      })

      if (error || !user) {
        console.log("[v0] No user found, would redirect to login")
        console.log("[v0] Redirect reason:", error ? "Auth error" : "No user")
        // window.location.href = "/admin/login"
        console.log("[v0] REDIRECT DISABLED FOR DEBUGGING")
        setLoading(false)
        return
      }

      console.log("[v0] User authenticated, loading admin data...")
      setUser(user)
      await loadAdminData()
    } catch (error) {
      console.error("[v0] Auth error:", error)
      // window.location.href = "/admin/login"
      console.log("[v0] REDIRECT DISABLED FOR DEBUGGING - Error:", error)
      setLoading(false)
    } finally {
      console.log("[v0] Setting loading to false")
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    try {
      console.log("[v0] Starting to load admin data...")

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(`
          *,
          votes!votes_vehicle_id_fkey(count)
        `)
        .order("created_at", { ascending: false })

      console.log("[v0] Vehicles query result:", { vehiclesData, vehiclesError })

      if (vehiclesError) {
        console.error("[v0] Error loading vehicles:", vehiclesError)
        throw vehiclesError
      }

      console.log("[v0] Number of vehicles fetched:", vehiclesData?.length || 0)

      if (vehiclesData && vehiclesData.length > 0) {
        console.log("[v0] Sample vehicle with checked_in_at:", {
          id: vehiclesData[0].id,
          full_name: vehiclesData[0].full_name,
          checked_in_at: vehiclesData[0].checked_in_at,
        })

        const checkedInVehicles = vehiclesData.filter((v) => v.checked_in_at !== null)
        console.log("[v0] Vehicles with checked_in_at:", checkedInVehicles.length)
        if (checkedInVehicles.length > 0) {
          console.log(
            "[v0] Checked in vehicles:",
            checkedInVehicles.map((v) => ({
              id: v.id,
              name: v.full_name,
              checked_in_at: v.checked_in_at,
            })),
          )
        }
      }

      setVehicles(vehiclesData || [])

      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("*")
        .order("created_at", { ascending: false })

      if (votesError) {
        console.error("[v0] Error loading votes:", votesError)
      } else {
        setVotes(votesData || [])
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (categoriesError) {
        console.error("[v0] Error loading categories:", categoriesError)
      } else {
        setCategories(categoriesData || [])
      }

      console.log("[v0] Admin data refresh completed")
    } catch (error) {
      console.error("[v0] Error in loadAdminData:", error)
    }
  }

  const loadVehicles = async () => {
    try {
      console.log("[v0] Executing vehicles query...")
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(`
          *,
          votes!votes_vehicle_id_fkey(count)
        `)
        .order("created_at", { ascending: false })

      console.log("[v0] Vehicles query result:", { vehiclesData, vehiclesError })
      console.log("[v0] Number of vehicles fetched:", vehiclesData?.length || 0)

      if (vehiclesError) {
        console.error("[v0] Error fetching vehicles:", vehiclesError)
      }

      if (vehiclesData) {
        console.log(
          "[v0] Vehicle status values:",
          vehiclesData.map((v) => ({ id: v.id, status: v.status })),
        )
        console.log(
          "[v0] Archived vehicles:",
          vehiclesData.filter((v) => v.status === "archived"),
        )

        const processedVehicles = vehiclesData.map((vehicle) => ({
          ...vehicle,
          vote_count: vehicle.votes?.[0]?.count || 0,
        }))
        console.log("[v0] Processed vehicles:", processedVehicles.length)
        setVehicles(processedVehicles)
        setStats({
          totalVehicles: vehiclesData?.filter((vehicle) => vehicle.status !== "archived").length || 0,
          totalVotes: 0,
        })
      } else {
        console.log("[v0] No vehicles data received")
        setVehicles([])
      }
    } catch (error) {
      console.error("Error loading vehicles:", error)
    }
  }

  const loadVotingSchedule = async () => {
    try {
      const { data: scheduleData } = await supabase.from("voting_schedule").select("*").eq("is_active", true).single()

      if (scheduleData) {
        setVotingSchedule(scheduleData)
        const openDate = new Date(scheduleData.voting_opens_at)
        const closeDate = new Date(scheduleData.voting_closes_at)
        setOpenDateTime(openDate.toISOString().slice(0, 16))
        setCloseDateTime(closeDate.toISOString().slice(0, 16))
        if (scheduleData.results_published_at) {
          const publishDate = new Date(scheduleData.results_published_at)
          setResultsPublishDateTime(publishDate.toISOString().slice(0, 16))
        }
      }
    } catch (error) {
      console.error("Error loading voting schedule:", error)
    }
  }

  const loadVotingStats = async () => {
    try {
      // Get all votes with vehicle information
      const { data: votesData, error: votesError } = await supabase.from("votes").select(`
          id,
          vehicle_id,
          voter_session,
          vehicle:vehicles!votes_vehicle_id_fkey(
            id,
            entry_number,
            make,
            model,
            year,
            full_name
          )
        `)

      if (votesError) {
        console.error("Error loading voting stats:", votesError)
        return
      }

      // Calculate statistics
      const totalVotesCount = votesData?.length || 0
      const uniqueVotersCount = new Set(votesData?.map((vote) => vote.voter_session)).size

      // Group votes by vehicle
      const votesByVehicle: { [key: number]: any } = {}
      votesData?.forEach((vote: any) => {
        if (!votesByVehicle[vote.vehicle_id]) {
          votesByVehicle[vote.vehicle_id] = {
            ...vote.vehicle,
            vote_count: 0,
          }
        }
        votesByVehicle[vote.vehicle_id].vote_count++
      })

      // Sort vehicles by vote count
      const sortedVehicles = Object.values(votesByVehicle).sort((a: any, b: any) => b.vote_count - a.vote_count)

      setTotalVotes(totalVotesCount)
      setUniqueVoters(uniqueVotersCount)
      setTopVehicleVotes(sortedVehicles[0]?.vote_count || 0)
      setTopVotedVehicles(sortedVehicles)
    } catch (error) {
      console.error("Error loading voting statistics:", error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/admin/login"
  }

  const exportData = async (type: string) => {
    let data: any[] = []
    let filename = ""

    switch (type) {
      case "vehicles":
        data = vehicles.map((v) => ({
          entry_number: v.entry_number,
          full_name: v.full_name,
          email: v.email,
          phone: v.phone,
          city: v.city,
          state: v.state,
          make: v.make,
          model: v.model,
          year: v.year,
          description: v.description,
          vote_count: v.vote_count,
          created_at: v.created_at,
        }))
        filename = "vehicles.csv"
        break
      case "votes":
        data = votes.map((v) => ({
          vehicle: `${v.vehicle?.year} ${v.vehicle?.make} ${v.vehicle?.model}`,
          owner: v.vehicle?.full_name,
          voter_ip: v.voter_ip,
          created_at: v.created_at,
        }))
        filename = "votes.csv"
        break
    }

    if (data.length === 0) return

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setEditFormData({
      full_name: vehicle.full_name,
      email: vehicle.email,
      phone: vehicle.phone || "",
      city: vehicle.city,
      state: vehicle.state,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year.toString(),
      description: vehicle.description || "",
    })
    setEditPhotos(vehicle.photos || [])
    setNewPhotoFiles([])
    setPhotoPreviewUrls([])
    setPhotoError("")
    setPhotoUploadProgress({})
  }

  const validatePhotoFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Only JPEG, PNG, and WebP images are supported.`,
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File too large. Maximum size is 5MB.`,
      }
    }

    return { isValid: true }
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const files = Array.from(e.target.files)
    const totalPhotos = editPhotos.length + newPhotoFiles.length + files.length

    if (totalPhotos > 5) {
      setPhotoError(`Maximum 5 photos allowed. You currently have ${editPhotos.length + newPhotoFiles.length} photos.`)
      return
    }

    const validFiles: File[] = []
    let hasError = false

    for (const file of files) {
      const validation = validatePhotoFile(file)
      if (!validation.isValid) {
        setPhotoError(validation.error!)
        hasError = true
        break
      }
      validFiles.push(file)
    }

    if (!hasError && validFiles.length > 0) {
      setNewPhotoFiles([...newPhotoFiles, ...validFiles])
      const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file))
      setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls])
      setPhotoError("")
    }

    e.target.value = ""
  }

  const handlePhotoRemove = (index: number, isExisting: boolean) => {
    if (isExisting) {
      // Remove from existing photos
      const newEditPhotos = editPhotos.filter((_, i) => i !== index)
      setEditPhotos(newEditPhotos)
    } else {
      // Remove from new photos
      const adjustedIndex = index - editPhotos.length
      const newFiles = newPhotoFiles.filter((_, i) => i !== adjustedIndex)
      const newPreviews = photoPreviewUrls.filter((_, i) => i !== adjustedIndex)

      // Revoke the URL to prevent memory leaks
      if (photoPreviewUrls[adjustedIndex]) {
        URL.revokeObjectURL(photoPreviewUrls[adjustedIndex])
      }

      setNewPhotoFiles(newFiles)
      setPhotoPreviewUrls(newPreviews)
    }
    setPhotoError("")
  }

  const handleSaveEdit = async () => {
    if (!editingVehicle) return

    setEditLoading(true)
    setPhotoError("")

    try {
      // Handle photo updates if there are changes
      if (newPhotoFiles.length > 0 || editPhotos.length !== editingVehicle.photos?.length) {
        const photoFormData = new FormData()

        // Add flags for existing photos to keep
        editPhotos.forEach((_, index) => {
          photoFormData.append(`keep_photo_${index}`, "true")
        })

        // Add new photo files
        newPhotoFiles.forEach((file, index) => {
          photoFormData.append(`new_photo_${index}`, file)
          setPhotoUploadProgress((prev) => ({ ...prev, [index]: 0 }))
        })

        console.log("[v0] Calling updateVehiclePhotos server action")

        let photoResult
        try {
          photoResult = await updateVehiclePhotos(editingVehicle.id, photoFormData)
        } catch (serverError) {
          console.error("[v0] Server action failed:", serverError)

          // Check if it's a 413 error (Request Entity Too Large)
          if (serverError instanceof Error && serverError.message.includes("413")) {
            setPhotoError("Files are too large. Please reduce image sizes and try again. Maximum total size is 10MB.")
          } else if (serverError instanceof Error && serverError.message.includes("timeout")) {
            setPhotoError("Upload timed out. Please check your connection and try again.")
          } else {
            setPhotoError("Upload failed. Please check your internet connection and try again.")
          }
          return
        }

        if (!photoResult || typeof photoResult !== "object") {
          console.error("[v0] Invalid response from server action:", photoResult)
          setPhotoError("Upload failed due to server error. Please try again.")
          return
        }

        if (!photoResult.success) {
          console.error("[v0] Photo update failed:", photoResult.error)
          setPhotoError(photoResult.error || "Failed to update photos")
          return
        }

        // Update progress to 100% for all uploads
        newPhotoFiles.forEach((_, index) => {
          setPhotoUploadProgress((prev) => ({ ...prev, [index]: 100 }))
        })
      }

      // Prepare update data for vehicle info (excluding photos since they're handled above)
      const updateData: any = {
        full_name: editFormData.full_name,
        email: editFormData.email,
        phone: editFormData.phone || null,
        city: editFormData.city,
        state: editFormData.state,
        make: editFormData.make,
        model: editFormData.model,
        year: Number.parseInt(editFormData.year),
        description: editFormData.description || null,
      }

      const { error } = await supabase.from("vehicles").update(updateData).eq("id", editingVehicle.id)

      if (error) throw error

      // Refresh the data
      await loadAdminData()

      setEditSuccess(true)
      setToastMessage("Vehicle updated successfully!")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)

      setTimeout(() => {
        setEditingVehicle(null)
        setEditSuccess(false)
        setEditFormData({
          full_name: "",
          email: "",
          phone: "",
          city: "",
          state: "",
          make: "",
          model: "",
          year: "",
          description: "",
        })
        setEditPhotos([])
        setNewPhotoFiles([])
        setPhotoPreviewUrls([])
        setPhotoError("")
        setPhotoUploadProgress({})
      }, 2500)
    } catch (error) {
      console.error("Error updating vehicle:", error)
      setToastMessage("Failed to update vehicle. Please try again.")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setEditLoading(false)
      setPhotoUploadProgress({})
    }
  }

  const handlePrintRegistrationCard = (vehicle: Vehicle) => {
    // Generate QR code URL
    const qrCodeUrl = `${window.location.origin}/vehicle/${vehicle.profile_url}`

    // Generate QR code as data URL first
    let qrCodeDataUrl = ""

    // Create a temporary canvas to generate QR code
    const canvas = document.createElement("canvas")
    canvas.width = 150
    canvas.height = 150

    // Import QRCode dynamically and generate the card
    import("qrcode")
      .then((QRCode) => {
        QRCode.toCanvas(
          canvas,
          qrCodeUrl,
          {
            width: 150,
            height: 150,
            margin: 0,
          },
          (error) => {
            if (!error) {
              qrCodeDataUrl = canvas.toDataURL()
            }
            openPrintWindow(vehicle, qrCodeDataUrl)
          },
        )
      })
      .catch(() => {
        // Fallback without QR code
        openPrintWindow(vehicle, "")
      })
  }

  const openPrintWindow = (vehicle: Vehicle, qrCodeDataUrl: string) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Vehicle Display Card - Entry #${vehicle.entry_number}</title>
  <style>
    @page {
      size: 8.5in 11in;
      margin: 0.5in;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card-container {
      width: 6in;
      height: 5in;
      position: relative;
      background: white;
    }
    .cut-border {
      width: 6in;
      height: 5in;
      border: 2px dashed #666;
      border-radius: 8px;
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: border-box;
    }
    .card {
      width: 6in;
      height: 5in;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      padding: 30px 20px;
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: inset 0 0 0 1px #dee2e6;
      position: relative;
      z-index: 1;
    }
    .header-section {
      width: 100%;
      flex-shrink: 0;
    }
    .event-title {
      font-size: 18px;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 8px 0;
      line-height: 1.2;
      letter-spacing: 0.5px;
    }
    .event-subtitle {
      font-size: 12px;
      font-weight: 500;
      color: #6c757d;
      margin: 0 0 15px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .main-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    .entry-number {
      font-size: 42px;
      font-weight: 900;
      color: #BF6849;
      margin: 0 0 12px 0;
      line-height: 1;
      text-shadow: 0 2px 4px rgba(191, 104, 73, 0.2);
    }
    .vehicle-info {
      font-size: 22px;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }
    .owner-info {
      font-size: 14px;
      color: #6c757d;
      margin: 0 0 20px 0;
      line-height: 1.3;
      font-weight: 500;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .qr-code {
      border: 2px solid #2c3e50;
      padding: 6px;
      background: white;
      display: inline-block;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .qr-text {
      font-size: 12px;
      color: #2c3e50;
      font-weight: 600;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-section {
      width: 100%;
      flex-shrink: 0;
      border-top: 1px solid #dee2e6;
      padding-top: 12px;
      margin-top: 15px;
    }
    .footer-text {
      font-size: 10px;
      color: #6c757d;
      margin: 0;
      font-weight: 500;
    }
    .decorative-line {
      width: 60px;
      height: 2px;
      background: #BF6849;
      margin: 8px auto;
      border-radius: 1px;
    }
    /* Print-specific styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .card {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="cut-border"></div>
    <div class="card">
      <div class="header-section">
        <h1 class="event-title">2025 CRUISERFEST</h1>
        <p class="event-subtitle">Show-N-Shine</p>
        <div class="decorative-line"></div>
      </div>
      
      <div class="main-section">
        <div class="entry-number">#${vehicle.entry_number}</div>
        
        <div class="vehicle-info">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
        
        <div class="owner-info">
          ${vehicle.full_name}<br>
          ${vehicle.city}, ${vehicle.state}
        </div>
        
        ${
          qrCodeDataUrl
            ? `
        <div class="qr-section">
          <div class="qr-code">
            <img src="${qrCodeDataUrl}" width="100" height="100" alt="QR Code" />
          </div>
          <p class="qr-text">Scan to Vote</p>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="footer-section">
        <p class="footer-text">Land Cruiser Heritage Museum • Salt Lake City, Utah</p>
      </div>
    </div>
  </div>
</body>
</html>
`

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Wait a moment then focus and print
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
  }

  const handleUpdateVotingSchedule = async () => {
    if (!openDateTime || !closeDateTime) {
      setToastMessage("Please set both open and close times")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

    if (new Date(openDateTime) >= new Date(closeDateTime)) {
      setToastMessage("Open time must be before close time")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

    // Store the pending update and show confirmation modal
    setPendingScheduleUpdate({ openDateTime, closeDateTime })
    setShowConfirmModal(true)
  }

  const confirmVotingScheduleUpdate = async () => {
    if (!pendingScheduleUpdate) return

    setVotingControlLoading(true)
    try {
      const { openDateTime, closeDateTime } = pendingScheduleUpdate

      if (votingSchedule) {
        // Update existing schedule
        const { error } = await supabase
          .from("voting_schedule")
          .update({
            voting_opens_at: openDateTime,
            voting_closes_at: closeDateTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", votingSchedule.id)

        if (error) throw error
      } else {
        // Create new schedule
        const { error } = await supabase.from("voting_schedule").insert({
          voting_opens_at: openDateTime,
          voting_closes_at: closeDateTime,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
      }

      setToastMessage("Voting schedule updated successfully")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)

      // Reload the schedule to reflect changes
      await loadVotingSchedule()

      setShowConfirmModal(false)
      setPendingScheduleUpdate(null)
    } catch (error) {
      console.error("Error updating voting schedule:", error)
      setToastMessage("Failed to update voting schedule")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setVotingControlLoading(false)
    }
  }

  const handlePublishResults = async (publishNow = false) => {
    if (!publishNow && !resultsPublishDateTime) {
      setToastMessage("Please set a publication time")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

    const publishDateTime = publishNow ? new Date().toISOString() : new Date(resultsPublishDateTime).toISOString()

    setPendingResultsUpdate({
      publishDateTime,
      isPublishing: publishNow,
    })
    setShowResultsConfirmModal(true)
  }

  const confirmResultsPublication = async () => {
    if (!pendingResultsUpdate) return

    setResultsPublishLoading(true)
    try {
      const { error } = await supabase.from("voting_schedule").upsert({
        id: votingSchedule?.id || undefined,
        voting_opens_at: votingSchedule?.voting_opens_at,
        voting_closes_at: votingSchedule?.voting_closes_at,
        results_published_at: pendingResultsUpdate.publishDateTime,
        results_are_published: pendingResultsUpdate.isPublishing,
        is_active: true,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      await loadAdminData()
      setToastMessage(
        pendingResultsUpdate.isPublishing ? "Results published successfully!" : "Results publication scheduled!",
      )
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      setShowResultsConfirmModal(false)
      setPendingResultsUpdate(null)
    } catch (error) {
      console.error("Error updating results publication:", error)
      setToastMessage("Failed to update results publication")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setResultsPublishLoading(false)
    }
  }

  const handleUnpublishResults = async () => {
    setResultsPublishLoading(true)
    try {
      const { error } = await supabase.from("voting_schedule").upsert({
        id: votingSchedule?.id || undefined,
        voting_opens_at: votingSchedule?.voting_opens_at,
        voting_closes_at: votingSchedule?.voting_closes_at,
        results_published_at: null,
        results_are_published: false,
        is_active: true,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      await loadAdminData()
      setResultsPublishDateTime("")
      setToastMessage("Results unpublished successfully!")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (error) {
      console.error("Error unpublishing results:", error)
      setToastMessage("Failed to unpublish results")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } finally {
      setResultsPublishLoading(false)
    }
  }

  const getVotingStatus = () => {
    if (!votingSchedule) return { status: "unknown", message: "No schedule set" }

    const now = new Date()
    const opensAt = new Date(votingSchedule.voting_opens_at)
    const closesAt = new Date(votingSchedule.voting_closes_at)

    if (now < opensAt) {
      return { status: "closed", message: "Voting not yet open" }
    } else if (now >= opensAt && now < closesAt) {
      return { status: "open", message: "Voting is currently open" }
    } else {
      return { status: "closed", message: "Voting has ended" }
    }
  }

  const getResultsStatus = () => {
    if (!votingSchedule) return { status: "unknown", message: "No schedule set" }

    const now = new Date()
    const publishedAt = votingSchedule.results_published_at ? new Date(votingSchedule.results_published_at) : null

    if (votingSchedule.results_are_published) {
      return { status: "published", message: "Results are live" }
    } else if (publishedAt && now < publishedAt) {
      return { status: "scheduled", message: "Results publication scheduled" }
    } else {
      return { status: "hidden", message: "Results are hidden" }
    }
  }

  const formatDateInTimezone = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      timeZone: selectedTimezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })
  }

  const getTimezoneOptions = () => {
    const timezones = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Phoenix",
      "America/Anchorage",
      "Pacific/Honolulu",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Australia/Sydney",
      "UTC",
    ]

    // Add user's detected timezone if not in list
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!timezones.includes(userTz)) {
      timezones.unshift(userTz)
    }

    return timezones.sort()
  }

  const handleArchiveVehicle = async (vehicleId: number) => {
    console.log("[v0] Archive button clicked for vehicle ID:", vehicleId)
    setConfirmationModal({
      isOpen: true,
      vehicleId,
      action: "archive",
      title: "Archive Vehicle",
      description:
        "Are you sure you want to archive this vehicle? It will be hidden from the public view and won't count toward the registration limit.",
    })
  }

  const handleUnarchiveVehicle = async (vehicleId: number) => {
    console.log("[v0] Unarchive button clicked for vehicle ID:", vehicleId)
    setConfirmationModal({
      isOpen: true,
      vehicleId,
      action: "unarchive",
      title: "Restore Vehicle",
      description: "Are you sure you want to restore this vehicle? It will be visible to the public again.",
    })
  }

  const handleConfirmAction = async () => {
    if (!confirmationModal.vehicleId) return

    try {
      console.log(`[v0] Executing ${confirmationModal.action} for vehicle ${confirmationModal.vehicleId}`)

      const result =
        confirmationModal.action === "archive"
          ? await archiveVehicle(confirmationModal.vehicleId)
          : await unarchiveVehicle(confirmationModal.vehicleId)

      console.log("[v0] Action result:", result)

      if (result.success) {
        console.log("[v0] Action successful, refreshing page...")
        setConfirmationModal({ isOpen: false, vehicleId: null, action: "archive", title: "", description: "" })
        setTimeout(() => window.location.reload(), 500)
      } else {
        console.error("[v0] Action failed:", result.error)
        alert(`Error: ${result.error || `Failed to ${confirmationModal.action} vehicle`}`)
        setConfirmationModal({ isOpen: false, vehicleId: null, action: "archive", title: "", description: "" })
      }
    } catch (error) {
      console.error("[v0] Action error:", error)
      alert("An unexpected error occurred")
      setConfirmationModal({ isOpen: false, vehicleId: null, action: "archive", title: "", description: "" })
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) =>
    showArchived ? vehicle.status === "archived" : vehicle.status !== "archived",
  )

  const activeVehicleCount = vehicles.filter((vehicle) => vehicle.status !== "archived").length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
          <p className="text-[#3A403D]">Loading admin panel...</p>
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
            <Shield className="h-8 w-8 text-[#BF6849]" />
            <div>
              <h1 className="text-3xl font-bold text-[#3A403D]">Admin Dashboard</h1>
              <p className="text-[#3A403D]/60">2025 CRUISERFEST Show-N-Shine Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[#3A403D]/80">Welcome, {user?.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3A403D]/60 text-sm font-medium">Total Vehicles</p>
                  <p className="text-3xl font-bold text-[#3A403D]">{stats.totalVehicles}</p>
                </div>
                <Car className="h-12 w-12 text-[#BF6849]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3A403D]/60 text-sm font-medium">Total Votes</p>
                  <p className="text-3xl font-bold text-[#3A403D]">{totalVotes}</p>
                </div>
                <Users className="h-12 w-12 text-[#A9BF88]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3A403D]/60 text-sm font-medium">Voting Status</p>
                  <p className="text-lg font-bold text-[#3A403D]">{getVotingStatus().message}</p>
                </div>
                <Clock
                  className={`h-12 w-12 ${getVotingStatus().status === "open" ? "text-green-500" : "text-[#BF6849]"}`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Stats Card */}
        <Card className="bg-white shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-[#3A403D]">Registration Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#BF6849]">{activeVehicleCount}</p>
                <p className="text-sm text-[#3A403D]/60">Active Registrations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#3A403D]">{50 - activeVehicleCount}</p>
                <p className="text-sm text-[#3A403D]/60">Spots Remaining</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#3A403D]/60">
                  {(() => {
                    const archivedCount = vehicles.filter((v) => v.status === "archived").length
                    console.log("[v0] Archived count calculation:", archivedCount)
                    console.log(
                      "[v0] All vehicle statuses:",
                      vehicles.map((v) => v.status),
                    )
                    return archivedCount
                  })()}
                </p>
                <p className="text-sm text-[#3A403D]/60">Archived</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#3A403D]">{vehicles.length}</p>
                <p className="text-sm text-[#3A403D]/60">Total Ever</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="vehicles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="voting">Voting Results</TabsTrigger>
            <TabsTrigger value="results-control">Results Control</TabsTrigger>
            <TabsTrigger value="awards">Special Awards</TabsTrigger>
            <TabsTrigger value="checkin">Check-In</TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-[#3A403D]">Vehicle Registrations</CardTitle>
                    <CardDescription>Manage all registered vehicles</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowArchived(!showArchived)}
                      variant={showArchived ? "default" : "outline"}
                      className={showArchived ? "bg-[#BF6849] hover:bg-[#BF6849]/90" : ""}
                    >
                      {showArchived ? (
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                      ) : (
                        <Archive className="h-4 w-4 mr-2" />
                      )}
                      {showArchived ? "Show Active" : "Show Archived"}
                    </Button>
                    <Button onClick={() => exportData("vehicles")} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entry #</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Photos</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id} className={vehicle.status === "archived" ? "opacity-60" : ""}>
                          <TableCell>
                            <Badge className="bg-[#BF6849] text-white">#{vehicle.entry_number}</Badge>
                            {vehicle.status === "archived" && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Archived
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-[#3A403D]">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-[#3A403D]">{vehicle.photos?.length || 0}</span>
                              <span className="text-xs text-[#3A403D]/60">photos</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#3A403D]">{vehicle.full_name}</p>
                              <p className="text-sm text-[#3A403D]/60">{vehicle.email}</p>
                              {vehicle.phone && <p className="text-sm text-[#3A403D]/60">{vehicle.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-[#3A403D]">
                              {vehicle.city}, {vehicle.state}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-[#BF6849]">{vehicle.vote_count || 0}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/vehicle/${vehicle.profile_url}`}>
                                  <Eye className="h-3 w-3" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditVehicle(vehicle)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintRegistrationCard(vehicle)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              {vehicle.status === "archived" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnarchiveVehicle(vehicle.id)}
                                  className="text-green-600 hover:text-green-700 bg-transparent"
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    console.log("[v0] Archive button clicked, vehicle:", vehicle)
                                    handleArchiveVehicle(vehicle.id)
                                  }}
                                  className="text-red-600 hover:text-red-700 bg-transparent"
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voting Results Tab */}
          <TabsContent value="voting">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-[#3A403D] flex items-center">
                      <Trophy className="h-6 w-6 mr-2 text-[#BF6849]" />
                      Best in Show Voting Results
                    </CardTitle>
                    <CardDescription>Live voting results and statistics</CardDescription>
                  </div>
                  <Button asChild className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                    <Link href="/admin/votes">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Results
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-[#F2EEEB] rounded-lg p-4">
                    <div className="flex items-center">
                      <BarChart3 className="h-8 w-8 text-[#BF6849] mr-4" />
                      <div>
                        <p className="text-2xl font-bold text-[#3A403D]">{totalVotes}</p>
                        <p className="text-[#3A403D]/80">Total Votes Cast</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F2EEEB] rounded-lg p-4">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-[#A9BF88] mr-4" />
                      <div>
                        <p className="text-2xl font-bold text-[#3A403D]">{uniqueVoters}</p>
                        <p className="text-[#3A403D]/80">Unique Voters</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F2EEEB] rounded-lg p-4">
                    <div className="flex items-center">
                      <Trophy className="h-8 w-8 text-yellow-500 mr-4" />
                      <div>
                        <p className="text-2xl font-bold text-[#3A403D]">{topVehicleVotes}</p>
                        <p className="text-[#3A403D]/80">Leading Vehicle</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top 5 Vehicles Preview */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-[#3A403D] mb-4">Top 5 Vehicles</h3>
                  {topVotedVehicles.slice(0, 5).map((vehicle, index) => (
                    <div
                      key={vehicle.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0
                          ? "border-yellow-400 bg-yellow-50"
                          : index === 1
                            ? "border-gray-400 bg-gray-50"
                            : index === 2
                              ? "border-amber-600 bg-amber-50"
                              : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3A403D] text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className="bg-[#BF6849] text-white text-xs">#{vehicle.entry_number}</Badge>
                            {index < 3 && (
                              <Badge
                                className={`text-xs ${
                                  index === 0
                                    ? "bg-yellow-500 text-white"
                                    : index === 1
                                      ? "bg-gray-500 text-white"
                                      : "bg-amber-600 text-white"
                                }`}
                              >
                                {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-[#3A403D] text-sm">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-[#3A403D]/80 text-xs">by {vehicle.full_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#BF6849]">{vehicle.vote_count}</p>
                        <p className="text-[#3A403D]/80 text-xs">{vehicle.vote_count === 1 ? "vote" : "votes"}</p>
                      </div>
                    </div>
                  ))}
                  {topVotedVehicles.length === 0 && (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-[#3A403D]/20 mx-auto mb-4" />
                      <p className="text-[#3A403D]/60">No votes have been cast yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Control Tab */}
          <TabsContent value="results-control">
            <Card>
              <CardHeader>
                <CardTitle>Results Control</CardTitle>
                <CardDescription>Manage results publication and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Voting Schedule Management */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Voting Schedule</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="voting-opens">Voting Opens</Label>
                        <Input
                          id="voting-opens"
                          type="datetime-local"
                          value={openDateTime}
                          onChange={(e) => setOpenDateTime(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="voting-closes">Voting Closes</Label>
                        <Input
                          id="voting-closes"
                          type="datetime-local"
                          value={closeDateTime}
                          onChange={(e) => setCloseDateTime(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Current Schedule Status */}
                    {votingSchedule ? (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Current Schedule:</p>
                        <p className="text-sm text-blue-700">
                          Opens: {new Date(votingSchedule.voting_opens_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-700">
                          Closes: {new Date(votingSchedule.voting_closes_at).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">No voting schedule set</p>
                      </div>
                    )}

                    <Button
                      onClick={handleUpdateVotingSchedule}
                      disabled={votingControlLoading}
                      className="bg-[#BF6849] hover:bg-[#BF6849]/90"
                    >
                      {votingControlLoading ? "Updating..." : "Update Voting Schedule"}
                    </Button>
                  </div>
                </div>

                {/* Current Results Status */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Current Results Status</h3>
                  {votingSchedule?.results_are_published ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Results are published
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Published at: {new Date(votingSchedule.results_published_at).toLocaleString()}
                      </p>
                      <Button
                        onClick={handleUnpublishResults}
                        disabled={resultsPublishLoading}
                        variant="outline"
                        size="sm"
                      >
                        {resultsPublishLoading ? "Unpublishing..." : "Unpublish Results"}
                      </Button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      Results are not published
                    </div>
                  )}
                </div>

                {/* Publication Controls */}
                {!votingSchedule?.results_are_published && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Publish Results</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="results-datetime">Schedule Publication Time (Optional)</Label>
                        <Input
                          id="results-datetime"
                          type="datetime-local"
                          value={resultsPublishDateTime}
                          onChange={(e) => setResultsPublishDateTime(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handlePublishResults(true)} disabled={resultsPublishLoading}>
                          {resultsPublishLoading ? "Publishing..." : "Publish Now"}
                        </Button>
                        <Button
                          onClick={() => handlePublishResults(false)}
                          disabled={resultsPublishLoading || !resultsPublishDateTime}
                          variant="outline"
                        >
                          Schedule Publication
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Awards Tab */}
          <TabsContent value="awards">
            <AdminAwardsManager />
          </TabsContent>

          {/* Check-In Tab */}
          <TabsContent value="checkin">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Check-In</CardTitle>
                <CardDescription>Manage vehicle arrivals and check-in status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Total Registered: <span className="font-semibold">{stats.totalVehicles}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAdminData}
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                      <Label htmlFor="checkin-filter" className="text-sm">
                        Filter:
                      </Label>
                      <Select value={checkinFilter} onValueChange={setCheckinFilter}>
                        <SelectTrigger className="w-48">
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

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Owner</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Registration Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicles
                          .filter((v) => v.status !== "archived")
                          .filter((v) => {
                            if (checkinFilter === "all") return true
                            if (checkinFilter === "checked_in") return v.checked_in_at !== null
                            if (checkinFilter === "not_checked_in") return v.checked_in_at === null
                            return true
                          })
                          .map((vehicle) => (
                            <TableRow key={vehicle.id}>
                              <TableCell className="font-medium">{vehicle.full_name}</TableCell>
                              <TableCell>
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </TableCell>
                              <TableCell>{new Date(vehicle.created_at).toLocaleString()}</TableCell>
                              <TableCell>
                                <div
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    vehicle.checked_in_at
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {vehicle.checked_in_at ? "Checked In" : "Registered"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={vehicle.checked_in_at ? "outline" : "default"}
                                  onClick={async () => {
                                    console.log(
                                      "[v0] Check-in button clicked for vehicle:",
                                      vehicle.id,
                                      "Current checked_in_at:",
                                      vehicle.checked_in_at,
                                    )

                                    const newCheckedInAt = vehicle.checked_in_at ? null : new Date().toISOString()
                                    console.log("[v0] Updating checked_in_at to:", newCheckedInAt)

                                    const { error } = await supabase
                                      .from("vehicles")
                                      .update({ checked_in_at: newCheckedInAt })
                                      .eq("id", vehicle.id)

                                    console.log("[v0] Update result:", { error })

                                    if (error) {
                                      console.error("[v0] Status update failed:", error.message)
                                      setAlert({
                                        type: "error",
                                        message: `Failed to update check-in status: ${error.message}`,
                                      })
                                    } else {
                                      console.log("[v0] Check-in update successful, reloading data...")
                                      await loadAdminData()

                                      setAlert({
                                        type: "success",
                                        message: vehicle.checked_in_at
                                          ? `${vehicle.full_name} checked out successfully`
                                          : `${vehicle.full_name} checked in successfully`,
                                      })

                                      setTimeout(() => setAlert(null), 3000)
                                    }
                                  }}
                                >
                                  {vehicle.checked_in_at ? "Undo Check-In" : "Check In"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {
                      vehicles
                        .filter((v) => v.status !== "archived")
                        .filter((v) => {
                          if (checkinFilter === "all") return true
                          if (checkinFilter === "checked_in") return v.checked_in_at !== null
                          if (checkinFilter === "not_checked_in") return v.checked_in_at === null
                          return true
                        }).length
                    }{" "}
                    of {vehicles.filter((v) => v.status !== "archived").length} vehicles
                    {checkinFilter !== "all" && (
                      <span className="ml-2 font-medium">
                        ({checkinFilter === "checked_in" ? "Checked In" : "Not Checked In"})
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Vehicle Modal */}
      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent className="sm:max-w-[825px]">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>Make changes to the vehicle registration</DialogDescription>
          </DialogHeader>
          {editingVehicle && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={editFormData.year}
                    onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    value={editFormData.make}
                    onChange={(e) => setEditFormData({ ...editFormData, make: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              {/* Photo Management */}
              <div>
                <Label>Photos</Label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {editPhotos.map((photo, index) => (
                    <div key={`existing-${index}`} className="relative w-32 h-32 rounded-md overflow-hidden">
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Vehicle Photo ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md"
                        onClick={() => handlePhotoRemove(index, true)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="sr-only">Remove photo</span>
                      </Button>
                    </div>
                  ))}
                  {photoPreviewUrls.map((previewUrl, index) => (
                    <div key={`new-${index}`} className="relative w-32 h-32 rounded-md overflow-hidden">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt={`New Vehicle Photo ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md"
                        onClick={() => handlePhotoRemove(editPhotos.length + index, false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="sr-only">Remove photo</span>
                      </Button>
                    </div>
                  ))}
                  {editPhotos.length + newPhotoFiles.length < 5 && (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center">
                      <Label htmlFor="add-photo" className="cursor-pointer">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6 text-gray-500"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <input
                          type="file"
                          id="add-photo"
                          className="hidden"
                          multiple
                          onChange={handlePhotoAdd}
                          accept="image/jpeg, image/jpg, image/png, image/webp"
                        />
                      </Label>
                    </div>
                  )}
                </div>
                {photoError && <p className="text-red-500 text-sm mt-1">{photoError}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditingVehicle(null)} disabled={editLoading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={editLoading}
              className="bg-[#BF6849] hover:bg-[#BF6849]/90"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={confirmationModal.isOpen}
        onOpenChange={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmationModal.title}</DialogTitle>
            <DialogDescription>{confirmationModal.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              className={
                confirmationModal.action === "archive"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voting Schedule Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={() => setShowConfirmModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Voting Schedule Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the voting schedule? This will affect when users can vote.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmVotingScheduleUpdate}
              disabled={votingControlLoading}
              className="bg-[#BF6849] hover:bg-[#BF6849]/90"
            >
              {votingControlLoading ? "Updating..." : "Update Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Publication Confirmation Modal */}
      <Dialog open={showResultsConfirmModal} onOpenChange={() => setShowResultsConfirmModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Results Publication</DialogTitle>
            <DialogDescription>
              Are you sure you want to publish the results? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowResultsConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmResultsPublication}
              disabled={resultsPublishLoading}
              className="bg-[#BF6849] hover:bg-[#BF6849]/90"
            >
              {resultsPublishLoading ? "Publishing..." : "Publish Results"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white py-2 px-4 rounded-md shadow-lg z-50">
          {toastMessage}
        </div>
      )}

      {/* Alert */}
      {alert && (
        <div
          className={`fixed bottom-4 left-4 py-2 px-4 rounded-md shadow-lg z-50 ${
            alert.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {alert.message}
        </div>
      )}
    </div>
  )
}
