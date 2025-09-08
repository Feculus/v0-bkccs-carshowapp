import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL

export const createServerClient = () => {
  if (!databaseUrl || databaseUrl.includes("placeholder")) {
    console.warn("Neon database URL not configured. Please set NEON_DATABASE_URL or DATABASE_URL environment variable")
    return null
  }

  return neon(databaseUrl)
}

// Server-side database operations with better error handling
export const executeServerQuery = async (query: string, params: any[] = []) => {
  const sql = createServerClient()
  if (!sql) {
    return { data: null, error: new Error("Database not configured") }
  }

  try {
    const result = await sql(query, params)
    return { data: result, error: null }
  } catch (error) {
    console.error("Server database query error:", error)
    return { data: null, error }
  }
}

// Export the same operations but using server client
export { vehicleOperations, votingOperations, adminOperations } from "./client"
