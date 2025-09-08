import { executeQuery } from "@/utils/neon/client"
import { voterTracker } from "@/lib/voter-tracking"

export interface VoteResult {
  success: boolean
  action: "created" | "already_voted"
  voteId?: number
  error?: string
}

export interface CurrentVote {
  id: number
  vehicle_id: number
  voter_ip: string
  voter_session: string
  created_at: string
  updated_at: string
  vehicle?: {
    id: number
    entry_number: number
    make: string
    model: string
    year: number
    full_name: string
    city?: string
    state?: string
  }
}

// Get the current user's vote (since there's only one vote per user now)
export async function getCurrentVote(): Promise<CurrentVote | null> {
  try {
    // Get voter fingerprint using the existing voter tracking system
    const voterFingerprint = await voterTracker.getVoterFingerprint()

    console.log("Checking for existing vote:", {
      voterFingerprint: voterFingerprint.substring(0, 10) + "...",
    })

    const { data, error } = await executeQuery(
      `
      SELECT v.*, 
             vh.id as vehicle_id, vh.entry_number, vh.vehicle_make as make, 
             vh.vehicle_model as model, vh.vehicle_year as year, vh.owner_name as full_name
      FROM votes v
      LEFT JOIN vehicles vh ON v.vehicle_id = vh.id
      WHERE v.voter_session = $1
      LIMIT 1
    `,
      [voterFingerprint],
    )

    if (error) {
      console.error("Error fetching current vote:", error)
      return null
    }

    console.log("Current vote found:", data)
    return data && data.length > 0
      ? {
          ...data[0],
          vehicle: {
            id: data[0].vehicle_id,
            entry_number: data[0].entry_number,
            make: data[0].make,
            model: data[0].model,
            year: data[0].year,
            full_name: data[0].full_name,
          },
        }
      : null
  } catch (error) {
    console.error("Error in getCurrentVote:", error)
    return null
  }
}

// Cast a new vote (only if user hasn't voted yet)
export async function castVote(vehicleId: number): Promise<VoteResult> {
  try {
    // Get voter fingerprint using the existing voter tracking system
    const voterFingerprint = await voterTracker.getVoterFingerprint()

    console.log("Attempting to cast vote:", {
      vehicleId,
      voterFingerprint: voterFingerprint.substring(0, 10) + "...",
    })

    // First, check if a vote already exists for this voter
    const { data: existingVote, error: fetchError } = await executeQuery(
      `
      SELECT id, vehicle_id FROM votes WHERE voter_session = $1 LIMIT 1
    `,
      [voterFingerprint],
    )

    if (fetchError) {
      console.error("Error checking existing vote:", fetchError)
      return {
        success: false,
        action: "created",
        error: `Failed to check existing vote: ${fetchError.message}`,
      }
    }

    if (existingVote && existingVote.length > 0) {
      // User has already voted - don't allow another vote
      console.log("User has already voted:", existingVote[0].id)
      return {
        success: false,
        action: "already_voted",
        voteId: existingVote[0].id,
        error: "You have already voted for Best in Show. Each voter can only vote once.",
      }
    }

    // No existing vote - create new one
    console.log("Creating new vote")

    const { data: newVote, error: insertError } = await executeQuery(
      `
      INSERT INTO votes (vehicle_id, voter_ip, voter_session, category_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
      [vehicleId, voterFingerprint, voterFingerprint, 25],
    ) // Best of Show category

    if (insertError) {
      console.error("Error creating vote:", insertError)

      // Handle duplicate key constraint violation (race condition)
      if (insertError.message && insertError.message.includes("duplicate key")) {
        console.log("Duplicate key detected - user already voted")
        return {
          success: false,
          action: "already_voted",
          error: "You have already voted for Best in Show. Each voter can only vote once.",
        }
      }

      return {
        success: false,
        action: "created",
        error: `Failed to create vote: ${insertError.message}`,
      }
    }

    if (!newVote || newVote.length === 0) {
      return {
        success: false,
        action: "created",
        error: "Vote was not created - no data returned",
      }
    }

    console.log("Vote created successfully:", newVote[0])
    return {
      success: true,
      action: "created",
      voteId: newVote[0].id,
    }
  } catch (error) {
    console.error("Unexpected error in castVote:", error)
    return {
      success: false,
      action: "created",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Get vote count for a specific vehicle
export async function getVoteCount(vehicleId: number): Promise<number> {
  try {
    const { data, error } = await executeQuery(
      `
      SELECT COUNT(*) as count FROM votes 
      WHERE vehicle_id = $1 AND category_id = 25
    `,
      [vehicleId],
    )

    if (error) {
      console.error("Error getting vote count:", error)
      return 0
    }

    return data?.[0]?.count || 0
  } catch (error) {
    console.error("Error in getVoteCount:", error)
    return 0
  }
}

// Get all votes with vehicle details
export async function getAllVotes() {
  try {
    const { data, error } = await executeQuery(`
      SELECT v.*, 
             vh.id as vehicle_id, vh.entry_number, vh.vehicle_make as make, 
             vh.vehicle_model as model, vh.vehicle_year as year, vh.owner_name as full_name,
             vh.city, vh.state
      FROM votes v
      LEFT JOIN vehicles vh ON v.vehicle_id = vh.id
      WHERE v.category_id = 25
      ORDER BY v.created_at DESC
    `)

    if (error) {
      console.error("Error fetching votes:", error)
      return []
    }

    return (
      data?.map((vote) => ({
        ...vote,
        vehicle: {
          id: vote.vehicle_id,
          entry_number: vote.entry_number,
          make: vote.make,
          model: vote.model,
          year: vote.year,
          full_name: vote.full_name,
          city: vote.city,
          state: vote.state,
        },
      })) || []
    )
  } catch (error) {
    console.error("Error in getAllVotes:", error)
    return []
  }
}
