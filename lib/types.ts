export interface Vehicle {
  id: number
  entry_number: number
  full_name: string
  email: string
  phone?: string
  city: string
  state: string
  make: string
  model: string
  year: number
  description?: string
  photos: string[] // Keep for backward compatibility
  image_1_url?: string // Primary image
  image_2_url?: string // Secondary image
  image_3_url?: string // Third image
  image_4_url?: string // Fourth image
  image_5_url?: string // Fifth image
  profile_url: string
  qr_code_url?: string
  created_at: string
  updated_at: string
  status: "active" | "archived" // Added status field to support archiving
  category?: Category
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface Vote {
  id: number
  vehicle_id: number
  voter_ip?: string
  voter_session?: string
  created_at: string
}

export interface VotingSettings {
  voting_start: string
  voting_end: string
  is_active: boolean
}
