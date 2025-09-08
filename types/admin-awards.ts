import type { Vehicle } from "@/lib/types"

export interface AdminAward {
  id: number
  category_name: string
  vehicle_id: number | null
  awarded_by: string | null
  awarded_at: string
  notes: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  vehicle?: Vehicle // Optional joined vehicle data from Supabase query
}
