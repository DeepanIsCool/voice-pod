//app/dashboard/layout.tsx

"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading, token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/")
    }
  }, [isLoading, token, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        {/* Hamburger menu trigger - visible on all screen sizes */}
        <div className="absolute top-4 left-4 z-30">
          <SidebarTrigger />
        </div>
        <DashboardSidebar />
        <div className="flex-1 overflow-auto">
          <div className="w-full p-6">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  )
}
