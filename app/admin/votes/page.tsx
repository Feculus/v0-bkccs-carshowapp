"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, BarChart3, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

interface VoteResult {
  vehicle_id: number
  vote_count: number
  vehicle: {
    id: number
    entry_number: number
    make: string
    model: string
    year: number
    full_name: string
    city: string
    state: string
  }
}

interface VotingStats {
  totalVotes: number
  uniqueVoters: number
  topVehicles: VoteResult[]
}

export default function AdminVotesPage() {
  const [stats, setStats] = useState<VotingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadVotingStats()
  }, [])

  const loadVotingStats = async () => {
    try {
      console.log("[v0] Loading voting stats...")
      setLoading(true)

      const { data: voteData, error: voteError } = await supabase
        .from("votes")
        .select(`
          vehicle_id,
          vehicle:vehicles!votes_vehicle_id_fkey(
            id,
            entry_number,
            make,
            model,
            year,
            full_name,
            city,
            state
          )
        `)
        .eq("category_id", 25) // Only get Best of Show votes

      if (voteError) {
        console.error("Error loading votes:", voteError)
        return
      }

      // Process vote counts
      const voteCounts: { [key: number]: VoteResult } = {}
      let totalVotes = 0
      const uniqueVoters = new Set()

      voteData?.forEach((vote: any) => {
        totalVotes++

        if (!voteCounts[vote.vehicle_id]) {
          voteCounts[vote.vehicle_id] = {
            vehicle_id: vote.vehicle_id,
            vote_count: 0,
            vehicle: vote.vehicle,
          }
        }
        voteCounts[vote.vehicle_id].vote_count++
      })

      // Get unique voter count
      const { count: voterCount } = await supabase
        .from("votes")
        .select("voter_session", { count: "exact", head: true })
        .eq("category_id", 25) // Only count Best of Show voters

      // Sort by vote count and get top vehicles
      const topVehicles = Object.values(voteCounts)
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 10)

      setStats({
        totalVotes,
        uniqueVoters: voterCount || 0,
        topVehicles,
      })
    } catch (error) {
      console.error("Error loading voting stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    setRefreshing(true)
    await loadVotingStats()
    setRefreshing(false)
  }

  const exportResults = () => {
    if (!stats) return

    const csvContent = [
      "Rank,Entry Number,Vehicle,Owner,Location,Votes",
      ...stats.topVehicles.map(
        (result, index) =>
          `${index + 1},${result.vehicle.entry_number},"${result.vehicle.year} ${result.vehicle.make} ${result.vehicle.model}","${result.vehicle.full_name}","${result.vehicle.city}, ${result.vehicle.state}",${result.vote_count}`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `voting-results-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
          <p className="text-[#3A403D]">Loading voting results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3A403D] mb-2">Voting Results</h1>
            <p className="text-[#3A403D]/80">Admin-only view of Best in Show voting results</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={refreshStats} disabled={refreshing} variant="outline" className="bg-white">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={exportResults} disabled={!stats} className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-[#BF6849] mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-[#3A403D]">{stats.totalVotes}</p>
                    <p className="text-[#3A403D]/80">Total Votes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-[#A9BF88] mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-[#3A403D]">{stats.uniqueVoters}</p>
                    <p className="text-[#3A403D]/80">Unique Voters</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-[#3A403D]">{stats.topVehicles[0]?.vote_count || 0}</p>
                    <p className="text-[#3A403D]/80">Leading Votes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#3A403D] flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-[#BF6849]" />
              Best in Show Results
            </CardTitle>
            <CardDescription>Live voting results - updates automatically as votes are cast</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && stats.topVehicles.length > 0 ? (
              <div className="space-y-4">
                {stats.topVehicles.map((result, index) => (
                  <div
                    key={result.vehicle_id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                      index === 0
                        ? "border-yellow-400 bg-yellow-50"
                        : index === 1
                          ? "border-gray-400 bg-gray-50"
                          : index === 2
                            ? "border-amber-600 bg-amber-50"
                            : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#3A403D] text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className="bg-[#BF6849] text-white">#{result.vehicle.entry_number}</Badge>
                          {index < 3 && (
                            <Badge
                              className={
                                index === 0
                                  ? "bg-yellow-500 text-white"
                                  : index === 1
                                    ? "bg-gray-500 text-white"
                                    : "bg-amber-600 text-white"
                              }
                            >
                              {index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-[#3A403D]">
                          {result.vehicle.year} {result.vehicle.make} {result.vehicle.model}
                        </h3>
                        <p className="text-[#3A403D]/80">
                          by {result.vehicle.full_name} • {result.vehicle.city}, {result.vehicle.state}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#BF6849]">{result.vote_count}</p>
                      <p className="text-[#3A403D]/80 text-sm">{result.vote_count === 1 ? "vote" : "votes"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-[#3A403D]/20 mx-auto mb-4" />
                <p className="text-[#3A403D]/60">No votes have been cast yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="bg-white">
            <Link href="/admin">Back to Admin Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
