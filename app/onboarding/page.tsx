"use client";

import { OnboardingWizard } from "@/components/onboarding-wizard";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function OnboardingPage() {
  return (<AutoLocalizedContent>
    <main className="min-h-[calc(100vh-6rem)] py-8 sm:py-12"><OnboardingWizard /></main>
  </AutoLocalizedContent>);
}
