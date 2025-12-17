"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, Download, Eye } from "lucide-react"
import { useGetLearnerCertificatesQuery } from "@/lib/store/api/userApi"
import { Certificate } from "@/lib/types/wordpress-user.types"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { getTokenCookie } from "@/lib/utils/cookies"

export default function CertificatesContent() {
  const { data, isLoading, error } = useGetLearnerCertificatesQuery()
  const [loadingCertId, setLoadingCertId] = useState<string | null>(null)
  const { toast } = useToast()

  const certificates = data?.data?.certificates || []

  // Fetch certificate URL from API and open it
  const fetchCertificateUrl = async (certificate: Certificate, action: 'view' | 'download') => {
    const token = getTokenCookie()
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to access certificates.",
        variant: "destructive",
      })
      return
    }

    const endpoint = action === 'view' ? 'view' : 'download'
    const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://akfhub-dev.inspirartweb.com/wp-json'
    const url = `${apiUrl}/custom-api/v1/learner-certificates/${certificate.id}/${endpoint}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to fetch certificate')
      }

      const jsonData = await response.json()
      
      if (jsonData.success) {
        // Get the signed URL from response
        const certUrl = action === 'view' 
          ? jsonData.data?.certificate_url 
          : jsonData.data?.download_url
        
        if (certUrl) {
          // Open the signed URL in a new tab
          window.open(certUrl, '_blank')
        } else {
          throw new Error('Certificate URL not found in response')
        }
      } else {
        throw new Error(jsonData.message || 'Failed to generate certificate')
      }
    } catch (err) {
      console.error(`Failed to ${action} certificate:`, err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : `Failed to ${action} certificate`,
        variant: "destructive",
      })
    }
  }

  // Handle view certificate
  const handleView = async (certificate: Certificate) => {
    setLoadingCertId(certificate.id + '_view')
    await fetchCertificateUrl(certificate, 'view')
    setLoadingCertId(null)
  }

  // Handle download certificate
  const handleDownload = async (certificate: Certificate) => {
    setLoadingCertId(certificate.id + '_download')
    await fetchCertificateUrl(certificate, 'download')
    setLoadingCertId(null)
  }

  if (isLoading) {
    return <CertificatesLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Failed to load certificates. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          All Courses
        </Button>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((certificate) => (
          <Card key={certificate.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              {/* Certificate Icon */}
              <div className={`w-12 h-12 ${certificate.color} rounded-lg flex items-center justify-center mb-4`}>
                <Award className="w-6 h-6 text-white" />
              </div>

              {/* Certificate Title */}
              <h3 className="font-semibold text-base mb-1">{certificate.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{certificate.certificate_code}</p>

              {/* Certificate Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Instructor:</span>
                  <span className="font-medium">{certificate.instructor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Score:</span>
                  <span className="font-semibold text-green-600">{certificate.score}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{certificate.issue_date}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  size="sm"
                  onClick={() => handleView(certificate)}
                  disabled={loadingCertId === certificate.id + '_view'}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {loadingCertId === certificate.id + '_view' ? 'Loading...' : 'View'}
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                  size="sm"
                  onClick={() => handleDownload(certificate)}
                  disabled={loadingCertId === certificate.id + '_download'}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {loadingCertId === certificate.id + '_download' ? 'Loading...' : 'Download'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State (if no certificates) */}
      {certificates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
          <p className="text-muted-foreground">
            Complete courses to earn certificates
          </p>
        </div>
      )}
    </div>
  )
}

// Loading Skeleton Component
function CertificatesLoadingSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Certificates Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="w-12 h-12 rounded-lg mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
