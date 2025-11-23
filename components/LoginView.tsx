'use client';

import React, { useEffect } from 'react';

interface LoginViewProps {
  isInitialized: boolean;
  clientId: string;
  authError: string | null;
  isVerifying: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ isInitialized, clientId, authError, isVerifying }) => {

  useEffect(() => {
    if (isInitialized && clientId && window.google) {
      const signInDiv = document.getElementById('signInDiv');
      if (signInDiv && signInDiv.childElementCount === 0) {
        window.google.accounts.id.renderButton(
          signInDiv,
          { theme: 'filled_blue', size: 'large', type: 'standard', text: 'signin_with' }
        );
      }
    }
  }, [isInitialized, clientId]);

  const renderButtonState = () => {
    if (isVerifying) {
      return (
        <div className="flex items-center justify-center space-x-2 bg-gray-200 text-gray-500 font-medium py-3 px-6 rounded-lg cursor-wait animate-pulse h-[44px]">
          <span>Verifying access...</span>
        </div>
      );
    }
    
    if (isInitialized && clientId) {
      return <div id="signInDiv" className="flex justify-center"></div>;
    }

    return (
      <div className="flex items-center justify-center space-x-2 bg-gray-200 text-gray-500 font-medium py-3 px-6 rounded-lg cursor-wait animate-pulse h-[44px]">
        <span>Loading Sign-In...</span>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
      <div className="text-center p-6 sm:p-8 md:p-10 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="flex justify-center mb-6 sm:mb-8">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-indigo-700">HIM Product</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Welcome to the Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">Please sign in with your Google account to continue.</p>
        
        {renderButtonState()}

        {authError && (
            <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-xs sm:text-sm font-medium">
                {authError}
            </div>
        )}

        {!clientId && isInitialized && (
            <div className="mt-4 text-red-500 bg-red-50 p-3 rounded-lg text-xs sm:text-sm">
                <strong>Configuration Error:</strong> Google Client ID is missing. Please create a <code className="text-xs">.env.local</code> file and add your <code className="text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable sign-in.
            </div>
         )}
      </div>
    </div>
  );
};

export default LoginView;