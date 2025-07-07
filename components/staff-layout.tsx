"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Home, History, User, LifeBuoy, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StaffLayoutProps {
  children: React.ReactNode
}

export function StaffLayout({ children }: StaffLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/staff/dashboard" },
    { id: "home", label: "Home", icon: Home, path: "/staff/home" },
    { id: "history", label: "History", icon: History, path: "/staff/history" },
    { id: "profile", label: "Profile", icon: User, path: "/staff/profile" },
    { id: "help", label: "Help", icon: LifeBuoy, path: "/staff/help" },
  ]

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with logout */}
      <div className="flex justify-between items-center p-4 border-b bg-card">
        <h1 className="text-lg font-semibold text-foreground">Field Staff Portal</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto pb-16">{children}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 ${
                  isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
