"use client"

import type React from "react"
import { useRouter } from "next/navigation"

const CommissionerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <div>
      {/* Basic layout structure - can be expanded */}
      <header>
        <h1>Commissioner Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main>{children}</main>
      <footer>
        <p>&copy; 2024 Commissioner Panel</p>
      </footer>
    </div>
  )
}

export default CommissionerLayout
