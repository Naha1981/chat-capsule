'use client';

import React from 'react';
import { useAppState } from '@/lib/app-state';
import LandingScreen from '@/components/screens/landing-screen';
import OnboardingScreen from '@/components/screens/onboarding-screen';
import DashboardScreen from '@/components/screens/dashboard-screen';
import InboxScreen from '@/components/screens/inbox-screen';
import ShipmentScreen from '@/components/screens/shipment-screen';
import ReviewScreen from '@/components/screens/review-screen';
import NerveCenterScreen from '@/components/screens/nerve-center-screen';

export default function Home() {
  const currentScreen = useAppState((s) => s.currentScreen);

  // Onboarding / Login screens
  if (currentScreen === 'onboarding' || currentScreen === 'login') {
    return <OnboardingScreen />;
  }

  // Main app screens
  if (currentScreen === 'dashboard') {
    return <DashboardScreen />;
  }
  if (currentScreen === 'inbox') {
    return <InboxScreen />;
  }
  if (currentScreen === 'shipment') {
    return <ShipmentScreen />;
  }
  if (currentScreen === 'review') {
    return <ReviewScreen />;
  }
  if (currentScreen === 'nerve-center') {
    return <NerveCenterScreen />;
  }

  // Default to landing
  return <LandingScreen />;
}
