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
          <div className="font-semibold">Admin Panel</div>
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
