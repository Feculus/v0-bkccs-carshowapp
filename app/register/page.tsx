import type { Metadata } from "next"
import RegisterPageClient from "./RegisterPageClient"

// Add metadata for this page
export const metadata: Metadata = {
  title: "Register Your Vehicle - 2025 CRUISERFEST SHOW-N-SHINE",
  description:
    "Register your vehicle for the 2025 CRUISERFEST SHOW-N-SHINE. Join the premier automotive showcase featuring enthusiasts, collectors, and extraordinary vehicles.",
  openGraph: {
    title: "Register Your Vehicle - 2025 CRUISERFEST SHOW-N-SHINE",
    description:
      "Register your vehicle for the 2025 CRUISERFEST SHOW-N-SHINE. Join the premier automotive showcase featuring enthusiasts, collectors, and extraordinary vehicles.",
  },
}

export default function RegisterPage() {
  return <RegisterPageClient />
}
