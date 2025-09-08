import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/tojo-burn-404.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">404</h1>
        <h2 className="text-3xl font-semibold text-white mb-6 drop-shadow-lg">
          Looks like this page took a wrong turn!
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-md mx-auto drop-shadow-lg">
          The page you're looking for doesn't exist. Maybe it's out cruising the trails, but you can find your way back
          to the car show.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-[#BF6849] hover:bg-[#BF6849]/90 text-white font-semibold py-3 px-6">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="bg-[#A9BF88] hover:bg-[#A9BF88]/90 text-white border-[#A9BF88] font-semibold py-3 px-6"
          >
            <Link href="/vehicles">View Vehicles</Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-sm text-white/80">
          <p>
            Need help?{" "}
            <Link href="/contact" className="text-[#BF6849] hover:underline font-semibold">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
