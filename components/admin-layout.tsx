"use client"

import type React from "react"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Edit3,
  IndianRupee,
  Home,
  UploadCloud,
  ImageIcon,
  Users,
  MapPin,
  Settings,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  const navGroups = [
    {
      label: "Data & Reporting",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
        { id: "deliveries", label: "Deliveries Log", icon: Package, path: "/admin/deliveries" },
        { id: "corrections", label: "Corrections Report", icon: Edit3, path: "/admin/corrections" },
        { id: "payouts", label: "Payouts", icon: IndianRupee, path: "/admin/payouts" },
        { id: "photos", label: "Photos", icon: ImageIcon, path: "/admin/photos" },
      ],
    },
    {
      label: "Management & Setup",
      items: [
        { id: "properties", label: "Properties", icon: Home, path: "/admin/properties" },
        { id: "uploads", label: "Uploads", icon: UploadCloud, path: "/admin/uploads" },
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
        { id: "wards", label: "Wards", icon: MapPin, path: "/admin/wards" },
        { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
      ],
    },
  ]

  // Desktop Sidebar Content (with collapse functionality)
  const DesktopSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
        {!sidebarCollapsed && <h2 className="text-lg font-semibold text-foreground">Vendor Admin</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="shrink-0 hover:bg-accent"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        {navGroups.map((group, index) => (
          <div key={index}>
            {!sidebarCollapsed && (
              <div className="px-3 py-2 text-sm font-medium text-muted-foreground">{group.label}</div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                return (
                  <TooltipProvider key={item.id}>
                    <Tooltip delayDuration={50}>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => router.push(item.path)}
                          className={`w-full flex items-center rounded-md text-sm transition-colors h-10 ${
                            sidebarCollapsed ? "justify-center px-2" : "justify-start gap-3 px-3"
                          } ${
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                          variant="ghost"
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </Button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right" align="center">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
            {index < navGroups.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <TooltipProvider>
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleLogout}
                className={`w-full bg-transparent ${sidebarCollapsed ? "px-2" : ""}`}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right" align="center">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )

  // Mobile Sidebar Content (no collapse functionality)
  const MobileSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Vendor Admin</h2>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        {navGroups.map((group, index) => (
          <div key={index}>
            <div className="px-3 py-2 text-sm font-medium text-muted-foreground">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path
                return (
                  <Button
                    key={item.id}
                    onClick={() => {
                      router.push(item.path)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-start gap-3 px-3 rounded-md text-sm transition-colors h-10 ${
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    variant="ghost"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                )
              })}
            </div>
            {index < navGroups.length - 1 && <Separator className="my-2" />}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button variant="outline" onClick={handleLogout} className="w-full bg-transparent">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex border-r bg-card transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-20" : "w-56"}`}
      >
        <DesktopSidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-56 p-0">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <h1 className="text-lg font-semibold">Vendor Admin</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}

export default AdminLayout
