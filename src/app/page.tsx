import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { AuthOptionsCompat } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardWrapper from "@/components/layout/DashboardWrapper"

export default async function HomePage() {
  const session = (await getServerSession(authOptions as AuthOptionsCompat)) as Session | null

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden mobile-scroll-container">
      <DashboardWrapper session={session} />
    </div>
  )
}