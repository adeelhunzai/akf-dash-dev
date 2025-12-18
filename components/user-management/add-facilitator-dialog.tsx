"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateUserMutation, useUpdateUserMutation } from "@/lib/store/api/userApi";
import { SuccessModal } from "@/components/ui/success-modal";

interface AddFacilitatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFacilitatorDialog({
  open,
  onOpenChange,
}: AddFacilitatorDialogProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
  });
  const [password, setPassword] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const { toast } = useToast();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successUserData, setSuccessUserData] = useState({ name: "", email: "" });
  const [emailError, setEmailError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "", organization: "" });
    setPassword("");
    setEmailError("");
  };

  const sanitizeUsername = (email: string) => {
    const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    const timestamp = Date.now().toString().slice(-4);
    return `${base || "facilitator"}${timestamp}`.toLowerCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(""); // Clear previous email error
    
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password required",
        description: "Generate or enter a password before creating the facilitator.",
      });
      return;
    }

    try {
      const newUser = await createUser({
        username: sanitizeUsername(formData.email),
        email: formData.email,
        password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        ...(formData.organization ? { organization: formData.organization } : {}),
        // Facilitator = group_leader in WordPress
        roles: ["group_leader"],
      }).unwrap();

      if (formData.organization) {
        try {
          await updateUser({ userId: newUser.id, organization: formData.organization }).unwrap();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Organization not saved",
            description:
              "Facilitator was created, but the organization could not be persisted. You can update it later.",
          });
        }
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      setSuccessUserData({ name: fullName, email: formData.email });
      resetForm();
      onOpenChange(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      // RTK Query error structure: error.data contains the API response
      const code = error?.data?.code;
      const message = error?.data?.message ?? "Something went wrong while creating the facilitator.";
      
      // Show inline error for email-related errors
      if (code === "existing_user_email" || code === "invalid_email" || code === "empty_user_email") {
        setEmailError(message);
        return;
      }
      
      // Username collision - retry with different timestamp (rare edge case)
      if (code === "existing_user_login") {
        toast({
          variant: "destructive",
          title: "Please try again",
          description: "A temporary conflict occurred. Please submit again.",
        });
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Unable to create facilitator",
        description: message,
      });
    }
  };

  const generatePassword = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
    const length = 12;
    const generated = Array.from({ length }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length)),
    ).join("");
    setPassword(generated);
  };

  const handleCopyPassword = async () => {
    if (!password) return;
    if (!navigator?.clipboard) {
      toast({
        variant: "destructive",
        title: "Copy not supported",
        description: "Your browser does not support clipboard operations.",
      });
      return;
    }

    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(password);
      toast({ title: "Password copied", description: "The password is ready to paste." });
      setPasswordCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setPasswordCopied(false), 1000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy the password. Try again manually.",
      });
    } finally {
      setIsCopying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (<>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl font-bold">
            Add Facilitator
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter Email address"
              value={formData.email}
              onChange={(e) => {
                handleChange(e);
                if (emailError) setEmailError(""); // Clear error when user types
              }}
              required
              className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type="text"
                placeholder="Generate or paste a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 pr-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePassword}
                >
                  Generate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPassword}
                  disabled={!password || isCopying}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              {passwordCopied && (
                <span className="absolute -top-5 right-0 rounded-full border border-[#e5e5e5] bg-white px-2 py-0.5 text-xs font-semibold text-[#16a34a]">
                  Copied
                </span>
              )}
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="organization" className="text-sm font-medium">
              Organization
            </Label>
            <Input
              id="organization"
              name="organization"
              placeholder="Enter organization name (optional)"
              value={formData.organization}
              onChange={handleChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#16a34a] text-white hover:bg-[#15803d]"
              disabled={isCreating}
            >
              {isCreating ? 'Adding…' : 'Add Facilitator'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <SuccessModal
      open={showSuccessModal}
      onOpenChange={setShowSuccessModal}
      title="Facilitator Added"
      message="The facilitator has been added successfully and can now log in."
      userName={successUserData.name}
      userEmail={successUserData.email}
      buttonText="Done"
    />
  </>);
}
