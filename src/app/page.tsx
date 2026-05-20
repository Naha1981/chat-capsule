'use client';

import React, { Suspense } from 'react';
import { useAppState } from '@/lib/app-state';

// Lazy-load screens to avoid heavy initial compilation
const LandingScreen = React.lazy(() => import('@/components/screens/landing-screen'));
const OnboardingScreen = React.lazy(() => import('@/components/screens/onboarding-screen'));
const DashboardScreen = React.lazy(() => import('@/components/screens/dashboard-screen'));
const InboxScreen = React.lazy(() => import('@/components/screens/inbox-screen'));
const ShipmentScreen = React.lazy(() => import('@/components/screens/shipment-screen'));
const ReviewScreen = React.lazy(() => import('@/components/screens/review-screen'));
const NerveCenterScreen = React.lazy(() => import('@/components/screens/nerve-center-screen'));

function ScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-on-surface-variant font-mono">Loading CapsuleFlow AI...</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { currentScreen } = useAppState();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <LandingScreen />;
      case 'login':
        return <OnboardingScreen />;
      case 'onboarding':
        return <OnboardingScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'inbox':
        return <InboxScreen />;
      case 'shipment':
        return <ShipmentScreen />;
      case 'review':
        return <ReviewScreen />;
      case 'nerve-center':
        return <NerveCenterScreen />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <Suspense fallback={<ScreenLoader />}>
      {renderScreen()}
    </Suspense>
  );
}
