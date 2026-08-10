"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, FileText, PackageCheck, WalletCards } from "lucide-react";
import { Badge, Button, GlassCard, ProgressBar } from "@/components/ui";
import { marketplaceRepository, rfqRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const marketplaceCompanies = marketplaceRepository.listCompanies();
const rfqWizardSteps = rfqRepository.listWizardSteps();

export default function NewRfqPage() {
  const [step, setStep] = useState(0);
  const [selectedCompanies, setSelectedCompanies] = useState(["atlas-construction", "northbuild-engineering", "betonpro-materials"]);
  const progress = ((step + 1) / rfqWizardSteps.length) * 100;

  useEffect(() => {
    const company = new URLSearchParams(window.location.search).get("company");
    if (company && marketplaceCompanies.some((item) => item.slug === company)) setSelectedCompanies([company]);
  }, []);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <Link href="/marketplace/rfq" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to RFQs</Link>
        <div className="flex flex-wrap gap-2"><Badge tone="gold">New RFQ Wizard</Badge><Badge tone="blue">UI only</Badge></div>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Create a request for quotation.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Build a structured marketplace RFQ in six guided steps. Submission is a placeholder until backend procurement workflows are connected.</p>
        <div className="mt-6"><ProgressBar value={progress} label={rfqWizardSteps[step]} /></div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <GlassCard className="p-4">
          <div className="grid gap-3">
            {rfqWizardSteps.map((label, index) => (
              <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-2xl border p-3 text-start transition ${step === index ? "border-[#D4AF37]/42 bg-[#D4AF37]/12" : "border-white/10 bg-white/[0.045] hover:bg-white/[0.07]"}`}>
                <span className="text-xs font-black text-gold">Step {index + 1}</span>
                <p className="mt-1 font-black text-white">{label}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <WizardStep step={step} selectedCompanies={selectedCompanies} setSelectedCompanies={setSelectedCompanies} />
          <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Previous</Button>
            {step < rfqWizardSteps.length - 1 ? (
              <Button onClick={() => setStep((value) => Math.min(rfqWizardSteps.length - 1, value + 1))}>Continue</Button>
            ) : (
              <Link href="/marketplace/rfq/RFQ-1001"><Button icon={<CheckCircle2 className="h-4 w-4" />}>Submit preview</Button></Link>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function WizardStep({ step, selectedCompanies, setSelectedCompanies }: { step: number; selectedCompanies: string[]; setSelectedCompanies: (value: string[]) => void }) {
  if (step === 0) return (<AutoLocalizedContent><StepShell icon={<Building2 className="h-6 w-6" />} title="Project Information" fields={["Project: Luxury Villa Casablanca", "Location: Casablanca", "RFQ title: Execution and supplier package", "Description: Structural execution, material supply, and technical advisory."]} /></AutoLocalizedContent>);
  if (step === 1) return (<AutoLocalizedContent><StepShell icon={<PackageCheck className="h-6 w-6" />} title="Requested Services" fields={["General contracting", "Engineering validation", "Ready-mix concrete supply", "Geotechnical advisory"]} /></AutoLocalizedContent>);
  if (step === 2) return (<AutoLocalizedContent><StepShell icon={<WalletCards className="h-6 w-6" />} title="Budget Range" fields={["Target budget: MAD 8M - 12M", "Commercial structure: Fixed price with variation controls", "Payment terms: Milestone based", "Currency: MAD"]} /></AutoLocalizedContent>);
  if (step === 3) return (<AutoLocalizedContent><StepShell icon={<FileText className="h-6 w-6" />} title="Timeline" fields={["RFQ due date: 28 July 2026", "Expected award: 05 August 2026", "Mobilization: 2 weeks", "Execution window: 6 months"]} /></AutoLocalizedContent>);
  if (step === 4) {
    return (<AutoLocalizedContent>
      <div>
        <StepTitle title="Select Companies" description="Choose marketplace companies to invite into this RFQ preview." />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {marketplaceCompanies.slice(0, 7).map((company) => {
            const selected = selectedCompanies.includes(company.slug);
            return (
              <button key={company.slug} type="button" onClick={() => setSelectedCompanies(selected ? selectedCompanies.filter((slug) => slug !== company.slug) : [...selectedCompanies, company.slug])} className={`rounded-[1.5rem] border p-4 text-start transition hover:-translate-y-1 ${selected ? "border-[#D4AF37]/42 bg-[#D4AF37]/12" : "border-white/10 bg-white/[0.045]"}`}>
                <Badge tone={company.verified ? "success" : "warning"}>{company.verified ? "Verified" : "Pending"}</Badge>
                <h3 className="mt-3 text-lg font-black text-white">{company.name}</h3>
                <p className="mt-1 text-sm text-ds-text/52">{company.category} · {company.city}</p>
              </button>
            );
          })}
        </div>
      </div>
    </AutoLocalizedContent>);
  }
  return (<AutoLocalizedContent><StepShell icon={<CheckCircle2 className="h-6 w-6" />} title="Review & Submit" fields={["RFQ: RFQ-1001 preview", "Selected companies: " + selectedCompanies.length, "Attachments: Placeholder", "Submission: UI only, no persistence"]} /></AutoLocalizedContent>);
}

function StepShell({ icon, title, fields }: { icon: React.ReactNode; title: string; fields: string[] }) {
  return (<AutoLocalizedContent>
    <div>
      <StepTitle title={title} description="Review the prepared demo information for this RFQ step." />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {fields.map((field) => <div key={field} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="mb-3 text-gold">{icon}</div><p className="font-black text-white">{field}</p></div>)}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function StepTitle({ title, description }: { title: string; description: string }) {
  return (<AutoLocalizedContent><div><Badge tone="gold">{title}</Badge><h2 className="mt-3 text-2xl font-black text-white">{title}</h2><p className="mt-2 text-sm leading-7 text-ds-text/58">{description}</p></div></AutoLocalizedContent>);
}
