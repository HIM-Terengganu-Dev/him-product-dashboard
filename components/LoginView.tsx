'use client';

import React, { useEffect } from 'react';
import { LogoIcon } from './Icons';

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
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <LogoIcon className="h-16 w-16 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to</h1>
        <h2 className="text-4xl font-extrabold text-indigo-600 mb-8">HIM Wellness BI</h2>
        <p className="text-gray-500 mb-8">Please sign in with your Google account to access the dashboard.</p>
        
        {renderButtonState()}

        {authError && (
            <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium">
                {authError}
            </div>
        )}

        {!clientId && isInitialized && (
            <div className="mt-4 text-red-500 bg-red-50 p-3 rounded-lg text-sm">
                <strong>Configuration Error:</strong> Google Client ID is missing. Please create a <code>.env.local</code> file and add your <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to enable sign-in.
            </div>
         )}
      </div>
    </div>
  );
};

export default LoginView;