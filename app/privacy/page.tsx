import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Check, X } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy - 2025 CRUISERFEST SHOW-N-SHINE",
  description:
    "Privacy Policy for the CRUISERFEST Show-N-Shine Registration Application explaining how we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
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
              <Shield className="h-8 w-8 text-[#BF6849]" />
            </div>
            <CardTitle className="text-3xl font-bold text-[#3A403D]">Privacy Policy</CardTitle>
            <p className="text-[#3A403D]/60 text-lg">CRUISERFEST Show-N-Shine Registration App</p>
            <p className="text-[#3A403D]/80 font-semibold">Effective Date: July 31, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <div className="space-y-8 text-[#3A403D]">
              <div className="bg-[#F2EEEB] p-6 rounded-lg">
                <p className="text-lg leading-relaxed mb-4">
                  At CRUISERFEST, your privacy matters. This Privacy Policy explains how we collect, use, and protect
                  your personal information when you use the CRUISERFEST Show-N-Shine Registration App ("App").
                </p>
                <p className="font-semibold text-[#BF6849] mb-0">
                  By using the App, you consent to the practices described below.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">1. Information We Collect</h2>
                <p className="mb-4">
                  When you register or participate in the event, we may collect the following information:
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-[#3A403D] mb-3">Personal Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Full name</li>
                      <li>Email address</li>
                      <li>Phone number</li>
                      <li>City and state of residence</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-[#3A403D] mb-3">Vehicle Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Year, make, and model</li>
                      <li>Vehicle name or nickname</li>
                      <li>Vehicle description</li>
                      <li>Photos of your vehicle</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-[#3A403D] mb-3">App Usage Data</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>IP address and browser type (for security and analytics)</li>
                      <li>Actions taken within the app (e.g. votes submitted, entries created)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">We use the information you provide to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Process and manage your registration</li>
                  <li>Display vehicle profiles for public viewing and voting</li>
                  <li>Contact you with event updates or award notifications</li>
                  <li>Verify fair use of the voting system</li>
                  <li>Improve our services and event logistics</li>
                </ul>
                <p className="font-semibold text-[#BF6849]">We do not sell or rent your personal data.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">3. Public vs. Private Data</h2>
                <p className="mb-4">We treat your data with care:</p>

                <div className="bg-[#F2EEEB] p-6 rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#3A403D]/20">
                          <th className="text-left py-3 px-4 font-semibold text-[#3A403D]">Information</th>
                          <th className="text-center py-3 px-4 font-semibold text-[#3A403D]">Public</th>
                          <th className="text-center py-3 px-4 font-semibold text-[#3A403D]">Private</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3A403D]/10">
                        <tr>
                          <td className="py-3 px-4">Vehicle Photos & Description</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="ml-2 text-green-600 font-medium">Yes</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <X className="h-5 w-5 text-red-600" />
                              <span className="ml-2 text-red-600 font-medium">No</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Your First Name</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="ml-2 text-green-600 font-medium">Yes</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <X className="h-5 w-5 text-red-600" />
                              <span className="ml-2 text-red-600 font-medium">No</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Your Contact Info (email/phone)</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <X className="h-5 w-5 text-red-600" />
                              <span className="ml-2 text-red-600 font-medium">No</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="ml-2 text-green-600 font-medium">Yes (Admin-only)</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4">Voting Activity</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Check className="h-5 w-5 text-green-600" />
                              <span className="ml-2 text-green-600 font-medium">Anonymous totals</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center">
                              <X className="h-5 w-5 text-red-600" />
                              <span className="ml-2 text-red-600 font-medium">No individual data shared</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">4. Image and Content Rights</h2>
                <p className="mb-4">
                  By uploading photos and descriptions, you grant CRUISERFEST a royalty-free license to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Display your vehicle entry online and at the event</li>
                  <li>Use your content for event promotion and recap (2025 and future years)</li>
                </ul>
                <p className="font-semibold text-[#A9BF88]">You retain full ownership of your content.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">5. Data Retention</h2>
                <p className="mb-4">
                  We retain your information only as long as needed for the purposes outlined above, typically until the
                  conclusion of the event season, unless required longer for legal or archival reasons.
                </p>
                <p className="font-semibold">You may request deletion of your data by contacting us.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">6. Security</h2>
                <p className="mb-4">We take reasonable precautions to protect your information:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Admin-only access to sensitive data</li>
                  <li>Encrypted storage of registration records</li>
                  <li>Monitoring for unauthorized access</li>
                </ul>
                <p className="font-semibold">No system is 100% secure, but we're committed to protecting your data.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">7. Third-Party Services</h2>
                <p>
                  We use trusted third-party platforms (such as Supabase and Vercel) for secure hosting and data
                  storage. These services adhere to industry-standard security practices and do not have rights to use
                  your data beyond what's necessary to support the app.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">8. Your Rights</h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Access your data</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal data</li>
                  <li>Withdraw consent for data use (which may remove your registration from the event)</li>
                </ul>
                <p className="font-semibold">To exercise these rights please speak to a member of the team.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">9. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy occasionally to reflect changes in technology or event procedures.
                  When we do, we'll update the effective date at the top of this page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#BF6849] mb-4">10. Contact</h2>
                <p className="mb-4">Questions or concerns? Reach out:</p>
                <div className="bg-[#F2EEEB] p-4 rounded-lg">
                  <p className="font-semibold text-[#3A403D] mb-0">
                    📍 Land Cruiser Heritage Museum
                    <br />
                    Salt Lake City, Utah
                  </p>
                </div>
              </section>

              <div className="bg-[#A9BF88]/10 border-l-4 border-[#A9BF88] p-6 rounded-r-lg">
                <p className="text-[#BF6849] font-bold text-lg mb-0">
                  Thank you for being part of CRUISERFEST. We're committed to keeping your information secure and your
                  Cruiser in the spotlight.
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
