import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        <DashboardSidebar />
        <main
          className="flex-1 flex flex-col items-center justify-center p-8 transition-all duration-300"
          // Responsive margin for expanded/collapsed sidebar
          data-sidebar-main
          style={{
            marginLeft: `var(--sidebar-width, 16rem)`
          }}
        >
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}