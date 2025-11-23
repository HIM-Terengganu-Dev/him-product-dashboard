'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardView from '../components/DashboardView';
import CrmView from '../components/CrmView';
import PlaceholderView from '../components/PlaceholderView';
import Header from '../components/Header';
import ClientStatusView from '../components/ClientStatusView';
import ClientSegmentView from '../components/ClientSegmentView';
import ProspectStatusView from '../components/ProspectStatusView';
import SalesView from '../components/SalesView';
import LoginView from '../components/LoginView';
import { jwtDecode } from 'jwt-decode';

export type ViewType = "Dashboard" | "Orders" | "CRM" | "Client Status" | "Client Segment" | "Prospect Status" | "Sales" | "Products" | "Messages" | "Settings";

interface User {
  name: string;
  email: string;
  picture: string;
}

// Extend the Window interface to include the google object for TypeScript
declare global {
  interface Window {
    google: any;
  }
}

export default function HomePage() {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const [user, setUser] = useState<User | null>(null);
  const [isAuthInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [activeView, setActiveView] = useState<ViewType>("CRM");
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Closed on mobile by default

  const handleSignOut = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const handleCredentialResponse = async (response: any) => {
    setIsVerifying(true);
    setAuthError(null);
    try {
      const decoded: { name: string, email: string, picture: string, sub: string } = jwtDecode(response.credential);

      // **NEW**: Check if the user is authorized before granting access
      const authCheckResponse = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decoded.email }),
      });

      if (!authCheckResponse.ok) {
        throw new Error('Authorization check failed.');
      }

      const { authorized } = await authCheckResponse.json();

      if (authorized) {
        const newUser = {
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture
        };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
      } else {
        setAuthError('Access Denied: This Google account is not authorized to access the dashboard.');
        handleSignOut(); // Ensure any lingering state is cleared
      }
    } catch (error) {
      console.error("Error during authentication process:", error);
      setAuthError('An error occurred during sign-in. Please try again.');
      handleSignOut();
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const initializeGSI = () => {
      if (window.google) {
        if (GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse
          });
          if (!storedUser) {
            window.google.accounts.id.prompt();
          }
        }
        setAuthInitialized(true);
      } else {
        setTimeout(initializeGSI, 100);
      }
    };

    initializeGSI();
  }, [GOOGLE_CLIENT_ID, handleSignOut]);

  // Auto-open sidebar on desktop, close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderView = useCallback(() => {
    switch (activeView) {
      case "Dashboard":
        return <DashboardView />;
      case "Orders":
        return <PlaceholderView title="Orders" />;
      case "CRM":
        return <CrmView />;
      case "Client Status":
        return <ClientStatusView />;
      case "Client Segment":
        return <ClientSegmentView />;
      case "Prospect Status":
        return <ProspectStatusView />;
      case "Sales":
        return <SalesView />;
      case "Products":
        return <PlaceholderView title="Products" />;
      case "Messages":
        return <PlaceholderView title="Messages" />;
      case "Settings":
        return <PlaceholderView title="Settings" />;
      default:
        return <CrmView />;
    }
  }, [activeView]);

  if (!user) {
    return (
      <LoginView
        isInitialized={isAuthInitialized}
        clientId={GOOGLE_CLIENT_ID}
        authError={authError}
        isVerifying={isVerifying}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Header
          currentView={activeView}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setSidebarOpen(p => !p)}
          user={user}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
}