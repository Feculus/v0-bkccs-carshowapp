import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service - 2025 CRUISERFEST SHOW-N-SHINE",
  description:
    "Terms of Service for the CRUISERFEST Show-N-Shine Registration Application and 2025 event participation.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F2EEEB] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Button asChild variant="ghost" className="text-[#3A403D] hover:bg-[#3A403D] hover:text-white">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-[#BF6849]" />
            </div>
            <CardTitle className="text-3xl font-bold text-[#3A403D]">Terms of Service</CardTitle>
            <p className="text-[#3A403D]/60 text-lg">CRUISERFEST Show-N-Shine Registration App</p>
            <p className="text-[#3A403D]/80 font-semibold">Effective Date: July 31, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <div className="space-y-8 text-[#3A403D]">
              <div className="bg-[#F2EEEB] p-6 rounded-lg">
                <p className="text-lg leading-relaxed mb-0">
                  Welcome to the CRUISERFEST Show-N-Shine Registration Application ("App") for the 2025 CRUISERFEST
                  event. By using this App to register your vehicle, access event information, or participate in voting
                  and community features, you agree to the following Terms of Service ("Terms").
                </p>
                <p className="font-semibold text-[#BF6849] mt-4 mb-0">
                  Please read these Terms carefully. If you do not agree, do not use the App.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">1. Eligibility</h2>
                <p className="mb-4">To register a vehicle or vote in the Show-N-Shine, you must:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Be at least 18 years old or have a parent/guardian register on your behalf.</li>
                  <li>Submit accurate and truthful information.</li>
                  <li>Comply with all local laws and event rules.</li>
                </ul>
                <p>
                  We reserve the right to reject any registration that does not meet event guidelines or is submitted
                  with incomplete or misleading information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">2. User Responsibilities</h2>
                <p className="mb-4">By using this App, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Provide accurate, up-to-date information during registration.</li>
                  <li>Upload only appropriate images that you have the right to share.</li>
                  <li>Respect the voting process and not attempt to manipulate or spam results.</li>
                  <li>Use the App only for lawful purposes and in connection with the CRUISERFEST event.</li>
                </ul>
                <p className="font-semibold">
                  You may not use this App to harass, threaten, impersonate, or defame others.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">3. Voting & Judging</h2>
                <p>
                  Voting may be conducted by the public and/or CRUISERFEST judges. While we aim to provide a fair
                  system, all voting results are final and may be subject to review by the event organizers for
                  integrity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">4. Image & Data Usage</h2>
                <p className="mb-4">
                  By submitting images and vehicle information through the App, you grant CRUISERFEST and its partners a
                  non-exclusive, royalty-free license to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Display your submitted content on event materials (website, voting pages, signage).</li>
                  <li>Use images for promotion of the 2025 and future CRUISERFEST events.</li>
                </ul>
                <p className="font-semibold">
                  We will not sell or share your personal contact information with third parties without your consent.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">5. Privacy</h2>
                <p className="mb-4">
                  Your privacy is important to us. Personal data collected through this App will only be used for:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Event communication and logistics.</li>
                  <li>Contacting you regarding registration, updates, or awards.</li>
                  <li>Admin-only access to sensitive information like phone numbers and emails.</li>
                </ul>
                <p>
                  For more, see our{" "}
                  <Link href="/privacy" className="text-[#BF6849] hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">6. Modifications & Cancellation</h2>
                <p className="mb-4">CRUISERFEST reserves the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Modify event categories, voting rules, or schedules at any time.</li>
                  <li>Cancel or postpone the event due to weather, emergencies, or unforeseen circumstances.</li>
                  <li>Remove any entry that violates these Terms or event guidelines.</li>
                </ul>
                <p className="font-semibold">
                  No refunds will be issued for canceled entries unless explicitly stated by event staff.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">7. Liability Disclaimer</h2>
                <p className="mb-4">CRUISERFEST and its organizers are not responsible for:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Loss or damage to vehicles during the event.</li>
                  <li>Issues arising from use of the App.</li>
                  <li>Inaccurate user-submitted content.</li>
                </ul>
                <p className="font-semibold">
                  Participation is voluntary and at your own risk. You release CRUISERFEST, its partners, and event
                  staff from any liability related to the event or App usage.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">8. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the State of Utah. Any disputes arising out of these Terms or
                  the event will be resolved in Utah courts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">9. Contact</h2>
                <p className="mb-4">
                  If you have any questions about these Terms, please contact the CRUISERFEST organizing team at:
                </p>
                <div className="bg-[#F2EEEB] p-4 rounded-lg">
                  <p className="font-semibold text-[#3A403D] mb-0">
                    📍 Land Cruiser Heritage Museum, Salt Lake City, UT
                  </p>
                </div>
              </section>

              <div className="bg-[#A9BF88]/10 border-l-4 border-[#A9BF88] p-6 rounded-r-lg">
                <p className="font-semibold text-[#3A403D] mb-2">
                  By continuing to use this App, you confirm that you understand and accept these Terms.
                </p>
                <p className="text-[#BF6849] font-bold text-lg mb-0">
                  Let's keep it clean, respectful, and all about the Cruisers. See you at the 2025 CRUISERFEST
                  Show-N-Shine!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button
            asChild
            variant="outline"
            className="bg-transparent border-[#3A403D] text-[#3A403D] hover:bg-[#3A403D] hover:text-white"
          >
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
