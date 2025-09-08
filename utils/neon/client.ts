import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL

export const isNeonConfigured = () => {
  return !!databaseUrl && !databaseUrl.includes("placeholder")
}

export const createClient = () => {
  if (!isNeonConfigured()) {
    console.warn("Neon database URL not configured. Please set NEON_DATABASE_URL or DATABASE_URL environment variable")
    return null
  }

  return neon(databaseUrl!)
}

// Helper function to execute SQL queries safely
export const executeQuery = async (query: string, params: any[] = []) => {
  const sql = createClient()
  if (!sql) {
    return { data: null, error: new Error("Database not configured") }
  }

  try {
    const result = await sql(query, params)
    return { data: result, error: null }
  } catch (error) {
    console.error("Database query error:", error)
    return { data: null, error }
  }
}

// Vehicle-specific database operations
export const vehicleOperations = {
  // Get all vehicles
  getAll: async () => {
    return executeQuery(`
      SELECT v.*, 
             array_agg(DISTINCT c.name) as categories,
             COUNT(DISTINCT vo.id) as vote_count
      FROM vehicles v
      LEFT JOIN votes vo ON v.id = vo.vehicle_id
      LEFT JOIN categories c ON vo.category_id = c.id
      GROUP BY v.id
      ORDER BY v.created_at DESC
    `)
  },

  // Get featured vehicles (checked in)
  getFeatured: async (limit = 6) => {
    return executeQuery(
      `
      SELECT v.*, COUNT(vo.id) as vote_count
      FROM vehicles v
      LEFT JOIN votes vo ON v.id = vo.vehicle_id
      WHERE v.checked_in = true
      GROUP BY v.id
      ORDER BY vote_count DESC, v.created_at DESC
      LIMIT $1
    `,
      [limit],
    )
  },

  // Get vehicle by ID
  getById: async (id: number) => {
    return executeQuery(
      `
      SELECT v.*, COUNT(vo.id) as vote_count
      FROM vehicles v
      LEFT JOIN votes vo ON v.id = vo.vehicle_id
      WHERE v.id = $1
      GROUP BY v.id
    `,
      [id],
    )
  },

  // Create new vehicle
  create: async (vehicleData: any) => {
    const {
      owner_name,
      owner_email,
      owner_phone,
      vehicle_year,
      vehicle_make,
      vehicle_model,
      vehicle_color,
      vehicle_description,
      image_url_1,
      image_url_2,
      image_url_3,
      image_url_4,
      image_url_5,
      photos,
      qr_code,
    } = vehicleData

    return executeQuery(
      `
      INSERT INTO vehicles (
        owner_name, owner_email, owner_phone,
        vehicle_year, vehicle_make, vehicle_model, vehicle_color,
        vehicle_description, image_url_1, image_url_2, image_url_3,
        image_url_4, image_url_5, photos, qr_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `,
      [
        owner_name,
        owner_email,
        owner_phone,
        vehicle_year,
        vehicle_make,
        vehicle_model,
        vehicle_color,
        vehicle_description,
        image_url_1,
        image_url_2,
        image_url_3,
        image_url_4,
        image_url_5,
        JSON.stringify(photos || []),
        qr_code,
      ],
    )
  },

  // Update vehicle
  update: async (id: number, updates: any) => {
    const fields = Object.keys(updates)
    const values = Object.values(updates)
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ")

    return executeQuery(
      `
      UPDATE vehicles 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [id, ...values],
    )
  },

  // Check in vehicle
  checkIn: async (id: number) => {
    return executeQuery(
      `
      UPDATE vehicles 
      SET checked_in = true, check_in_time = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      [id],
    )
  },
}

// Voting operations
export const votingOperations = {
  // Get all categories
  getCategories: async () => {
    return executeQuery("SELECT * FROM categories ORDER BY name")
  },

  // Cast a vote
  castVote: async (vehicleId: number, categoryId: number, voterIp: string, voterSession: string) => {
    return executeQuery(
      `
      INSERT INTO votes (vehicle_id, category_id, voter_ip, voter_session)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (vehicle_id, category_id, voter_ip, voter_session) DO NOTHING
      RETURNING *
    `,
      [vehicleId, categoryId, voterIp, voterSession],
    )
  },

  // Get voting results
  getResults: async () => {
    return executeQuery(`
      SELECT 
        c.name as category_name,
        v.id as vehicle_id,
        v.vehicle_make,
        v.vehicle_model,
        v.vehicle_year,
        v.owner_name,
        COUNT(vo.id) as vote_count,
        RANK() OVER (PARTITION BY c.id ORDER BY COUNT(vo.id) DESC) as rank
      FROM categories c
      LEFT JOIN votes vo ON c.id = vo.category_id
      LEFT JOIN vehicles v ON vo.vehicle_id = v.id
      WHERE v.checked_in = true
      GROUP BY c.id, c.name, v.id, v.vehicle_make, v.vehicle_model, v.vehicle_year, v.owner_name
      ORDER BY c.name, vote_count DESC
    `)
  },

  // Check if voting is open
  getVotingStatus: async () => {
    return executeQuery(`
      SELECT voting_open, results_published, voting_start_time, voting_end_time
      FROM voting_schedule
      ORDER BY created_at DESC
      LIMIT 1
    `)
  },
}

// Admin operations
export const adminOperations = {
  // Get all admin awards
  getAwards: async () => {
    return executeQuery(`
      SELECT aa.*, v.vehicle_make, v.vehicle_model, v.vehicle_year, v.owner_name, c.name as category_name
      FROM admin_awards aa
      JOIN vehicles v ON aa.vehicle_id = v.id
      JOIN categories c ON aa.category_id = c.id
      ORDER BY aa.created_at DESC
    `)
  },

  // Create admin award
  createAward: async (vehicleId: number, categoryId: number, awardName: string, notes?: string) => {
    return executeQuery(
      `
      INSERT INTO admin_awards (vehicle_id, category_id, award_name, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [vehicleId, categoryId, awardName, notes],
    )
  },

  // Update voting schedule
  updateVotingSchedule: async (updates: any) => {
    const fields = Object.keys(updates)
    const values = Object.values(updates)
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ")

    return executeQuery(
      `
      UPDATE voting_schedule 
      SET ${setClause}, updated_at = NOW()
      WHERE id = (SELECT id FROM voting_schedule ORDER BY created_at DESC LIMIT 1)
      RETURNING *
    `,
      values,
    )
  },
}
