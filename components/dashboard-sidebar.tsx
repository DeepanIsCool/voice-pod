// components/dashboard-sidebar.tsx

"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, LogOut, PhoneCall } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth"
import { ModeToggle } from "@/components/mode-toggle"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  const navItems = [
    {
      title: "Call Logs",
      href: "/dashboard",
      icon: PhoneCall,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Prompt Management",
      href: "/dashboard/prompt",
      icon: FileText,
      isActive: pathname === "/dashboard/prompt",
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-2">
          <img
            src="/favicon.png"
            alt="Logo"
            className="w-8 h-8 drop-shadow-[0_0_20px_rgba(56,189,248,0.85)]"
            style={{ borderRadius: '0.5rem' }}
          />
          <div className="font-semibold text-2xl">Bol Bachhan</div>
        </div>
        <ModeToggle />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={item.isActive}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
