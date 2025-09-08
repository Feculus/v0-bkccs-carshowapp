"use client"

import { useEffect, useState, useRef } from "react"
import { executeQuery } from "@/utils/neon/client"
import type { Vehicle } from "@/lib/types"
import { Car, Users, Trophy, EyeOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { getResultsPublicationStatus, checkAndUpdateScheduledPublication } from "@/lib/results-utils"

export default function HomePage() {
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [resultsPublished, setResultsPublished] = useState(false)
  const [publicationStatus, setPublicationStatus] = useState<any>(null)
  const [databaseConfigured, setDatabaseConfigured] = useState(true)
  const glideRef = useRef<HTMLDivElement>(null)
  const glideInstance = useRef<any>(null)

  useEffect(() => {
    checkResultsStatus()
    const interval = setInterval(checkResultsStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const checkResultsStatus = async () => {
    try {
      await checkAndUpdateScheduledPublication()
      const status = await getResultsPublicationStatus()
      setPublicationStatus(status)
      setResultsPublished(status.arePublished)
    } catch (error) {
      console.error("Error checking results status:", error)
    }
  }

  const loadFeaturedVehicles = async () => {
    try {
      console.log("[v0] Loading featured vehicles for homepage...")

      const result = await executeQuery(`
        SELECT v.*, c.name as category_name
        FROM vehicles v
        LEFT JOIN categories c ON v.category_id = c.id
        WHERE v.approved = true
        ORDER BY v.created_at DESC
        LIMIT 4
      `)

      console.log("[v0] Homepage vehicles query result:", result)

      // Handle both direct data and {data, error} response structure
      const data = result && typeof result === "object" && "data" in result ? result.data : result

      if (data && Array.isArray(data)) {
        console.log("[v0] Featured vehicles count:", data.length)

        // Transform data to match expected structure
        const transformedData = data.map((vehicle: any) => ({
          ...vehicle,
          make: vehicle.vehicle_make || vehicle.make,
          model: vehicle.vehicle_model || vehicle.model,
          year: vehicle.vehicle_year || vehicle.year,
          category: vehicle.category_name ? { name: vehicle.category_name } : null,
        }))

        setFeaturedVehicles(transformedData)
        console.log(
          "[v0] Featured vehicles set:",
          transformedData.map((v) => ({ id: v.id, make: v.make, model: v.model, approved: v.approved })),
        )
      } else {
        console.log("[v0] No valid data received or data is not an array:", data)
        setFeaturedVehicles([])
      }
    } catch (error) {
      console.error("[v0] Error loading featured vehicles:", error)
      setDatabaseConfigured(false)
      setFeaturedVehicles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeaturedVehicles()

    const initializeGlide = async () => {
      if (glideRef.current) {
        try {
          const { default: Glide } = await import("@glidejs/glide")

          glideInstance.current = new Glide(glideRef.current, {
            type: "carousel",
            startAt: 0,
            perView: 3,
            gap: 32,
            autoplay: 4000,
            hoverpause: true,
            animationDuration: 800,
            animationTimingFunc: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            breakpoints: {
              1024: {
                perView: 2,
                gap: 24,
              },
              768: {
                perView: 1,
                gap: 16,
              },
            },
          })

          glideInstance.current.mount()
        } catch (error) {
          console.error("Failed to initialize Glide.js:", error)
        }
      }
    }

    initializeGlide()

    return () => {
      if (glideInstance.current) {
        glideInstance.current.destroy()
      }
    }
  }, [])

  const getPrimaryImageUrl = (vehicle: Vehicle): string | null => {
    if (vehicle.image_1_url) return vehicle.image_1_url
    if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
      return vehicle.photos[0]
    }
    return null
  }

  return (
    <div className="bg-[#F2EEEB]">
      <section className="relative py-20 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Green%20Cruiser.jpg"
            alt="Classic green cruiser car"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="mb-4">
            <Image
              src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/0F03863B-778F-4D36-9FC6-FC47264B79A5.png"
              alt="2025 CRUISERFEST SHOW-N-SHINE"
              width={800}
              height={200}
              className="mx-auto drop-shadow-lg"
              priority
            />
          </div>
          <div className="w-24 h-1 bg-[#BF6849] mx-auto mb-8"></div>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto drop-shadow-md">
            Where automotive passion meets timeless craftsmanship. Register your vehicle for a chance to take home the
            honors of the best cruiser at the show.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white px-8 py-4 text-lg shadow-lg"
          >
            <Link href="/register">REGISTER YOUR VEHICLE</Link>
          </Button>
          <h4 className="text-xl text-white/90 mt-8 drop-shadow-md max-w-2xl mx-auto">
            {
              "EARLY REGISTRATION ENDS SEPTEMBER 5TH | YOU MUST PURCHASE A TICKET TO CRUISERFEST TO PARTICIPATE IN THE SHOW-N-SHINE."
            }{" "}
          </h4>
          <Button
            asChild
            size="lg"
            className="bg-white hover:bg-white/90 text-[#BF6849] px-8 py-4 text-lg shadow-lg mt-4 border-2 border-white"
          >
            <Link
              href="https://landcruiserhm.com/buy-tickets/cruiserfest-2025/individual-registration"
              target="_blank"
              rel="noopener noreferrer"
            >
              PURCHASE TICKETS
            </Link>
          </Button>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <Car className="h-16 w-16 text-[#BF6849] mx-auto" />
              <div>
                <h3 className="text-4xl font-bold text-[#3A403D]">50 MAX</h3>
                <p className="text-[#3A403D]/60 uppercase tracking-wide">VEHICLES</p>
              </div>
            </div>
            <div className="space-y-4">
              <Users className="h-16 w-16 text-[#BF6849] mx-auto" />
              <div>
                <h3 className="text-4xl font-bold text-[#3A403D]">NATIONWIDE</h3>
                <p className="text-[#3A403D]/60 uppercase tracking-wide">ATTENDEES</p>
              </div>
            </div>
            <div className="space-y-4">
              <Trophy className="h-16 w-16 text-[#BF6849] mx-auto" />
              <div>
                <h3 className="text-4xl font-bold text-[#3A403D]">5</h3>
                <p className="text-[#3A403D]/60 uppercase tracking-wide">AWARD CATEGORIES</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#3A403D] mb-4">VEHICLE COLLECTION</h2>
            <p className="text-[#3A403D]/60">
              {loading
                ? "Loading registered vehicles..."
                : !databaseConfigured
                  ? "Database connection not configured. Please set up Neon integration."
                  : featuredVehicles.length > 0
                    ? resultsPublished
                      ? "Click on photos to learn more about each vehicle and cast your vote."
                      : "Explore the amazing vehicles registered for the show."
                    : "Be the first to register your vehicle for the show!"}
            </p>
          </div>

          {!databaseConfigured ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#BF6849]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="h-12 w-12 text-[#BF6849]/60" />
              </div>
              <h3 className="text-xl font-semibold text-[#3A403D] mb-2">Database Configuration Required</h3>
              <p className="text-[#3A403D]/60 mb-6">
                Please configure your Neon database integration to display registered vehicles.
              </p>
            </div>
          ) : loading ? (
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-200 rounded-lg shadow-lg overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-300"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredVehicles.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {featuredVehicles.map((vehicle) => {
                const primaryImageUrl = getPrimaryImageUrl(vehicle)

                return (
                  <Link key={vehicle.id} href={`/vehicle/${vehicle.profile_url}`}>
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                      <div className="aspect-square relative">
                        {primaryImageUrl ? (
                          <Image
                            src={primaryImageUrl || "/placeholder.svg"}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#F2EEEB] flex items-center justify-center">
                            <div className="text-center text-[#3A403D]/40">
                              <div className="w-16 h-16 bg-[#3A403D]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Car className="h-8 w-8" />
                              </div>
                              <p className="text-sm">No Photo</p>
                            </div>
                          </div>
                        )}

                        <div className="absolute top-3 left-3">
                          <div className="bg-[#BF6849] text-white text-xs font-bold px-2 py-1 rounded">
                            #{vehicle.entry_number}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-bold text-[#3A403D] mb-1">
                          {vehicle.year} {vehicle.make}
                        </h3>
                        <p className="text-[#3A403D]/60 text-sm mb-2">{vehicle.model}</p>
                        <p className="text-[#3A403D]/50 text-xs">
                          by {vehicle.full_name} • {vehicle.city}, {vehicle.state}
                        </p>
                        {vehicle.category && (
                          <div className="mt-2">
                            <span className="inline-block bg-[#A9BF88]/10 text-[#A9BF88] text-xs px-2 py-1 rounded">
                              {vehicle.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#3A403D]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Car className="h-12 w-12 text-[#3A403D]/40" />
              </div>
              <h3 className="text-xl font-semibold text-[#3A403D] mb-2">No Vehicles Registered Yet</h3>
              <p className="text-[#3A403D]/60 mb-6">
                Be the first to showcase your vehicle at the 2025 CRUISERFEST Show-N-Shine!
              </p>
              <Button asChild className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                <Link href="/register">Register Your Vehicle</Link>
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button
              asChild
              variant="outline"
              className="border-[#3A403D] text-[#3A403D] hover:bg-[#3A403D] hover:text-white bg-transparent"
            >
              <Link href="/vehicles">
                {featuredVehicles.length > 0 ? "VIEW ALL REGISTERED VEHICLES" : "VIEW VEHICLE COLLECTION"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F2EEEB]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#3A403D] mb-4">PARTICIPANT HUB</h2>
            <p className="text-[#3A403D]/60">Everything you need for the ultimate car show experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-[#BF6849] rounded-full flex items-center justify-center mx-auto">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#3A403D] mb-4">Register</h3>
                <p className="text-[#3A403D]/60 mb-6">Submit your vehicle for judging across multiple categories.</p>
                <Button asChild className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                  <Link href="/register">START REGISTRATION →</Link>
                </Button>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-[#3A403D] rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#3A403D] mb-4">Browse Entries</h3>
                <p className="text-[#3A403D]/60 mb-6">
                  Explore all registered vehicles with detailed specifications, owner stories, and high-resolution
                  galleries.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#3A403D] text-[#3A403D] hover:bg-[#3A403D] hover:text-white bg-transparent"
                >
                  <Link href="/vehicles">VIEW COLLECTION →</Link>
                </Button>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                  resultsPublished ? "bg-[#A9BF88]" : "bg-[#3A403D]/20"
                }`}
              >
                {resultsPublished ? (
                  <Trophy className="h-8 w-8 text-white" />
                ) : publicationStatus?.isScheduled ? (
                  <Clock className="h-8 w-8 text-[#3A403D]/60" />
                ) : (
                  <EyeOff className="h-8 w-8 text-[#3A403D]/60" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#3A403D] mb-4">Results</h3>
                <p className="text-[#3A403D]/60 mb-6">
                  {resultsPublished
                    ? "Track real-time voting results and see which vehicles are leading in each category and people's choice."
                    : publicationStatus?.isScheduled
                      ? `Live voting will be available on ${new Date(publicationStatus.scheduledFor).toLocaleDateString()}. Check back then to see real-time results!`
                      : "Results will be available at the close of the voting period."}
                </p>
                {resultsPublished ? (
                  <Button asChild className="bg-[#A9BF88] hover:bg-[#A9BF88]/90 text-white">
                    <Link href="/vote">VIEW RESULTS →</Link>
                  </Button>
                ) : (
                  <Button disabled className="bg-[#3A403D]/20 text-[#3A403D]/60 cursor-not-allowed">
                    {publicationStatus?.isScheduled ? "COMING SOON →" : "NOT YET AVAILABLE →"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#3A403D] mb-4">PRESENTED BY</h2>
            <p className="text-[#3A403D]/60">Proudly supported by our amazing sponsors and partners</p>
          </div>

          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-[#BF6849] mb-8">TITLE SPONSOR</h3>
            <div className="flex justify-center">
              <a
                href="https://toyota.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <div className="w-80 h-32 bg-white border-2 border-[#3A403D]/10 rounded-lg flex items-center justify-center p-4">
                  <Image
                    src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Toyota-Corporate-Logo.png"
                    alt="Toyota"
                    width={280}
                    height={84}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </a>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[#BF6849] text-center mb-8">MAJOR SPONSORS</h3>
            <div className="relative">
              <div ref={glideRef} className="glide">
                <div className="glide__track" data-glide-el="track">
                  <ul className="glide__slides">
                    {[
                      {
                        src: "https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Landcar-Heritage-Black-White-Box-White-Type.png",
                        alt: "Land Cruiser Heritage Museum",
                        url: "https://landcruiserhm.com/",
                      },
                      {
                        src: "https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Wasatch_Cruisers_Utah.png",
                        alt: "Wasatch Cruisers Utah",
                        url: "https://forum.wasatchcruisers.org/",
                      },
                      {
                        src: "https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/CruiserOutfitters-3x4.png",
                        alt: "Cruiser Outfitters",
                        url: "https://cruiserteq.com/",
                      },
                      {
                        src: "https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/ABC_3division.vector.png",
                        alt: "ABC 3 Division",
                        url: "https://www.abc-concrete.com/",
                      },
                      {
                        src: "https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/OEX_LOGO_resized.png",
                        alt: "OEX",
                        url: "https://www.overlandexperts.com/",
                      },
                      {
                        src: "/images/sponsors/4x4Engineering.png",
                        alt: "4x4 Engineering",
                        url: "https://www.4x4es.co.jp/en/",
                      },
                      {
                        src: "/images/sponsors/Dometic.png",
                        alt: "Dometic",
                        url: "https://www.dometic.com/en-us/outdoor",
                      },
                      {
                        src: "/images/sponsors/TLCA.png",
                        alt: "TLCA",
                        url: "https://tlca.org/",
                      },
                      {
                        src: "/images/sponsors/ToyoTires.png",
                        alt: "Toyo Tires",
                        url: "https://www.toyotires.com/",
                      },
                      {
                        src: "/images/sponsors/ValleyOverlanding_resized.png",
                        alt: "Valley Overlanding",
                        url: "https://valleyoverlandco.com/",
                      },
                    ].map((sponsor, index) => (
                      <li key={index} className="glide__slide">
                        <a
                          href={sponsor.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block hover:opacity-80 transition-opacity group"
                        >
                          <div className="w-full h-64 bg-white border-2 border-[#3A403D]/10 rounded-lg flex items-center justify-center p-6 group-hover:border-[#BF6849]/30 group-hover:shadow-lg transition-all duration-300">
                            <Image
                              src={sponsor.src || "/placeholder.svg"}
                              alt={sponsor.alt}
                              width={400}
                              height={160}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#A9BF88] text-center mb-8">MEDIA PARTNERS</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <a
                href="https://www.leolinx.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <div className="w-full h-16 bg-white border border-[#3A403D]/10 rounded-lg flex items-center justify-center p-4">
                  <Image
                    src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Logo%20200x50.png"
                    alt="Leo Linx Media Partner"
                    width={120}
                    height={30}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </a>
              <a
                href="https://www.talentacommerce.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                <div className="w-full h-16 bg-white border border-[#3A403D]/10 rounded-lg flex items-center justify-center p-4">
                  <Image
                    src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/TALENTA%20Logo%202023%20250px.png"
                    alt="Talenta Commerce"
                    width={120}
                    height={30}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
