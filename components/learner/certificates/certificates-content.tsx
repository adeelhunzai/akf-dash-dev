"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, Download, Eye, ExternalLink, ShoppingCart } from "lucide-react"
import { useGetCPDCertificatesQuery } from "@/lib/store/api/certificatesApi"
import { CPDCertificateItem } from "@/lib/types/cpd-certificate.types"
import { useState, useEffect, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { getTokenCookie } from "@/lib/utils/cookies"
import { CertificateViewerModal } from "./certificate-viewer-modal"
import { SocialShareButtons } from "./social-share-buttons"

// Cache entry type
interface CacheEntry {
  pdfBlobUrl: string
  fallbackUrl: string | null
  timestamp: number
}

// Cache expiry time (10 minutes)
const CACHE_EXPIRY_MS = 10 * 60 * 1000

export default function CertificatesContent() {
  const { data: cpdData, isLoading, error: cpdError } = useGetCPDCertificatesQuery()
  
  const [loadingCertId, setLoadingCertId] = useState<string | null>(null)
  const { toast } = useToast()
  
  // PDF cache - stores blob URLs by certificate ID
  const pdfCacheRef = useRef<Map<string, CacheEntry>>(new Map())
  
  // Modal state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)
  const [viewerPdfBlobUrl, setViewerPdfBlobUrl] = useState<string | null>(null)
  const [viewerTitle, setViewerTitle] = useState("")
  const [viewerLoading, setViewerLoading] = useState(false)

  const cpdCertificates = cpdData?.data || []

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
    if (!entry) return null
    if (Date.now() - entry.timestamp < CACHE_EXPIRY_MS) return entry
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



  // Helper to download blob
  const downloadBlobAsFile = (blobUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: "Download started", description: "Your certificate is being downloaded." })
  }

  // Handle modal download
  const handleModalDownload = async () => {
    if (viewerPdfBlobUrl && viewerTitle) {
      downloadBlobAsFile(viewerPdfBlobUrl, `${viewerTitle}-certificate.pdf`)
    }
  }

  // Fetch certificate PDF from CPD secure endpoint (payment-verified)
  const fetchCpdCertificatePdf = async (courseId: number): Promise<{ pdfBlobUrl: string | null, fallbackUrl: string | null }> => {
    const token = getTokenCookie()
    if (!token) {
      toast({ title: "Authentication required", description: "Please log in to access certificates.", variant: "destructive" })
      return { pdfBlobUrl: null, fallbackUrl: null }
    }

    const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://akfhub-dev.inspirartweb.com/wp-json'
    const url = `${apiUrl}/cpd/v1/user/certificates/${courseId}/view?format=pdf`

    try {
      const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || 'Failed to fetch certificate')
      }

      const jsonData = await response.json()
      if (jsonData.success) {
        if (jsonData.data?.pdf_base64) {
          const byteCharacters = atob(jsonData.data.pdf_base64)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'application/pdf' })
          return { pdfBlobUrl: URL.createObjectURL(blob), fallbackUrl: null }
        }
        if (jsonData.data?.certificate_url) {
          return { pdfBlobUrl: null, fallbackUrl: jsonData.data.certificate_url }
        }
        throw new Error('Certificate data not found in response')
      } else {
        throw new Error(jsonData.message || 'Failed to generate certificate')
      }
    } catch (err) {
      console.error('Failed to fetch CPD certificate PDF:', err)
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Failed to fetch certificate', variant: "destructive" })
      return { pdfBlobUrl: null, fallbackUrl: null }
    }
  }

  // Handle CPD certificate view - uses secure CPD endpoint with payment verification
  const handleCPDView = async (item: CPDCertificateItem) => {
    const cacheKey = `cpd_${item.course_id}`
    setLoadingCertId(cacheKey + '_view')
    setViewerTitle(item.course_name)
    setViewerOpen(true)
    setViewerLoading(true)
    setViewerPdfBlobUrl(null)
    setViewerUrl(null)

    // Check cache first
    const cached = getFromCache(cacheKey)
    if (cached) {
      if (cached.pdfBlobUrl) setViewerPdfBlobUrl(cached.pdfBlobUrl)
      else if (cached.fallbackUrl) setViewerUrl(cached.fallbackUrl)
      setViewerLoading(false)
      setLoadingCertId(null)
      return
    }

    const { pdfBlobUrl, fallbackUrl } = await fetchCpdCertificatePdf(item.course_id)
    if (pdfBlobUrl) {
      setViewerPdfBlobUrl(pdfBlobUrl)
      addToCache(cacheKey, pdfBlobUrl, fallbackUrl)
    } else if (fallbackUrl) {
      setViewerUrl(fallbackUrl)
    }

    setViewerLoading(false)
    setLoadingCertId(null)
  }

  // Handle CPD certificate download - uses secure CPD endpoint with payment verification
  const handleCPDDownload = async (item: CPDCertificateItem) => {
    const cacheKey = `cpd_${item.course_id}`
    setLoadingCertId(cacheKey + '_download')

    // Check cache first
    const cached = getFromCache(cacheKey)
    if (cached?.pdfBlobUrl) {
      downloadBlobAsFile(cached.pdfBlobUrl, `${item.course_name}-certificate.pdf`)
      setLoadingCertId(null)
      return
    }

    const { pdfBlobUrl } = await fetchCpdCertificatePdf(item.course_id)
    if (pdfBlobUrl) {
      addToCache(cacheKey, pdfBlobUrl, null)
      downloadBlobAsFile(pdfBlobUrl, `${item.course_name}-certificate.pdf`)
    }
    setLoadingCertId(null)
  }

  // Handle buy CPD certificate - redirect to WP course page where the plugin shortcode handles checkout
  const handleBuyCertificate = (item: CPDCertificateItem) => {
    const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://akfhub-dev.inspirartweb.com/wp-json'
    const siteUrl = apiUrl.replace(/\/wp-json\/?$/, '')
    window.location.href = `${siteUrl}/payment-test/?course_id=${item.course_id}`
  }

  const handleCloseModal = () => {
    setViewerOpen(false)
    setViewerUrl(null)
    setViewerPdfBlobUrl(null)
    setViewerLoading(false)
  }

  if (isLoading) {
    return <CertificatesLoadingSkeleton />
  }

  if (cpdError) {
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cpdCertificates.map((item) => (
          <CPDCertificateCard
            key={item.course_id}
            item={item}
            onView={() => handleCPDView(item)}
            onDownload={() => handleCPDDownload(item)}
            onBuy={() => handleBuyCertificate(item)}
          />
        ))}
      </div>

      {/* Empty State */}
      {cpdCertificates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
          <p className="text-muted-foreground">Complete courses to earn certificates</p>
        </div>
      )}

      <CertificateViewerModal
        isOpen={viewerOpen}
        onClose={handleCloseModal}
        pdfBlobUrl={viewerPdfBlobUrl}
        certificateUrl={viewerUrl}
        certificateTitle={viewerTitle}
        onDownload={handleModalDownload}
        isDownloading={false}
        isLoading={viewerLoading}
      />
    </div>
  )
}

// ============================================================
// CPD Certificate Card Component (matches screenshot design)
// ============================================================
interface CPDCertificateCardProps {
  item: CPDCertificateItem
  onView: () => void
  onDownload: () => void
  onBuy: () => void
}

function CPDCertificateCard({ item, onView, onDownload, onBuy }: CPDCertificateCardProps) {
  const isPurchased = item.has_certificate && item.certificate
  const canBuy = item.is_cpd && !item.has_certificate
  const isStandardCompleted = !isPurchased && !canBuy && !item.is_cpd && item.completion_date

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
      <CardContent className="p-7 flex flex-col h-full">
        {/* Header: Gradient Icon + Course Info */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #22c55e)' }}
          >
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[15px] leading-snug text-gray-900">{item.course_name}</h3>
            {item.certificate?.credential_id && (
              <p className="text-xs text-gray-400 mt-1">
                Certificate ID: {item.certificate.credential_id}
              </p>
            )}
          </div>
        </div>

        {/* Certificate Details */}
        <div className="space-y-3 mb-5 flex-1">
          {item.instructor && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Instructor:</span>
              <span className="font-semibold text-gray-900">{item.instructor}</span>
            </div>
          )}
          {item.quiz_score !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Overall Quiz Score:</span>
              <span className="font-bold text-green-600">{item.quiz_score}%</span>
            </div>
          )}
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500">Type:</span>
            <span
              className={`inline-flex items-center px-3 py-0.5 rounded-md text-xs font-bold ${
                item.is_cpd
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {item.type}
            </span>
          </div>
          {item.completion_date && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {isPurchased ? 'Completion Date:' : 'Course Completion Date:'}
              </span>
              <span className="font-semibold text-gray-900">{item.completion_date}</span>
            </div>
          )}
        </div>

        {/* Purchased State: View/Download + Social */}
        {isPurchased && (
          <>
            <div className="mb-4">
              <span className="text-sm font-bold text-green-600">Certificate Purchased</span>
            </div>
            <div className="flex flex-wrap w-full gap-2 sm:gap-2.5 mb-4">
              <Button
                variant="outline"
                className="flex flex-1 min-w-[120px] rounded-xl border-gray-300 text-sm font-medium h-auto min-h-[40px] py-2 whitespace-normal leading-tight justify-center"
                onClick={onView}
              >
                <Eye className="w-4 h-4 mr-1.5 shrink-0" />
                View
              </Button>
              <Button
                className="flex flex-1 min-w-[120px] rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium h-auto min-h-[40px] py-2 whitespace-normal leading-tight justify-center"
                onClick={onDownload}
              >
                <Download className="w-4 h-4 mr-1.5 shrink-0" />
                Download
              </Button>
            </div>
            {item.certificate?.share_urls && (
              <SocialShareButtons shareUrls={item.certificate.share_urls} />
            )}
          </>
        )}

        {/* Unpurchased CPD: Buy Button (+ pricing) */}
        {canBuy && (
          <>
            {item.pricing && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-green-800">CPD Certificate Price:</span>
                <span className="text-lg font-extrabold text-green-700">{item.pricing.price_formatted}</span>
              </div>
            )}
            <Button
              className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white min-h-[44px] h-auto py-2.5 px-4"
              onClick={onBuy}
            >
              <div className="flex items-center justify-center w-full gap-3">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <div className="flex flex-col items-start justify-center">
                  <span className="text-sm sm:text-base font-bold leading-none tracking-wide mb-1">Buy Now</span>
                  <span className="text-[10px] sm:text-[11px] font-medium opacity-80 leading-none">Verifiable CPD Certificate</span>
                </div>
              </div>
            </Button>
          </>
        )}

        {/* Standard (non-CPD) completed: View/Download + Share */}
        {isStandardCompleted && (
          <>
            <div className="mb-4">
              <span className="text-sm font-bold text-green-600">Certificate Earned</span>
            </div>
            <div className="flex flex-wrap w-full gap-2 sm:gap-2.5 mb-4">
              <Button
                variant="outline"
                className="flex flex-1 min-w-[120px] rounded-xl border-gray-300 text-sm font-medium h-auto min-h-[40px] py-2 whitespace-normal leading-tight justify-center"
                onClick={onView}
              >
                <Eye className="w-4 h-4 mr-1.5 shrink-0" />
                View
              </Button>
              <Button
                className="flex flex-1 min-w-[120px] rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium h-auto min-h-[40px] py-2 whitespace-normal leading-tight justify-center"
                onClick={onDownload}
              >
                <Download className="w-4 h-4 mr-1.5 shrink-0" />
                Download
              </Button>
            </div>
            <SocialShareButtons shareUrls={{
              linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&title=${encodeURIComponent(`I completed ${item.course_name}!`)}`,
              facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(`I completed ${item.course_name}!`)}`,
              twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just completed ${item.course_name}! 🎓`)}`,
              whatsapp: '',
              email: '',
              copy_link: '',
            }} />
          </>
        )}

        {/* Standard (non-CPD) not completed yet */}
        {!isPurchased && !canBuy && !item.is_cpd && !item.completion_date && (
          <div className="text-center py-3">
            <span className="text-sm text-gray-400">
              Complete the course to earn your certificate
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Loading Skeleton
// ============================================================
function CertificatesLoadingSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-lg mb-3" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
