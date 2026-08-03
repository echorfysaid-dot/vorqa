"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, FileText, PackageCheck, Search, ShieldCheck, WalletCards } from "lucide-react";
import { Badge, Button, GlassCard, ProgressBar } from "@/components/ui";
import { marketplaceRepository, rfqRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const wizardSteps = rfqRepository.listWizardSteps();
const companies = marketplaceRepository.listCompanies();

export default function NewRfqPage() {
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [selectedCompanies, setSelectedCompanies] = useState(["atlas-construction", "northbuild-engineering", "betonpro-materials"]);
  const progress = ((step + 1) / wizardSteps.length) * 100;
  const filteredCompanies = useMemo(() => companies.filter((company) => {
    const search = `${company.name} ${company.category} ${company.city} ${company.services.join(" ")}`.toLowerCase();
    return search.includes(query.toLowerCase())
      && (categoryFilter === "All categories" || company.category === categoryFilter || company.businessCategories?.includes(categoryFilter))
      && (locationFilter === "All locations" || company.city === locationFilter);
  }), [query, categoryFilter, locationFilter]);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <Link href="/rfq" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to RFQs</Link>
        <div className="flex flex-wrap gap-2"><Badge tone="gold">New RFQ</Badge><Badge tone="blue">Repository-ready wizard</Badge></div>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Create a structured construction RFQ.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Capture project scope, requirements, budget, timeline, attachments metadata, and invited Marketplace suppliers.</p>
        <div className="mt-6"><ProgressBar value={progress} label={wizardSteps[step]} /></div>
      </GlassCard>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <GlassCard className="p-4">
          <div className="grid gap-3">
            {wizardSteps.map((label, index) => (
              <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-2xl border p-3 text-start transition ${step === index ? "border-[#D4AF37]/42 bg-[#D4AF37]/12" : "border-white/10 bg-white/[0.045] hover:bg-white/[0.07]"}`}>
                <span className="text-xs font-black text-gold">Step {index + 1}</span>
                <p className="mt-1 font-black text-white">{label}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          {step === 0 && <StepShell icon={<Building2 className="h-6 w-6" />} title="Project Information" fields={["Organization: Atlas Construction Group", "Project: Luxury Villa Casablanca", "Title: Execution and supplier package", "Category: General Contractor"]} />}
          {step === 1 && <StepShell icon={<PackageCheck className="h-6 w-6" />} title="Scope and Requirements" fields={["Scope of work: structural execution, material supply, and advisory", "Technical requirements: method statement, team capacity, certificates", "Visibility: invited suppliers", "Priority: High"]} />}
          {step === 2 && <StepShell icon={<WalletCards className="h-6 w-6" />} title="Budget Range" fields={["Budget range: MAD 8M - 12M", "Currency: MAD", "Commercial terms: milestone payments", "Evaluation: technical + commercial"]} />}
          {step === 3 && <StepShell icon={<FileText className="h-6 w-6" />} title="Timeline and Attachments" fields={["Submission deadline: 28 July 2026", "Delivery date: 15 September 2026", "Attachments: Scope of Work.pdf", "Attachments: Technical Requirements.docx"]} />}
          {step === 4 && (
            <div>
              <StepTitle title="Select Suppliers" description="Select one or multiple suppliers from the Marketplace. This uses demo data now and the repository path is ready for Supabase later." />
              <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
                <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
                  <Search className="h-4 w-4 text-gold" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search suppliers" className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36" />
                </label>
                <Filter value={categoryFilter} onChange={setCategoryFilter} options={["All categories", ...Array.from(new Set(companies.flatMap((company) => [company.category, ...(company.businessCategories || [])])))]} />
                <Filter value={locationFilter} onChange={setLocationFilter} options={["All locations", ...Array.from(new Set(companies.map((company) => company.city)))]} />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {filteredCompanies.map((company) => {
                  const selected = selectedCompanies.includes(company.slug);
                  return (
                    <button key={company.slug} type="button" onClick={() => setSelectedCompanies(selected ? selectedCompanies.filter((slug) => slug !== company.slug) : [...selectedCompanies, company.slug])} className={`rounded-[1.5rem] border p-4 text-start transition hover:-translate-y-1 ${selected ? "border-[#D4AF37]/42 bg-[#D4AF37]/12" : "border-white/10 bg-white/[0.045]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <Badge tone={company.verified ? "success" : "warning"}>{company.verified ? "Verified" : "Pending"}</Badge>
                        <Badge tone="gold">{company.rating}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-black text-white">{company.name}</h3>
                      <p className="mt-1 text-sm text-ds-text/52">{company.category} · {company.city}</p>
                      <p className="mt-3 text-xs leading-5 text-ds-text/45">{company.services.slice(0, 3).join(", ")}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 5 && <StepShell icon={<CheckCircle2 className="h-6 w-6" />} title="Review & Submit" fields={["RFQ status: Draft", `Selected suppliers: ${selectedCompanies.length}`, "VORA summary: scope is ready for review", "Submission: UI only until backend RFQ table is introduced"]} />}
          <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Previous</Button>
            {step < wizardSteps.length - 1 ? (
              <Button onClick={() => setStep((value) => Math.min(wizardSteps.length - 1, value + 1))}>Continue</Button>
            ) : (
              <Link href="/rfq/RFQ-1001"><Button icon={<ShieldCheck className="h-4 w-4" />}>Open RFQ preview</Button></Link>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function StepShell({ icon, title, fields }: { icon: React.ReactNode; title: string; fields: string[] }) {
  return (<AutoLocalizedContent>
    <div>
      <StepTitle title={title} description="Review and prepare production-ready RFQ metadata." />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {fields.map((field) => <div key={field} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><div className="mb-3 text-gold">{icon}</div><p className="font-black text-white">{field}</p></div>)}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function StepTitle({ title, description }: { title: string; description: string }) {
  return (<AutoLocalizedContent><div><Badge tone="gold">{title}</Badge><h2 className="mt-3 text-2xl font-black text-white">{title}</h2><p className="mt-2 text-sm leading-7 text-ds-text/58">{description}</p></div></AutoLocalizedContent>);
}

function Filter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-black text-white outline-none transition focus:border-[#D4AF37]/44">
      {options.map((option) => <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>)}
    </select>
  </AutoLocalizedContent>);
}
