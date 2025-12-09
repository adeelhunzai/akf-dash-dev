"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Download, Eye } from "lucide-react"

interface Certificate {
  id: number
  title: string
  certificateId: string
  instructor: string
  score: string
  issueDate: string
  color: string
}

const certificates: Certificate[] = [
  {
    id: 1,
    title: "Digital Marketing Fundamentals",
    certificateId: "Certificate ID: DM-2024-001",
    instructor: "Michael Chen",
    score: "95%",
    issueDate: "2024-12-08",
    color: "bg-yellow-500",
  },
  {
    id: 2,
    title: "Customer Service Excellence",
    certificateId: "Certificate ID: CS-2024-002",
    instructor: "Lisa Wang",
    score: "88%",
    issueDate: "2024-11-15",
    color: "bg-purple-500",
  },
  {
    id: 3,
    title: "Time Management Skills",
    certificateId: "Certificate ID: TM-2024-003",
    instructor: "John Smith",
    score: "92%",
    issueDate: "2024-10-22",
    color: "bg-blue-600",
  },
]

export default function CertificatesContent() {
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
              <p className="text-xs text-muted-foreground mb-4">{certificate.certificateId}</p>

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
                  <span className="font-medium">{certificate.issueDate}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
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
