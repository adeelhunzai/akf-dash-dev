'use client';

import { ShieldX } from 'lucide-react';

interface ForbiddenAccessProps {
  message?: string;
  showHomeButton?: boolean;
}

export function ForbiddenAccess({ 
  message = 'You do not have permission to access this page.',
  showHomeButton = false 
}: ForbiddenAccessProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldX className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Forbidden</h1>
        <p className="text-gray-600 mb-8">{message}</p>
        {showHomeButton && (
          <p className="text-gray-500 text-sm">
            Please contact your administrator if you believe this is an error.
          </p>
        )}
      </div>
    </div>
  );
}

