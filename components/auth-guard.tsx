"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const userString = localStorage.getItem("user")
      if (userString) {
        const user = JSON.parse(userString)
        setUserRole(user?.role || null)
      } else {
        setUserRole(null)
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error)
      setUserRole(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">Please log in first</h1>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return children
}
