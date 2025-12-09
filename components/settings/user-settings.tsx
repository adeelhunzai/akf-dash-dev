"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

export default function UserSettings() {
  const [formData, setFormData] = useState({
    fullName: "Admin User",
    jobTitle: "System Administrator",
    department: "IT",
    phoneNumber: "+1 (555) 123-4507",
  });

  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = () => {
    setProfilePicture(null);
  };

  const handleSave = () => {
    console.log("Saving user settings:", formData);
    // Add save logic here
  };

  const handleCancel = () => {
    // Reset form or navigate away
    setFormData({
      fullName: "Admin User",
      jobTitle: "System Administrator",
      department: "IT",
      phoneNumber: "+1 (555) 123-4507",
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Section Header */}
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="text-lg font-semibold">Profile</h2>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium">
            Full Name
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className="h-10"
          />
        </div>

        {/* Job Title / Role */}
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-sm font-medium">
            Job Title / Role
          </Label>
          <Select
            value={formData.jobTitle}
            onValueChange={(value) => handleInputChange("jobTitle", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select job title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="System Administrator">
                System Administrator
              </SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Instructor">Instructor</SelectItem>
              <SelectItem value="Learner">Learner</SelectItem>
              <SelectItem value="Content Creator">Content Creator</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label htmlFor="department" className="text-sm font-medium">
            Department
          </Label>
          <Select
            value={formData.department}
            onValueChange={(value) => handleInputChange("department", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-sm font-medium">
            Phone Number
          </Label>
          <Select
            value={formData.phoneNumber}
            onValueChange={(value) => handleInputChange("phoneNumber", value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select phone number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+1 (555) 123-4507">
                +1 (555) 123-4507
              </SelectItem>
              <SelectItem value="+1 (555) 123-4508">
                +1 (555) 123-4508
              </SelectItem>
              <SelectItem value="+1 (555) 123-4509">
                +1 (555) 123-4509
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Profile Picture Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Profile Picture</Label>
        <div className="flex items-center gap-4">
          {/* Avatar Circle */}
          <div className="relative">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#16a34a] flex items-center justify-center">
                <span className="text-white text-2xl font-semibold">
                  {formData.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Upload and Remove Links */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="profile-upload"
              className="text-sm text-foreground hover:underline cursor-pointer"
            >
              Upload New Picture
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={handleRemovePicture}
              className="text-sm text-red-600 hover:underline text-left"
            >
              Remove Picture
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="px-6 h-10"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="px-6 h-10 bg-[#16a34a] hover:bg-[#15803d] text-white"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
