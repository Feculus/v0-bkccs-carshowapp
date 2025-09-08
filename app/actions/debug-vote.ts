"use server"

import { createClient } from "@supabase/supabase-js"

export async function debugVoteSystem() {
  try {
    console.log("=== VOTE SYSTEM DEBUG START ===")

    // Create Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Check votes table structure
    console.log("1. Checking votes table structure...")
    const { data: tableInfo, error: tableError } = await supabase.rpc("get_table_info", { table_name: "votes" })
    if (tableError) {
      console.error("Table info error:", tableError)
    } else {
      console.log("Table structure:", tableInfo)
    }

    // 2. Get recent votes
    console.log("2. Checking recent votes...")
    const { data: recentVotes, error: votesError } = await supabase
      .from("votes")
      .select(`
        *,
        vehicle:vehicles(entry_number, make, model, year),
        category:categories(name)
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (votesError) {
      console.error("Recent votes error:", votesError)
    } else {
      console.log("Recent votes:", recentVotes)
    }

    // 3. Check for duplicate voter sessions
    console.log("3. Checking for duplicate votes...")
    const { data: duplicates, error: dupError } = await supabase
      .from("votes")
      .select("voter_session, category_id, vehicle_id, id")
      .not("voter_session", "is", null)

    if (dupError) {
      console.error("Duplicates check error:", dupError)
    } else {
      // Group by voter_session and category_id
      const grouped = duplicates.reduce(
        (acc, vote) => {
          const key = `${vote.voter_session}-${vote.category_id}`
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(vote)
          return acc
        },
        {} as Record<string, any[]>,
      )

      const actualDuplicates = Object.entries(grouped).filter(([_, votes]) => votes.length > 1)
      console.log("Duplicate votes found:", actualDuplicates.length)
      actualDuplicates.forEach(([key, votes]) => {
        console.log(`Duplicate key ${key}:`, votes)
      })
    }

    // 4. Test a simple vote update
    console.log("4. Testing vote update functionality...")
    const { data: testVote, error: testVoteError } = await supabase.from("votes").select("*").limit(1).single()

    if (testVoteError) {
      console.error("No test vote found:", testVoteError)
    } else {
      console.log("Found test vote:", testVote)

      // Try to update it
      const { data: updateResult, error: updateError } = await supabase
        .from("votes")
        .update({
          updated_at: new Date().toISOString(),
          // Don't change the actual vote, just the timestamp
        })
        .eq("id", testVote.id)
        .select()

      if (updateError) {
        console.error("Update test failed:", updateError)
      } else {
        console.log("Update test successful:", updateResult)
      }
    }

    console.log("=== VOTE SYSTEM DEBUG END ===")
    return { success: true, message: "Debug completed - check server logs" }
  } catch (error) {
    console.error("Debug error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
