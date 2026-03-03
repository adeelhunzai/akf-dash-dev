"use client"

import Image from "next/image"

interface AuthLoaderProps {
  message?: string
  subMessage?: string
}

/**
 * AuthLoader Component
 * A visually engaging full-screen loader used during authentication flows
 * (login, logout, SSO exchange, route redirects).
 * Uses inline styles to prevent FOUC (flash of unstyled content).
 */
export function AuthLoader({ 
  message = "Loading...", 
  subMessage = "Please wait" 
}: AuthLoaderProps) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8faf9 0%, #eef7f0 50%, #f0f9f2 100%)',
          zIndex: 9999,
        }}
      >
        {/* Logo */}
        <div className="auth-loader-logo" style={{ marginBottom: '2rem' }}>
          <Image
            src="/AKF-logo.svg"
            alt="AKF Learning Hub"
            width={180}
            height={80}
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>

        {/* Animated progress bar */}
        <div
          style={{
            width: 200,
            height: 3,
            background: '#e5e7eb',
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}
        >
          <div
            className="auth-loader-bar"
            style={{
              width: '40%',
              height: '100%',
              background: 'linear-gradient(90deg, #00b140, #00d44a, #00b140)',
              borderRadius: 999,
            }}
          />
        </div>

        {/* Status text */}
        <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#1f2937', margin: 0, letterSpacing: '-0.01em' }}>
          {message}
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.375rem 0 0' }}>
          {subMessage}
        </p>
      </div>

      {/* Animations only — layout is handled by inline styles above */}
      <style jsx global>{`
        @keyframes authLogoPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.97); }
        }
        @keyframes authBarSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .auth-loader-logo {
          animation: authLogoPulse 2s ease-in-out infinite;
        }
        .auth-loader-bar {
          animation: authBarSlide 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
