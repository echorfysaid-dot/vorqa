"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, FileText, Heart, MapPin, MessageSquare, Search, Star, Trash2 } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import { marketplaceRepository, type DemoMarketplaceCompany } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const marketplaceCompanies = marketplaceRepository.listCompanies();
type MarketplaceCompany = DemoMarketplaceCompany;

const initialShortlist = [
  { slug: "atlas-construction", priority: "High", project: "Luxury Villa Casablanca", notes: "Best overall delivery partner for turnkey execution." },
  { slug: "northbuild-engineering", priority: "High", project: "Residential Complex Rabat", notes: "Strong technical review and engineering controls." },
  { slug: "betonpro-materials", priority: "Medium", project: "Luxury Villa Casablanca", notes: "Reliable concrete supply and documentation." },
  { slug: "geoconsult-africa", priority: "Medium", project: "Office Tower Marrakech", notes: "Useful before foundation assumptions are finalized." }
];

export default function MarketplaceShortlistPage() {
  const [items, setItems] = useState(initialShortlist);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [projectFilter, setProjectFilter] = useState("All projects");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [locationFilter, setLocationFilter] = useState("All locations");
  const [verificationFilter, setVerificationFilter] = useState("All verification");
  const [ratingFilter, setRatingFilter] = useState("All ratings");

  const shortlistCompanies = items.map((item) => ({ item, company: marketplaceCompanies.find((company) => company.slug === item.slug)! })).filter(({ company }) => company);
  const filtered = useMemo(() => {
    return shortlistCompanies.filter(({ item, company }) => {
      const searchText = `${company.name} ${company.category} ${company.city} ${item.notes} ${item.project}`.toLowerCase();
      return searchText.includes(query.toLowerCase())
        && (categoryFilter === "All categories" || company.category === categoryFilter)
        && (projectFilter === "All projects" || item.project === projectFilter)
        && (priorityFilter === "All priorities" || item.priority === priorityFilter)
        && (locationFilter === "All locations" || company.city === locationFilter)
        && (verificationFilter === "All verification" || (verificationFilter === "Verified" ? company.verified : !company.verified))
        && (ratingFilter === "All ratings" || company.rating >= Number(ratingFilter.replace("+ stars", "")));
    });
  }, [shortlistCompanies, query, categoryFilter, projectFilter, priorityFilter, locationFilter, verificationFilter, ratingFilter]);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/marketplace" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white"><ArrowLeft className="h-4 w-4" />Back to marketplace</Link>
            <div className="flex flex-wrap gap-2"><Badge tone="gold">Shortlist</Badge><Badge tone="blue">UI state only</Badge></div>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Saved marketplace partners for procurement review.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">Track priority, intended project, notes, rating, location, and quick actions before RFQ workflows are connected.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace/compare"><Button variant="secondary">Compare companies</Button></Link>
            <Button variant="secondary" onClick={() => setItems(initialShortlist)}>Reset demo</Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_190px_170px_170px_190px_160px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
            <Search className="h-4 w-4 text-gold" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shortlist" className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36" />
          </label>
          <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={["All categories", ...Array.from(new Set(marketplaceCompanies.map((company) => company.category)))]} />
          <FilterSelect value={projectFilter} onChange={setProjectFilter} options={["All projects", ...Array.from(new Set(initialShortlist.map((item) => item.project)))]} />
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} options={["All priorities", "High", "Medium", "Low"]} />
          <FilterSelect value={locationFilter} onChange={setLocationFilter} options={["All locations", ...Array.from(new Set(marketplaceCompanies.map((company) => company.city)))]} />
          <FilterSelect value={verificationFilter} onChange={setVerificationFilter} options={["All verification", "Verified", "Pending verification"]} />
          <FilterSelect value={ratingFilter} onChange={setRatingFilter} options={["All ratings", "4+ stars", "4.5+ stars", "4.8+ stars"]} />
        </div>
      </GlassCard>

      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ item, company }) => <ShortlistCard key={company.slug} item={item} company={company} onRemove={() => setItems((current) => current.filter((entry) => entry.slug !== company.slug))} />)}
        </div>
      ) : (
        <EmptyState title="No shortlisted companies found" description="Adjust filters or browse the marketplace to add partners to your procurement shortlist." action={<Link href="/marketplace"><Button>Browse marketplace</Button></Link>} />
      )}
    </div>
  </AutoLocalizedContent>);
}

function ShortlistCard({ item, company, onRemove }: { item: (typeof initialShortlist)[number]; company: MarketplaceCompany; onRemove: () => void }) {
  const priorityTone = item.priority === "High" ? "danger" : item.priority === "Medium" ? "warning" : "neutral";
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#D4AF37]/12 font-black text-gold shadow-gold-glow">{company.logo}</span>
        <div className="flex gap-2">
          <Badge tone={priorityTone}>{item.priority}</Badge>
          <button type="button" onClick={onRemove} aria-label={`Remove ${company.name}`} className="grid h-8 w-8 place-items-center rounded-xl text-ds-text/50 transition hover:bg-white/10 hover:text-white"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <h2 className="mt-5 text-2xl font-black text-white">{company.name}</h2>
      <p className="mt-2 text-sm text-ds-text/52">{company.category} · {company.city}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={company.verified ? "success" : "warning"}>{company.verified ? "Verified" : "Pending"}</Badge>
        <Badge tone="gold"><Star className="h-3 w-3 fill-current" /> {company.rating}</Badge>
        <Badge tone="blue">{item.project}</Badge>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/18 p-3">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/38">Notes preview</p>
        <p className="mt-2 text-sm leading-6 text-ds-text/60">{item.notes}</p>
      </div>
      <div className="mt-4"><ProgressBar value={company.insights.fit} label="VORA fit score" /></div>
      <div className="mt-5 grid gap-2">
        <Button icon={<MessageSquare className="h-4 w-4" />}>Contact</Button>
        <Button variant="secondary" icon={<FileText className="h-4 w-4" />}>Request quotation</Button>
        <Link href={`/marketplace/${company.slug}`}><Button className="w-full" variant="secondary" icon={<MapPin className="h-4 w-4" />}>Open profile</Button></Link>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-black text-white outline-none transition focus:border-[#D4AF37]/44">
      {options.map((option) => <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>)}
    </select>
  </AutoLocalizedContent>);
}
