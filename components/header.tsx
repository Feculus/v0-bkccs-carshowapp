"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { getResultsPublicationStatus, checkAndUpdateScheduledPublication } from "@/lib/results-utils"

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [resultsPublished, setResultsPublished] = useState(false)

  useEffect(() => {
    checkResultsStatus()

    // Check every 60 seconds for publication status updates
    const interval = setInterval(checkResultsStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const checkResultsStatus = async () => {
    try {
      await checkAndUpdateScheduledPublication()
      const status = await getResultsPublicationStatus()
      setResultsPublished(status.arePublished)
    } catch (error) {
      console.error("Error checking results status:", error)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="bg-[#F2EEEB] border-b border-[#3A403D]/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
            <Image
              src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Landcar-Heritage-Black-White-Box-White-Type.png"
              alt="Landcar Heritage Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/vehicles"
              className={`text-[#3A403D] hover:text-[#BF6849] transition-colors ${
                isActive("/vehicles") ? "text-[#BF6849] font-semibold" : ""
              }`}
            >
              VEHICLE COLLECTION
            </Link>
            <Link
              href="/schedule"
              className={`text-[#3A403D] hover:text-[#BF6849] transition-colors ${
                isActive("/schedule") ? "text-[#BF6849] font-semibold" : ""
              }`}
            >
              SCHEDULE
            </Link>
            {resultsPublished && (
              <Link
                href="/results"
                className={`text-[#3A403D] hover:text-[#BF6849] transition-colors ${
                  isActive("/results") ? "text-[#BF6849] font-semibold" : ""
                }`}
              >
                RESULTS
              </Link>
            )}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex space-x-3">
            <Button asChild className="bg-[#3A403D] hover:bg-[#3A403D]/90 text-white border-0">
              <a
                href="https://shop.landcruiserhm.com/products/donation"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Heart className="h-4 w-4 mr-2" />
                DONATE
              </a>
            </Button>
            <Button asChild className="bg-[#A9BF88] hover:bg-[#A9BF88]/90 text-white">
              <Link href="/register">REGISTER</Link>
            </Button>
            {resultsPublished && (
              <Button asChild className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                <Link href="/vehicles">VOTE</Link>
              </Button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="lg:hidden p-2 rounded-md text-[#3A403D] hover:text-[#BF6849] hover:bg-[#3A403D]/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 z-40" onClick={closeMobileMenu} />

            {/* Mobile Menu Panel */}
            <div className="absolute top-full left-0 right-0 bg-[#F2EEEB] border-b border-[#3A403D]/10 shadow-lg z-50">
              <div className="px-4 py-6 space-y-6">
                {/* Mobile Navigation Links */}
                <nav className="space-y-4">
                  <Link
                    href="/vehicles"
                    className={`block text-lg font-medium transition-colors ${
                      isActive("/vehicles") ? "text-[#BF6849] font-semibold" : "text-[#3A403D] hover:text-[#BF6849]"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    VEHICLE COLLECTION
                  </Link>
                  <Link
                    href="/schedule"
                    className={`block text-lg font-medium transition-colors ${
                      isActive("/schedule") ? "text-[#BF6849] font-semibold" : "text-[#3A403D] hover:text-[#BF6849]"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    SCHEDULE
                  </Link>
                  {resultsPublished && (
                    <Link
                      href="/results"
                      className={`block text-lg font-medium transition-colors ${
                        isActive("/results") ? "text-[#BF6849] font-semibold" : "text-[#3A403D] hover:text-[#BF6849]"
                      }`}
                      onClick={closeMobileMenu}
                    >
                      RESULTS
                    </Link>
                  )}
                </nav>

                {/* Mobile Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-[#3A403D]/10">
                  <Button asChild className="w-full bg-[#3A403D] hover:bg-[#3A403D]/90 text-white border-0">
                    <a
                      href="https://shop.landcruiserhm.com/products/donation"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                      onClick={closeMobileMenu}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      DONATE
                    </a>
                  </Button>
                  <Button asChild className="w-full bg-[#A9BF88] hover:bg-[#A9BF88]/90 text-white">
                    <Link href="/register" className="flex items-center justify-center" onClick={closeMobileMenu}>
                      REGISTER
                    </Link>
                  </Button>
                  {resultsPublished && (
                    <Button asChild className="w-full bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                      <Link href="/vehicles" className="flex items-center justify-center" onClick={closeMobileMenu}>
                        VOTE
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
