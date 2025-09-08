"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Download, QrCode, Share2 } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()
import type { Vehicle } from "@/lib/types"

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("id")
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (vehicleId) {
      loadVehicle()
    }
  }, [vehicleId])

  const loadVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, category:categories(*)")
        .eq("id", vehicleId)
        .single()

      if (error) throw error

      // Generate QR code URL if not exists
      if (data && !data.qr_code_url) {
        const qrCodeUrl = `${window.location.origin}/vehicle/${data.profile_url}`

        // Update vehicle with QR code URL
        await supabase.from("vehicles").update({ qr_code_url: qrCodeUrl }).eq("id", vehicleId)

        data.qr_code_url = qrCodeUrl
      }

      setVehicle(data)
    } catch (error) {
      console.error("Error loading vehicle:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrintPDF = () => {
    // Generate QR code as data URL first
    let qrCodeDataUrl = ""
    if (vehicle.qr_code_url) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      canvas.width = 150
      canvas.height = 150

      // Create a temporary QR code to get the data URL
      import("qrcode")
        .then((QRCode) => {
          QRCode.toCanvas(
            canvas,
            vehicle.qr_code_url,
            {
              width: 150,
              height: 150,
              margin: 0,
            },
            (error) => {
              if (!error) {
                qrCodeDataUrl = canvas.toDataURL()
                openPrintWindow(qrCodeDataUrl)
              } else {
                console.error("QR Code generation error:", error)
                openPrintWindow("")
              }
            },
          )
        })
        .catch(() => {
          // Fallback: try to get data URL from existing SVG
          const svgElement = document.querySelector("svg[data-qr-code]")
          if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement)
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
            const url = URL.createObjectURL(svgBlob)
            qrCodeDataUrl = url
          }
          openPrintWindow(qrCodeDataUrl)
        })
    } else {
      openPrintWindow("")
    }
  }

  const openPrintWindow = (qrCodeDataUrl) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BF6849] mx-auto mb-4"></div>
          <p className="text-[#3A403D]">Loading registration details...</p>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#F2EEEB] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-[#3A403D] mb-4">Registration not found.</p>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Message */}
        <Card className="bg-white shadow-lg mb-8">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-[#A9BF88] mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-[#3A403D]">Registration Successful!</CardTitle>
            <CardDescription className="text-[#3A403D]/60">
              Your vehicle has been registered for the 2025 CRUISERFEST Show-N-Shine
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-[#F2EEEB] rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#3A403D] mb-2">Entry #{vehicle.entry_number}</h3>
              <p className="text-[#3A403D]/80">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <p className="text-[#3A403D]/60">
                Registered by {vehicle.full_name} from {vehicle.city}, {vehicle.state}
              </p>
            </div>

            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link href={`/vehicle/${vehicle.profile_url}`}>
                  <Share2 className="h-4 w-4 mr-2" />
                  View Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Printable Display Card */}
        <div className="print:block hidden">
          <div className="w-[8in] h-[10in] bg-white p-8 mx-auto border-2 border-[#3A403D] print:border-0">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-[#3A403D] mb-2">2025 CRUISERFEST Show-N-Shine</h1>
              <div className="w-24 h-1 bg-[#BF6849] mx-auto"></div>
            </div>

            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-[#BF6849] mb-2">#{vehicle.entry_number}</div>
              <h2 className="text-3xl font-bold text-[#3A403D] mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-xl text-[#3A403D]/80">
                {vehicle.full_name} • {vehicle.city}, {vehicle.state}
              </p>
              {vehicle.category && <p className="text-lg text-[#3A403D]/60 mt-2">Category: {vehicle.category.name}</p>}
            </div>

            {vehicle.qr_code_url && (
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-white border-2 border-[#3A403D]">
                  <QRCodeSVG value={vehicle.qr_code_url} size={200} level="M" includeMargin={false} />
                </div>
                <p className="text-lg text-[#3A403D] mt-4 font-semibold">Scan to Vote for This Vehicle</p>
                <p className="text-sm text-[#3A403D]/60">{vehicle.qr_code_url}</p>
              </div>
            )}

            {vehicle.description && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#3A403D] mb-2">About This Vehicle</h3>
                <p className="text-[#3A403D]/80 leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            <div className="text-center text-sm text-[#3A403D]/60 mt-auto">
              <p>Visit cruiserfest.com for more information</p>
            </div>
          </div>
        </div>

        {/* Screen Display Card Preview */}
        <Card className="bg-white shadow-lg print:hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#3A403D] flex items-center">
              <QrCode className="h-6 w-6 mr-2 text-[#BF6849]" />
              Display Card Preview
            </CardTitle>
            <CardDescription>This is how your display card will look when printed (8x10 inches)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg border-2 border-dashed border-[#3A403D]/20 relative">
              {/* Simulated cut border */}
              <div className="absolute inset-4 border-2 border-dashed border-[#3A403D]/30 rounded-lg pointer-events-none"></div>

              <div className="relative bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center space-y-4">
                  <div>
                    <h2 class="text-lg font-bold text-[#3A403D] mb-1">2025 CRUISERFEST</h2>
                    <p class="text-xs font-medium text-[#3A403D]/60 uppercase tracking-wide mb-2">Show-N-Shine</p>
                    <div class="w-12 h-0.5 bg-[#BF6849] mx-auto mb-4"></div>
                  </div>

                  <div class="text-3xl font-bold text-[#BF6849] mb-2">#{vehicle.entry_number}</div>

                  <div>
                    <h3 class="text-lg font-bold text-[#3A403D] mb-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                    <p class="text-sm text-[#3A403D]/80 mb-4">
                      {vehicle.full_name}
                      <br />
                      {vehicle.city}, {vehicle.state}
                    </p>
                  </div>

                  {vehicle.qr_code_url && (
                    <div className="py-2">
                      <div className="inline-block p-2 bg-white border-2 border-[#3A403D] rounded shadow-sm">
                        <QRCodeSVG
                          value={vehicle.qr_code_url}
                          size={80}
                          level="M"
                          includeMargin={false}
                          data-qr-code="true"
                        />
                      </div>
                      <p className="text-xs text-[#3A403D] mt-2 font-semibold uppercase tracking-wide">Scan to Vote</p>
                    </div>
                  )}

                  <div class="border-t border-gray-200 pt-3 mt-4">
                    <p class="text-xs text-[#3A403D]/60">Land Cruiser Heritage Museum • Salt Lake City, Utah</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-6 space-y-2">
              <p className="text-sm text-[#3A403D]/80 font-medium">
                Card Size: 6" × 5" with cut lines for easy trimming
              </p>
              <Button onClick={handlePrintPDF} className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white">
                <Download className="h-4 w-4 mr-2" />
                Print Display Card
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
