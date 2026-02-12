'use client';

import { useState, useEffect } from 'react';
import { CoachMarks, type CoachMarkStep } from '@/components/onboarding/coach-marks';
import { completeDashboardTour } from './actions';

const DASHBOARD_STEPS: CoachMarkStep[] = [
  {
    targetSelector: 'stats',
    title: 'Vos statistiques',
    description:
      'Retrouvez ici un apercu rapide de votre activite : commandes, chiffre d\'affaires, clients et CA mensuel.',
    placement: 'bottom',
  },
  {
    targetSelector: 'quick-actions',
    title: 'Acces rapide',
    description:
      'Naviguez facilement vers vos commandes, produits, clients et abonnement en un clic.',
    placement: 'top',
  },
];

interface DashboardCoachMarksProps {
  showTour: boolean;
}

export function DashboardCoachMarks({ showTour }: DashboardCoachMarksProps) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (showTour) {
      const timer = setTimeout(() => setIsActive(true), 500);
      return () => clearTimeout(timer);
    }
  }, [showTour]);

  async function handleComplete() {
    setIsActive(false);
    await completeDashboardTour();
  }

  if (!showTour) return null;

  return (
    <CoachMarks
      steps={DASHBOARD_STEPS}
      tourId="dashboard-welcome"
      isActive={isActive}
      onComplete={handleComplete}
    />
  );
}
