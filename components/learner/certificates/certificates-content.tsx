"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, Download, Eye } from "lucide-react"
import { useGetLearnerCertificatesQuery } from "@/lib/store/api/userApi"
import { Certificate } from "@/lib/types/wordpress-user.types"
import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { getTokenCookie } from "@/lib/utils/cookies"
import { CertificateViewerModal } from "./certificate-viewer-modal"

// Cache entry type
interface CacheEntry {
  pdfBlobUrl: string
  fallbackUrl: string | null
  timestamp: number
}

// Cache expiry time (10 minutes)
const CACHE_EXPIRY_MS = 10 * 60 * 1000

export default function CertificatesContent() {
  const { data, isLoading, error } = useGetLearnerCertificatesQuery()
  const [loadingCertId, setLoadingCertId] = useState<string | null>(null)
  const { toast } = useToast()
  
  // PDF cache - stores blob URLs by certificate ID
  const pdfCacheRef = useRef<Map<string, CacheEntry>>(new Map())
  
  // Modal state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [viewerPdfBlobUrl, setViewerPdfBlobUrl] = useState<string | null>(null)
  const [viewerTitle, setViewerTitle] = useState("")
  const [viewerCertificate, setViewerCertificate] = useState<Certificate | null>(null)
  const [viewerLoading, setViewerLoading] = useState(false)

  const certificates = data?.data?.certificates || []

  // Cleanup all cached blob URLs on unmount
  useEffect(() => {
    return () => {
      pdfCacheRef.current.forEach((entry) => {
        URL.revokeObjectURL(entry.pdfBlobUrl)
      })
      pdfCacheRef.current.clear()
    }
  }, [])

  // Get from cache
  const getFromCache = useCallback((certificateId: string): CacheEntry | null => {
    const entry = pdfCacheRef.current.get(certificateId)
    if (!entry) {
      return null
    }
    // Check if entry is still valid
    if (Date.now() - entry.timestamp < CACHE_EXPIRY_MS) {
      return entry
    }
    // Remove expired entry
    URL.revokeObjectURL(entry.pdfBlobUrl)
    pdfCacheRef.current.delete(certificateId)
    return null
  }, [])

  // Add to cache
  const addToCache = useCallback((certificateId: string, pdfBlobUrl: string, fallbackUrl: string | null) => {
    pdfCacheRef.current.set(certificateId, {
      pdfBlobUrl,
      fallbackUrl,
      timestamp: Date.now(),
    })
  }, [])

  // Get or fetch certificate PDF (with caching)
  const getOrFetchCertificatePdf = async (certificate: Certificate): Promise<{ pdfBlobUrl: string | null, fallbackUrl: string | null }> => {
    // Check cache first
    const cached = getFromCache(certificate.id)
    if (cached) {
      console.log('Certificate PDF loaded from cache:', certificate.id)
      return { pdfBlobUrl: cached.pdfBlobUrl, fallbackUrl: cached.fallbackUrl }
    }

    // Not in cache, fetch from API
    const result = await fetchCertificatePdfFromApi(certificate)
    
    // Cache the result if we got a blob URL
    if (result.pdfBlobUrl) {
      addToCache(certificate.id, result.pdfBlobUrl, result.fallbackUrl)
    }
    
    return result
  }

  // Fetch certificate PDF from API (returns base64 PDF)
  const fetchCertificatePdfFromApi = async (certificate: Certificate): Promise<{ pdfBlobUrl: string | null, fallbackUrl: string | null }> => {
    const token = getTokenCookie()
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to access certificates.",
        variant: "destructive",
      })
      return { pdfBlobUrl: null, fallbackUrl: null }
    }

    const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://akfhub-dev.inspirartweb.com/wp-json'
    const url = `${apiUrl}/custom-api/v1/learner-certificates/${certificate.id}/view?format=pdf`

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
        // Check if we got base64 PDF data
        if (jsonData.data?.pdf_base64) {
          // Convert base64 to blob
          const byteCharacters = atob(jsonData.data.pdf_base64)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'application/pdf' })
          const blobUrl = URL.createObjectURL(blob)
          
          return { pdfBlobUrl: blobUrl, fallbackUrl: null }
        }
        
        // Fallback: got URL instead of PDF data - try to fetch PDF from that URL
        if (jsonData.data?.certificate_url) {
          const pdfBlobUrl = await fetchPdfFromUrl(jsonData.data.certificate_url)
          if (pdfBlobUrl) {
            return { pdfBlobUrl, fallbackUrl: null }
          }
          // If fetch failed, return the URL as fallback
          return { pdfBlobUrl: null, fallbackUrl: jsonData.data.certificate_url }
        }
        
        throw new Error('Certificate data not found in response')
      } else {
        throw new Error(jsonData.message || 'Failed to generate certificate')
      }
    } catch (err) {
      console.error('Failed to fetch certificate PDF:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to fetch certificate',
        variant: "destructive",
      })
      return { pdfBlobUrl: null, fallbackUrl: null }
    }
  }

  // Fetch PDF from URL and return blob URL
  const fetchPdfFromUrl = async (pdfUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(pdfUrl, {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        console.error('Failed to fetch PDF from URL:', response.status)
        return null
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/pdf')) {
        console.error('Response is not a PDF:', contentType)
        return null
      }
      
      const blob = await response.blob()
      return URL.createObjectURL(blob)
    } catch (err) {
      console.error('Error fetching PDF from URL:', err)
      return null
    }
  }

  // Fetch certificate URL from API (for download)
  const fetchCertificateUrl = async (certificate: Certificate): Promise<string | null> => {
    const token = getTokenCookie()
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in to access certificates.",
        variant: "destructive",
      })
      return null
    }

    const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://akfhub-dev.inspirartweb.com/wp-json'
    const url = `${apiUrl}/custom-api/v1/learner-certificates/${certificate.id}/download`

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
      
      if (jsonData.success && jsonData.data?.download_url) {
        return jsonData.data.download_url
      } else {
        throw new Error(jsonData.message || 'Failed to generate certificate')
      }
    } catch (err) {
      console.error('Failed to fetch certificate URL:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to fetch certificate',
        variant: "destructive",
      })
      return null
    }
  }

  // Download PDF from URL by fetching it as blob
  // WordPress now injects cert-nonce without redirect, so CORS should work
  const downloadPdfFromUrl = async (pdfUrl: string, filename: string) => {
    try {
      // Fetch the PDF with credentials for CORS
      const response = await fetch(pdfUrl, {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`)
      }

      // Get the blob
      const blob = await response.blob()
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      toast({
        title: "Download started",
        description: "Your certificate is being downloaded.",
      })
    } catch (err) {
      console.error('Failed to download PDF:', err)
      // Fallback: open in new tab if fetch fails
      window.open(pdfUrl, '_blank')
      toast({
        title: "Certificate opened",
        description: "Certificate opened in new tab. Use Ctrl+S or browser menu to save as PDF.",
      })
    }
  }

  // Handle view certificate - opens in modal with PDF
  const handleView = async (certificate: Certificate) => {
    setLoadingCertId(certificate.id + '_view')
    
    // Open modal immediately with loading state
    setViewerTitle(certificate.title)
    setViewerCertificate(certificate)
    setViewerOpen(true)
    setViewerLoading(true)
    setViewerPdfBlobUrl(null)
    setViewerUrl(null)
    
    // Fetch the PDF (uses cache if available)
    const { pdfBlobUrl, fallbackUrl } = await getOrFetchCertificatePdf(certificate)
    
    if (pdfBlobUrl) {
      setViewerPdfBlobUrl(pdfBlobUrl)
    } else if (fallbackUrl) {
      setViewerUrl(fallbackUrl)
    }
    
    setViewerLoading(false)
    setLoadingCertId(null)
  }

  // Handle download certificate - use cached PDF if available
  const handleDownload = async (certificate: Certificate) => {
    setLoadingCertId(certificate.id + '_download')
    
    // Check cache first
    const cached = getFromCache(certificate.id)
    if (cached?.pdfBlobUrl) {
      // Download from cached blob
      const link = document.createElement('a')
      link.href = cached.pdfBlobUrl
      link.download = `${certificate.title}-certificate.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download started",
        description: "Your certificate is being downloaded.",
      })
      setLoadingCertId(null)
      return
    }
    
    // Not cached, fetch and download
    const { pdfBlobUrl } = await getOrFetchCertificatePdf(certificate)
    if (pdfBlobUrl) {
      const link = document.createElement('a')
      link.href = pdfBlobUrl
      link.download = `${certificate.title}-certificate.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download started",
        description: "Your certificate is being downloaded.",
      })
    }
    setLoadingCertId(null)
  }

  // Handle download from modal - use blob if available, otherwise fetch URL
  const handleModalDownload = async () => {
    if (!viewerCertificate) return
    setLoadingCertId(viewerCertificate.id + '_modal_download')
    
    // If we have a blob URL, download directly from it
    if (viewerPdfBlobUrl) {
      const link = document.createElement('a')
      link.href = viewerPdfBlobUrl
      link.download = `${viewerCertificate.title}-certificate.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download started",
        description: "Your certificate is being downloaded.",
      })
    } else {
      // Fallback to fetching download URL
      const downloadUrl = await fetchCertificateUrl(viewerCertificate)
      if (downloadUrl) {
        await downloadPdfFromUrl(downloadUrl, `${viewerCertificate.title}-certificate.pdf`)
      }
    }
    
    setLoadingCertId(null)
  }

  // Close modal - don't revoke blob URL since it's cached
  const handleCloseModal = () => {
    setViewerOpen(false)
    setViewerUrl(null)
    setViewerPdfBlobUrl(null)
    setViewerCertificate(null)
    setViewerLoading(false)
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

      {/* Certificate Viewer Modal */}
      <CertificateViewerModal
        isOpen={viewerOpen}
        onClose={handleCloseModal}
        pdfBlobUrl={viewerPdfBlobUrl}
        certificateUrl={viewerUrl}
        certificateTitle={viewerTitle}
        onDownload={handleModalDownload}
        isDownloading={loadingCertId === viewerCertificate?.id + '_modal_download'}
        isLoading={viewerLoading}
      />
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
