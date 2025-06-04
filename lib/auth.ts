"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function useAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("authToken")
      setToken(storedToken)
      setIsLoading(false)

      if (!storedToken) {
        router.push("/")
      }
    }
  }, [router])

  const logout = () => {
    sessionStorage.removeItem("authToken")
    setToken(null)
    router.push("/")
  }

  return { token, isLoading, logout }
}

export function getAuthHeaders() {
  const token = sessionStorage.getItem("authToken")
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  }
}
