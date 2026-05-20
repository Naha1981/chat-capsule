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
  const { currentScreen } = useAppState();

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
}
