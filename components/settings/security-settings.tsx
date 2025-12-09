"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Monitor, Smartphone, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { useGetLoginSessionsQuery, useDeleteLoginSessionMutation, useLogoutAllSessionsMutation } from "@/lib/store/api/settingsApi";
import { useGetCurrentUserQuery } from "@/lib/store/api/userApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function SecuritySettings() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: sessionsData, isLoading: isLoadingSessions } = useGetLoginSessionsQuery()
  const [deleteSession] = useDeleteLoginSessionMutation()
  const [logoutAllSessions] = useLogoutAllSessionsMutation()
  const { data: currentUser } = useGetCurrentUserQuery()

  const sessions = sessionsData?.data || []

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    try {
      // Use WordPress native endpoint for password update
      const response = await fetch('/wp-json/wp/v2/users/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': (window as any).wpApiSettings?.nonce || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update password')
      }

      toast.success("Password updated successfully!");
      
      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId).unwrap()
      toast.success("Session logged out successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to logout session");
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      await logoutAllSessions().unwrap()
      toast.success("All other sessions have been logged out");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to logout all sessions");
    }
  };

  const getDeviceIcon = (deviceType: "desktop" | "mobile") => {
    return deviceType === "desktop" ? (
      <Monitor className="w-5 h-5 text-gray-600" />
    ) : (
      <Smartphone className="w-5 h-5 text-gray-600" />
    );
  };

  return (
    <div className="space-y-8">
      {isLoadingSessions && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}
      {/* Change Password Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
              placeholder="Enter current password"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
              placeholder="Enter new password"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
              placeholder="Confirm new password"
              className="h-10"
            />
          </div>

          <Button
            type="submit"
            className="bg-[#16a34a] hover:bg-[#15803d] text-white h-10"
          >
            Update Password
          </Button>
        </form>
      </div>

      {/* Login Devices / Sessions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Login Devices / Sessions</h3>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogoutAllSessions}
            className="h-9"
            disabled={sessions.filter((s) => !s.isCurrent).length === 0}
          >
            Logout All Sessions
          </Button>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0">
                  {getDeviceIcon(session.deviceType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{session.device}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {session.ipAddress}
                    </p>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-sm text-muted-foreground">
                      Last active: {session.lastActive}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.isCurrent && (
                  <span className="px-2 py-1 text-xs font-medium text-[#16a34a] bg-green-50 rounded">
                    Current
                  </span>
                )}
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleLogoutSession(session.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    aria-label="Logout session"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

