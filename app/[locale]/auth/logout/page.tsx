"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/lib/store"
import { logout } from "@/lib/store/slices/authSlice"

function LogoutHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // 1. Immediately clear local session/Redux state
    dispatch(logout())

    // 2. Redirect back out of the app to the given parameter
    const redirectTo = searchParams.get("redirect_to")
    
    if (redirectTo) {
      // Bounce back to the WordPress URL
      window.location.href = redirectTo
    } else {
      // Fallback: Drop user on our own splash/login screen
      router.push("/en/auth/login")
    }
  }, [dispatch, router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#00B140] border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-medium text-gray-700">Signing out safely...</h2>
      </div>
    </div>
  )
}

export default function LogoutCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00B140] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-medium text-gray-700">Signing out safely...</h2>
        </div>
      </div>
    }>
      <LogoutHandler />
    </Suspense>
  )
}
