"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useGetFacilitatorSettingsQuery,
  useUpdateFacilitatorSettingsMutation,
  useChangeFacilitatorPasswordMutation,
} from "@/lib/store/api/settingsApi";
import { useAppDispatch } from "@/lib/store/hooks";
import { updateUserAvatar } from "@/lib/store/slices/authSlice";

export default function SettingsContent() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useGetFacilitatorSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateFacilitatorSettingsMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangeFacilitatorPasswordMutation();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [passwordLastChanged, setPasswordLastChanged] = useState("");

  // Password dialog state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Populate form when data loads
  useEffect(() => {
    if (data?.data) {
      setFirstName(data.data.firstName || "");
      setLastName(data.data.lastName || "");
      setEmail(data.data.email || "");
      setPhone(data.data.phone || "");
      setGender(data.data.gender || "");
      setCountry(data.data.country || "");
      setOrganisation(data.data.organisation || "");
      setProfilePicture(data.data.profilePicture);
      setPasswordLastChanged(data.data.passwordLastChanged || "");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSettings({
        firstName,
        lastName,
        phone,
        gender,
        country,
        organisation,
        profilePicture,
      }).unwrap();

      // Update the header avatar in Redux immediately
      dispatch(updateUserAvatar(profilePicture));

      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        // Reset input so the same file can be selected again
        event.target.value = "";
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setProfilePicture(base64);
      };
      reader.readAsDataURL(file);
    }
    // Reset input value so the same file can be selected again after removal
    event.target.value = "";
  };

  const handleRemovePhoto = () => {
    setProfilePicture(null);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap();

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.data?.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    const first = firstName?.[0] || "";
    return first.toUpperCase() || "U";
  };

  if (isLoading) {
    return <SettingsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Failed to load settings. Please try again later.</p>
        </div>
      </div>
    );
  }

  const availableOptions = data?.available_options;

  return (
    <div className="p-8">
      {/* Header */}
      <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-8">Settings</h1>

      <div className="bg-white rounded-md border border-gray-200 p-6">
        {/* Profile Photo Section */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Profile Photo</h2>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border border-gray-200">
              <AvatarImage src={profilePicture || undefined} alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="bg-[#00B140] text-white text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                className="bg-[#00B140] hover:bg-[#00B140]/90 text-white h-9 px-4 text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Photo
              </Button>
              <Button
                variant="outline"
                className="h-9 px-4 text-sm border-gray-300 text-gray-700"
                onClick={handleRemovePhoto}
                disabled={!profilePicture}
              >
                Remove Photo
              </Button>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            <div>
              <Label htmlFor="firstName" className="text-sm text-gray-500 font-normal mb-1.5 block">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-10 border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm text-gray-500 font-normal mb-1.5 block">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-10 border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            <div>
              <Label htmlFor="email" className="text-sm text-gray-500 font-normal mb-1.5 block">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="w-full h-10 bg-gray-100 border-gray-300 text-gray-700"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm text-gray-500 font-normal mb-1.5 block">
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full h-10 border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            <div>
              <Label htmlFor="gender" className="text-sm text-gray-500 font-normal mb-1.5 block">
                Gender (Optional)
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="w-full h-10 border-gray-300">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions?.genders.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="country" className="text-sm text-gray-500 font-normal mb-1.5 block">
                Country (Optional)
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full h-10 border-gray-300">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions?.countries.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="organisation" className="text-sm text-gray-500 font-normal mb-1.5 block">
              Organisation (Optional)
            </Label>
            <Input
              id="organisation"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              placeholder="Your organisation name"
              className="w-full h-10 border-gray-300 max-w-xl"
            />
          </div>
        </div>

        {/* Account & Security Section */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#1a1a1a] mb-4">Account & Security</h2>
          
          <div className="flex items-center justify-between p-4 bg-[#f9f9f9] rounded-md">
            <div>
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-muted-foreground">
                {passwordLastChanged ? `Last changed ${passwordLastChanged}` : "Never changed"}
              </p>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#00B140] hover:bg-[#00B140]/90 text-white">
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and a new password to update your account security.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#00B140] hover:bg-[#00B140]/90 text-white"
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  >
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            className="bg-[#00B140] hover:bg-[#00B140]/90 text-white px-6"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton Component
function SettingsLoadingSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-10 w-32 mb-8" />
      
      <div className="bg-white rounded-md border border-gray-200 p-6">
        {/* Profile Photo Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-6 w-28 mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>

        {/* Personal Information Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        {/* Account & Security Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>

        {/* Save Button Skeleton */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
