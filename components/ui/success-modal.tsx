"use client"

import { CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  userName?: string
  userEmail?: string
  buttonText?: string
  onButtonClick?: () => void
}

export function SuccessModal({ 
  open, 
  onOpenChange, 
  title, 
  message, 
  userName,
  userEmail,
  buttonText = "Done",
  onButtonClick 
}: SuccessModalProps) {
  const handleClick = () => {
    onButtonClick?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {/* Success Icon */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: '#e0f3e8' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: '#00b140' }} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>

        {/* Message */}
        <p className="text-sm text-muted-foreground px-4">{message}</p>

        {/* User Info */}
        {(userName || userEmail) && (
          <div className="bg-muted/50 rounded-lg p-3 mx-4">
            {userName && <p className="font-semibold text-foreground">{userName}</p>}
            {userEmail && <p className="text-sm text-muted-foreground">{userEmail}</p>}
          </div>
        )}

        {/* Button */}
        <div className="pt-4">
          <Button 
            onClick={handleClick}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white"
          >
            {buttonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
