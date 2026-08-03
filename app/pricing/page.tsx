"use client";

import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { GlassCard, PageHeader } from "@/components/ui";
import { pricingPlans } from "@/lib/tools";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function PricingPage() {
  const { dictionary: t } = useI18n();
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <PageHeader eyebrow="VORA Membership" title={t.pages.pricingTitle} description={t.pages.pricingDescription} />
      <div className="grid gap-5 lg:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <GlassCard key={plan.name} className={`p-6 ${index === 1 ? "ring-2 ring-[#f1cf72]/70" : ""}`} delay={index * 0.05}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#f8efd7]">{plan.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#f8efd7]/52">{plan.description}</p>
              </div>
              {index === 1 && <Crown className="h-6 w-6 text-[#f1cf72]" />}
            </div>
            <p className="mt-7 text-4xl font-black text-[#f1cf72]">{plan.price}</p>
            <div className="mt-6 grid gap-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm font-bold text-[#f8efd7]/78">
                  <Check className="h-5 w-5 text-[#f1cf72]" />
                  {feature}
                </div>
              ))}
            </div>
            <Link href="/dashboard" className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-l from-[#f1cf72] to-[#8d641d] px-5 py-3 font-black text-black">
              {t.common.getStarted}
            </Link>
          </GlassCard>
        ))}
      </div>
    </div>
  </AutoLocalizedContent>);
}
