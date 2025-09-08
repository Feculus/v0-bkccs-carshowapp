import Image from "next/image"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[#3A403D] text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Image
                src="https://l7krxsdfvx6sguxt.public.blob.vercel-storage.com/Site%20Images/Landcar-Heritage-Black-White-Box-White-Type.png"
                alt="Landcar Heritage Logo"
                width={180}
                height={54}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-white/80 mb-4">
              The premier Land Cruiser showcase bringing together enthusiasts, collectors, and the most extraordinary vehicles from around the world.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#BF6849]">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register" className="text-white/80 hover:text-white transition-colors">
                  Registration
                </Link>
              </li>
              <li>
                <Link href="/vehicles" className="text-white/80 hover:text-white transition-colors">
                  Vehicle Collection
                </Link>
              </li>
              <li>
                <Link href="/results" className="text-white/80 hover:text-white transition-colors">
                  Voting Results
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-[#BF6849]">Contact Info</h3>
            <div className="space-y-2 text-white/80">
              <p>Land Cruiser Heritage Museum</p>
              <p>476 W 600 N</p>
              <p>Salt Lake City, Utah 84103</p>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2 text-[#A9BF88]">Event Date</h4>
              <p className="text-white/80">September 6, 2025</p>
              <p className="text-white/80 text-sm">Gates open at 8:00 AM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
          <p>© 2025 CRUISERFEST SHOW-N-SHINE. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-2 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span>|</span>
            <Link href="/admin/login" className="hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
