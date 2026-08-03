"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, Plus, Star, Trash2, WandSparkles } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import { marketplaceRepository, type DemoMarketplaceCompany } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const marketplaceCompanies = marketplaceRepository.listCompanies();
type MarketplaceCompany = DemoMarketplaceCompany;

const initialCompare = ["atlas-construction", "northbuild-engineering", "urbanform-architects", "betonpro-materials"];

const comparisonRows = [
  { label: "Category", value: (company: MarketplaceCompany) => company.category },
  { label: "Location", value: (company: MarketplaceCompany) => `${company.city}, ${company.country}` },
  { label: "Verification", value: (company: MarketplaceCompany) => company.verified ? "Verified" : "Pending" },
  { label: "Years in business", value: (company: MarketplaceCompany) => `${company.yearsInBusiness} years`, best: (companies: MarketplaceCompany[], company: MarketplaceCompany) => company.yearsInBusiness === Math.max(...companies.map((item) => item.yearsInBusiness)) },
  { label: "Rating", value: (company: MarketplaceCompany) => company.rating.toFixed(1), best: (companies: MarketplaceCompany[], company: MarketplaceCompany) => company.rating === Math.max(...companies.map((item) => item.rating)) },
  { label: "Completed projects", value: (company: MarketplaceCompany) => String(company.completedProjects), best: (companies: MarketplaceCompany[], company: MarketplaceCompany) => company.completedProjects === Math.max(...companies.map((item) => item.completedProjects)) },
  { label: "Active projects", value: (company: MarketplaceCompany) => String(company.activeProjects) },
  { label: "Employees", value: (company: MarketplaceCompany) => String(company.employees), best: (companies: MarketplaceCompany[], company: MarketplaceCompany) => company.employees === Math.max(...companies.map((item) => item.employees)) },
  { label: "Response rate", value: (company: MarketplaceCompany) => company.responseRate },
  { label: "Response time", value: (company: MarketplaceCompany) => company.responseTime },
  { label: "Service areas", value: (company: MarketplaceCompany) => company.serviceAreas.join(", ") },
  { label: "Certifications", value: (company: MarketplaceCompany) => company.certifications.join(", ") },
  { label: "Main services", value: (company: MarketplaceCompany) => company.services.join(", ") },
  { label: "Delivery reliability", value: (company: MarketplaceCompany) => company.insights.reliability },
  { label: "Capacity", value: (company: MarketplaceCompany) => company.insights.capacity },
  { label: "Risk level", value: (company: MarketplaceCompany) => company.insights.risks.length > 1 ? "Moderate" : "Low" },
  { label: "VORA fit score", value: (company: MarketplaceCompany) => `${company.insights.fit}%`, best: (companies: MarketplaceCompany[], company: MarketplaceCompany) => company.insights.fit === Math.max(...companies.map((item) => item.insights.fit)) }
];

export default function MarketplaceComparePage() {
  const [selectedSlugs, setSelectedSlugs] = useState(initialCompare);
  const selectedCompanies = useMemo(() => marketplaceCompanies.filter((company) => selectedSlugs.includes(company.slug)), [selectedSlugs]);
  const recommended = selectedCompanies.reduce<MarketplaceCompany | null>((best, company) => !best || company.insights.fit > best.insights.fit ? company : best, null);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/marketplace" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to marketplace</Link>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">Company comparison</Badge><Badge tone="blue">Demo UI state</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Compare construction partners side by side.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Review category, verification, capability, response, delivery risk, and VORA fit score before building your shortlist.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace/shortlist"><Button variant="secondary">View shortlist</Button></Link>
            <Button variant="secondary" onClick={() => setSelectedSlugs(initialCompare)}>Reset demo</Button>
          </div>
        </div>
      </GlassCard>

      {selectedCompanies.length ? (
        <>
          <GlassCard className="p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {selectedCompanies.map((company) => (
                  <CompanyHeaderCard key={company.slug} company={company} recommended={recommended?.slug === company.slug} onRemove={() => setSelectedSlugs((current) => current.filter((slug) => slug !== company.slug))} />
                ))}
                {selectedCompanies.length < 4 && (
                  <Link href="/marketplace" className="grid min-h-48 place-items-center rounded-[1.5rem] border border-dashed border-white/16 bg-white/[0.035] p-5 text-center transition hover:border-[#D4AF37]/38">
                    <div><Plus className="mx-auto h-8 w-8 text-gold" /><p className="mt-3 font-black text-white">Add another company</p></div>
                  </Link>
                )}
              </div>
              <VoraComparisonInsights recommended={recommended} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div><Badge tone="blue">Comparison matrix</Badge><h2 className="mt-3 text-2xl font-black text-white">Highlighted differences</h2></div>
              <Badge tone="gold">{selectedCompanies.length}/4 selected</Badge>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[920px] rounded-[1.5rem] border border-white/10 bg-black/16">
                <div className="grid border-b border-white/10" style={{ gridTemplateColumns: `220px repeat(${selectedCompanies.length}, minmax(190px,1fr))` }}>
                  <div className="p-4 text-xs font-black uppercase tracking-[0.12em] text-ds-text/42">Criteria</div>
                  {selectedCompanies.map((company) => <div key={company.slug} className="p-4 font-black text-white">{company.name}</div>)}
                </div>
                {comparisonRows.map((row) => (
                  <div key={row.label} className="grid border-b border-white/10 last:border-b-0" style={{ gridTemplateColumns: `220px repeat(${selectedCompanies.length}, minmax(190px,1fr))` }}>
                    <div className="p-4 text-sm font-black text-gold">{row.label}</div>
                    {selectedCompanies.map((company) => {
                      const best = row.best?.(selectedCompanies, company);
                      return <div key={company.slug} className={`p-4 text-sm leading-6 ${best ? "bg-[#D4AF37]/10 text-white" : "text-ds-text/60"}`}>{row.value(company)} {best && <Badge tone="gold" className="ms-2">Best</Badge>}</div>;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </>
      ) : (
        <EmptyState title="No companies selected for comparison" description="Add up to four companies from the marketplace to compare capabilities, risks, and VORA fit scores." action={<Link href="/marketplace"><Button>Browse marketplace</Button></Link>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function CompanyHeaderCard({ company, recommended, onRemove }: { company: MarketplaceCompany; recommended?: boolean; onRemove: () => void }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/12 font-black text-gold">{company.logo}</span>
        <button type="button" onClick={onRemove} aria-label={`Remove ${company.name}`} className="grid h-9 w-9 place-items-center rounded-xl text-ds-text/48 transition hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4" /></button>
      </div>
      {recommended && <Badge tone="success" className="mt-4">Recommended</Badge>}
      <h3 className="mt-3 text-lg font-black text-white">{company.name}</h3>
      <p className="mt-1 text-sm text-ds-text/50">{company.category} · {company.city}</p>
      <div className="mt-4"><ProgressBar value={company.insights.fit} label="VORA fit" /></div>
    </div>
  </AutoLocalizedContent>);
}

function VoraComparisonInsights({ recommended }: { recommended: MarketplaceCompany | null }) {
  const insights = [
    ["Best overall match", recommended?.name || "Add companies"],
    ["Best price-capacity balance", "BetonPro Materials for high-volume supply packages"],
    ["Lowest delivery risk", "NorthBuild Engineering for technical validation"],
    ["Strongest technical expertise", "GeoConsult Africa for geotechnical advisory"],
    ["Recommended shortlist", "Atlas, NorthBuild, BetonPro"],
    ["Comparison explanation", "VORA favors verified companies with strong response rate, relevant services, and clear capacity."]
  ];
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
      <div className="flex items-start gap-3"><WandSparkles className="h-6 w-6 text-gold" /><div><Badge tone="blue">VORA Insights</Badge><h3 className="mt-3 text-xl font-black text-white">Comparison guidance</h3></div></div>
      <div className="mt-5 grid gap-3">
        {insights.map(([title, text]) => <div key={title} className="rounded-2xl bg-black/18 p-3"><p className="font-black text-white">{title}</p><p className="mt-1 text-sm leading-6 text-ds-text/56">{text}</p></div>)}
      </div>
    </div>
  </AutoLocalizedContent>);
}
