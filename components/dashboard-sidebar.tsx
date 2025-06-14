// components/dashboard-sidebar.tsx

"use client"

import { ModeToggle } from "@/components/mode-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth"
import { BarChart, FileText, LayoutDashboard, LogOut, PhoneCall, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { state, toggleSidebar, isMobile } = useSidebar()

  const navItems = [
    {
      title: "Call Logs",
      href: "/dashboard/call-logs",
      icon: PhoneCall,
      isActive: pathname === "/dashboard/call-logs",
    },
    {
      title: "Agent Configuration",
      href: "/dashboard/prompt",
      icon: FileText,
      isActive: pathname === "/dashboard/prompt",
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart,
      isActive: pathname === "/dashboard/analytics",
    },
    {
      title: "Lead Management",
      href: "/dashboard/leads",
      icon: Users,
      isActive: pathname === "/dashboard/leads",
    }
  ]

  return (
    <aside
      data-state={state}
      className={`
        group/sidebar flex flex-col bg-white dark:bg-[#18181b] border-r border-border shadow-lg
        transition-all duration-300 ease-in-out
        ${state === "collapsed" ? "w-16 min-w-[4rem] max-w-[4rem]" : "w-64 min-w-[16rem] max-w-[16rem]"}
        z-30
      `}
    >
      {/* Header with logo, name, and toggle */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.png"
            alt="Logo"
            className="w-8 h-8 drop-shadow-[0_0_20px_rgba(56,189,248,0.85)] rounded-lg cursor-pointer"
            onClick={toggleSidebar}
          />
          <span
            className={`
              font-semibold text-2xl text-gray-900 dark:text-gray-50
              transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden
              ${state === "expanded" ? "opacity-100 w-auto ml-2" : "opacity-0 w-0 ml-0"}
              ${state === "expanded" ? "delay-150" : ""}
            `}
            style={{ transitionDelay: state === 'expanded' ? '150ms' : '0ms', display: 'inline-block', minWidth: state === 'expanded' ? '100px' : '0' }}
          >Bol Bachhan</span>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200
              text-base font-medium
              ${item.isActive ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200 hover:bg-muted/60 dark:hover:bg-muted/40"}
              ${state === "collapsed" ? "justify-center px-0" : ""}
            `}
            title={item.title}
          >
            <span className="flex items-center">
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span
                className={`
                  transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden
                  ${state === "expanded" ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 ml-0"}
                  ${state === "expanded" ? "delay-150" : ""}
                `}
                style={{ transitionDelay: state === 'expanded' ? '150ms' : '0ms', display: 'inline-block', minWidth: state === 'expanded' ? '80px' : '0' }}
              >
                {item.title}
              </span>
            </span>
          </Link>
        ))}
      </nav>
      {/* Footer */}
      <div className="mt-auto border-t border-border p-4 flex flex-col gap-2">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-2 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-200 ${state === "collapsed" ? "justify-center px-0" : ""}`}
        >
          <LogOut className="w-6 h-6 text-red-500" />
          {state !== "collapsed" && <span>Logout</span>}
        </button>
        <div className="flex justify-center mt-2">
          <ModeToggle />
        </div>
      </div>
    </aside>
  )
}
