"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useGetCourseSettingsQuery, useUpdateCourseSettingsMutation } from "@/lib/store/api/settingsApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseSettings() {
  const { data, isLoading, error } = useGetCourseSettingsQuery()
  const [updateSettings, { isLoading: isUpdating }] = useUpdateCourseSettingsMutation()

  const [settings, setSettings] = useState({
    certificateGeneration: true,
    cpdCertificateGeneration: true,
    quizRetakes: "3",
    passingScore: "70",
    courseExpiry: "365",
  });

  const [isDirty, setIsDirty] = useState(false);

  // Load settings from API
  useEffect(() => {
    if (data?.data) {
      const apiSettings = data.data
      setSettings({
        certificateGeneration: apiSettings.certificateGeneration,
        cpdCertificateGeneration: apiSettings.cpdCertificateGeneration,
        quizRetakes: apiSettings.quizRetakes,
        passingScore: apiSettings.passingScore,
        courseExpiry: apiSettings.courseExpiry,
      })
      setIsDirty(false)
    }
  }, [data])

  const handleToggleChange = (field: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        certificateGeneration: settings.certificateGeneration,
        cpdCertificateGeneration: settings.cpdCertificateGeneration,
        quizRetakes: settings.quizRetakes,
        passingScore: settings.passingScore,
        courseExpiry: settings.courseExpiry,
      }).unwrap()
      toast.success("Course settings saved successfully!");
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save course settings");
    }
  };

  const handleCancel = () => {
    // Reset form to API values
    if (data?.data) {
      const apiSettings = data.data
      setSettings({
        certificateGeneration: apiSettings.certificateGeneration,
        cpdCertificateGeneration: apiSettings.cpdCertificateGeneration,
        quizRetakes: apiSettings.quizRetakes,
        passingScore: apiSettings.passingScore,
        courseExpiry: apiSettings.courseExpiry,
      })
    } else {
      setSettings({
        certificateGeneration: true,
        cpdCertificateGeneration: true,
        quizRetakes: "3",
        passingScore: "70",
        courseExpiry: "365",
      })
    }
    setIsDirty(false);
    toast.info("Changes cancelled");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between py-4 border-b border-border">
            <div className="space-y-1 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading course settings. Please try again later.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Certificate generation */}
      <div className="flex items-start justify-between py-4 border-b border-border">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">
            Certificate generation
          </h3>
          <p className="text-sm text-muted-foreground">
            Generate certificates upon course completion
          </p>
        </div>
        <Switch
          checked={settings.certificateGeneration}
          onCheckedChange={(checked) =>
            handleToggleChange("certificateGeneration", checked)
          }
          className="data-[state=checked]:bg-[#16a34a]"
        />
      </div>

      {/* CPD Certificate generation */}
      <div className="flex items-start justify-between py-4 border-b border-border">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">
            CPD Certificate generation
          </h3>
          <p className="text-sm text-muted-foreground">
            Generate CPD certificates upon course completion
          </p>
        </div>
        <Switch
          checked={settings.cpdCertificateGeneration}
          onCheckedChange={(checked) =>
            handleToggleChange("cpdCertificateGeneration", checked)
          }
          className="data-[state=checked]:bg-[#16a34a]"
        />
      </div>

      {/* Input Fields Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Quiz Retakes Allowed */}
        <div className="space-y-2">
          <Label htmlFor="quizRetakes" className="text-sm font-medium">
            Quiz Retakes Allowed
          </Label>
          <Input
            id="quizRetakes"
            type="number"
            min="0"
            value={settings.quizRetakes}
            onChange={(e) => handleInputChange("quizRetakes", e.target.value)}
            className="h-10"
          />
        </div>

        {/* Passing Score (%) */}
        <div className="space-y-2">
          <Label htmlFor="passingScore" className="text-sm font-medium">
            Passing Score (%)
          </Label>
          <Input
            id="passingScore"
            type="number"
            min="0"
            max="100"
            value={settings.passingScore}
            onChange={(e) => handleInputChange("passingScore", e.target.value)}
            className="h-10"
          />
        </div>

        {/* Course Expiry (days) */}
        <div className="space-y-2">
          <Label htmlFor="courseExpiry" className="text-sm font-medium">
            Course Expiry (days)
          </Label>
          <Input
            id="courseExpiry"
            type="number"
            min="0"
            value={settings.courseExpiry}
            onChange={(e) => handleInputChange("courseExpiry", e.target.value)}
            className="h-10"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={!isDirty}
          className="px-6 h-10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isUpdating}
          className="px-6 h-10 bg-[#16a34a] hover:bg-[#15803d] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
