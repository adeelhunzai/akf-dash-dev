"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useDeleteUserMutation } from "@/lib/store/api/userApi"

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: "Learner" | "Facilitator" | "Manager"
  team: string
  country: string
  teamsCount: number
  coursesCount: number
  status: "Active" | "Inactive"
  department: string
}

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
}

export default function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const [deleteUser, { isLoading }] = useDeleteUserMutation()

  const handleDelete = async () => {
    if (!user) return

    try {
      await deleteUser({ userId: parseInt(user.id) }).unwrap()
      onOpenChange(false)
    } catch (error) {
      // Handle error silently for now
      console.error('Failed to delete user:', error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Warning Icon */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Header */}
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-2xl font-bold">Delete User</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground pt-2">
            Are you sure you want to delete <span className="font-semibold">{user?.name}</span>? This action cannot be
            undone and will permanently remove all user data.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
            <Avatar className="h-12 w-12 bg-[#16a34a]">
              <AvatarFallback className="text-white font-semibold">{user.avatar}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <AlertDialogCancel className="flex-1 border-border" disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <Button 
            onClick={handleDelete} 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
