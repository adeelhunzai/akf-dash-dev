"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, ExternalLink, Loader2, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react"
import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

interface CertificateViewerModalProps {
  isOpen: boolean
  onClose: () => void
  pdfBlobUrl: string | null
  certificateUrl: string | null
  certificateTitle: string
  onDownload: () => void
  isDownloading?: boolean
  isLoading?: boolean
}

export function CertificateViewerModal({
  isOpen,
  onClose,
  pdfBlobUrl,
  certificateUrl,
  certificateTitle,
  onDownload,
  isDownloading = false,
  isLoading = false,
}: CertificateViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [pdfError, setPdfError] = useState(false)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
    setPdfError(false)
  }, [])

  const onDocumentLoadError = useCallback(() => {
    setPdfError(true)
  }, [])

  const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages || 1))
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))

  // Reset state when modal closes
  const handleClose = () => {
    setPageNumber(1)
    setScale(1.0)
    setNumPages(null)
    setPdfError(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className={`${isFullscreen ? 'sm:max-w-[98vw] max-w-[98vw] h-[96vh]' : 'sm:max-w-[94vw] max-w-[94vw] h-[90vh]'} flex flex-col p-0 gap-0`}
      >
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg font-semibold truncate pr-4">
              {certificateTitle}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              {certificateUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(certificateUrl, '_blank')}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={onDownload}
                disabled={isDownloading || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-1" />
                {isDownloading ? "Downloading..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Certificate Content */}
        <div className="flex-1 overflow-auto bg-gray-100 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="text-sm text-muted-foreground">Loading certificate...</span>
              </div>
            </div>
          ) : pdfBlobUrl && !pdfError ? (
            <div className="flex flex-col items-center py-4">
              <Document
                file={pdfBlobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center p-8">
                    <p className="text-gray-600 mb-4">Failed to load PDF</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              </Document>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <p className="text-gray-600 mb-4">
                {pdfError ? "Failed to load certificate PDF." : "Certificate preview not available."}
              </p>
              {certificateUrl && (
                <Button
                  onClick={() => window.open(certificateUrl, '_blank')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls - Only show when PDF is loaded */}
        {pdfBlobUrl && !pdfError && numPages && !isLoading && (
          <div className="px-4 py-3 border-t bg-white flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 0.5}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 3}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
