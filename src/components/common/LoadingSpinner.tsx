import React from 'react';
import { Settings } from 'lucide-react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Settings className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Loading HVAC System</h2>
          <p className="text-gray-600">Please wait while we initialize your dashboard...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;