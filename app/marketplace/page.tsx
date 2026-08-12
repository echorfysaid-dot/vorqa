"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Filter,
  HardHat,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  Star,
  Store,
  Truck,
  UsersRound,
  Wrench,
  X
} from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, SkeletonCard } from "@/components/ui";
import { BlueprintOverlay } from "@/components/vorqa-official-visuals";
import { marketplaceRepository, useMarketplaceCompanies, type DemoMarketplaceCompany } from "@/lib/repositories";
import type { MarketplaceSort } from "@/lib/models";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useToast } from "@/components/app-shell";
import { marketplaceSelection } from "@/lib/marketplace-selection";
import { useI18n } from "@/components/i18n-provider";
import { localizeMarketplaceCategory } from "@/lib/locales/demo";

const marketplaceCategories = marketplaceRepository.listCategories();
const marketplaceCompanies = marketplaceRepository.listCompanies();
type MarketplaceCompany = DemoMarketplaceCompany;

const categoryIcons = {
  Contractors: HardHat,
  "Engineering Firms": Wrench,
  "Architecture Studios": Building2,
  "Material Suppliers": PackageCheck,
  "Logistics Companies": Truck,
  "Equipment Rental": Wrench,
  Consultants: UsersRound
} as const;

export default function MarketplacePage() {
  const { locale } = useI18n();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [cityFilter, setCityFilter] = useState("All cities");
  const [verificationFilter, setVerificationFilter] = useState("All verification");
  const [ratingFilter, setRatingFilter] = useState("All ratings");
  const [experienceFilter, setExperienceFilter] = useState("All experience");
  const [availabilityFilter, setAvailabilityFilter] = useState("All availability");
  const [languageFilter, setLanguageFilter] = useState("All languages");
  const [serviceFilter, setServiceFilter] = useState("All services");
  const [sortFilter, setSortFilter] = useState<MarketplaceSort>("recommended");
  const [compareSlugs, setCompareSlugsState] = useState<string[]>(() => marketplaceSelection.getCompare());
  const [shortlistSlugs, setShortlistSlugsState] = useState<string[]>(() => marketplaceSelection.getShortlist());

  const setCompareSlugs = (update: string[] | ((current: string[]) => string[])) => {
    setCompareSlugsState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      marketplaceSelection.setCompare(next);
      return next;
    });
  };

  const setShortlistSlugs = (update: string[] | ((current: string[]) => string[])) => {
    setShortlistSlugsState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      marketplaceSelection.setShortlist(next);
      return next;
    });
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("vorqa-marketplace-filters") || "null") as Record<string, string> | null;
      if (!saved) return;
      setQuery(saved.query || "");
      setCategoryFilter(saved.categoryFilter || "All categories");
      setCountryFilter(saved.countryFilter || "All countries");
      setCityFilter(saved.cityFilter || "All cities");
      setVerificationFilter(saved.verificationFilter || "All verification");
      setRatingFilter(saved.ratingFilter || "All ratings");
      setExperienceFilter(saved.experienceFilter || "All experience");
      setAvailabilityFilter(saved.availabilityFilter || "All availability");
      setLanguageFilter(saved.languageFilter || "All languages");
      setServiceFilter(saved.serviceFilter || "All services");
      setSortFilter((saved.sortFilter as MarketplaceSort) || "recommended");
    } catch {
      window.localStorage.removeItem("vorqa-marketplace-filters");
    }
  }, []);

  const marketplaceState = useMarketplaceCompanies({
    query,
    category: categoryFilter,
    country: countryFilter,
    city: cityFilter,
    verified: verificationFilter === "All verification" ? undefined : verificationFilter === "Verified",
    rating: ratingFilter === "All ratings" ? undefined : Number(ratingFilter.replace("+ stars", "")),
    experience: experienceFilter,
    availability: availabilityFilter,
    languages: languageFilter === "All languages" ? undefined : [languageFilter],
    services: serviceFilter === "All services" ? undefined : [serviceFilter],
    sort: sortFilter
  });
  const filteredCompanies = marketplaceState.data;

  const verifiedCount = marketplaceCompanies.filter((company) => company.verified).length;
  const activeProjects = marketplaceCompanies.reduce((sum, company) => sum + company.activeProjects, 0);
  const languages = Array.from(new Set(marketplaceCompanies.flatMap((company) => company.languages)));
  const services = Array.from(new Set(marketplaceCompanies.flatMap((company) => company.services)));
  const sourceLabel = marketplaceState.source === "supabase" ? "Supabase mode" : marketplaceState.isFallback ? "Demo fallback" : "Demo mode";

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden p-5 sm:p-6 xl:p-7">
        <BlueprintOverlay className="opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(215,180,90,.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(79,140,255,.15),transparent_32%)]" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">Vorqa Marketplace</Badge>
              <Badge tone="blue">B2B construction network</Badge>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Find verified construction partners for every project stage.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-ds-text/62">
              Discover contractors, engineering firms, architects, suppliers, logistics teams, equipment providers, and consultants inside a premium B2B construction marketplace.
            </p>

            <label className="mt-6 flex min-h-14 items-center gap-3 rounded-[1.25rem] border border-[#D4AF37]/24 bg-black/28 px-4 shadow-inner shadow-black/30 transition focus-within:border-[#D4AF37]/52">
              <Search className="h-5 w-5 text-gold" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search companies, categories, cities or services"
                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36"
              />
            </label>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {marketplaceCategories.slice(0, 5).map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setCategoryFilter(category.name)}
                  className="min-h-11 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-center text-sm font-black text-ds-text/64 transition hover:-translate-y-0.5 hover:border-[#D4AF37]/32 hover:text-white"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-ds-md backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge tone="success">Featured network</Badge>
                <h2 className="mt-3 text-2xl font-black text-white">Verified partners</h2>
              </div>
              <Store className="h-8 w-8 text-gold" />
            </div>
            <div className="mt-5 grid gap-3">
              {marketplaceCompanies.slice(0, 3).map((company) => (
                <div key={company.name} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/18 p-3">
                  <CompanyLogo logo={company.logo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-white">{company.name}</p>
                    <p className="text-xs text-ds-text/48">{company.category} · {company.city}</p>
                  </div>
                  <Badge tone={company.verified ? "success" : "warning"}>{company.verified ? "Verified" : "Pending"}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MarketplaceKpi label="Companies" value={String(marketplaceCompanies.length)} icon={<Building2 className="h-5 w-5" />} />
        <MarketplaceKpi label="Active projects" value={String(activeProjects)} icon={<HardHat className="h-5 w-5" />} />
        <MarketplaceKpi label="Verified businesses" value={String(verifiedCount)} icon={<ShieldCheck className="h-5 w-5" />} />
        <MarketplaceKpi label="RFQs" value="28" icon={<PackageCheck className="h-5 w-5" />} />
        <MarketplaceKpi label="Partnerships" value="16" icon={<UsersRound className="h-5 w-5" />} />
      </div>

      <GlassCard className="p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="blue">Categories</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">Browse by marketplace category</h2>
          </div>
          <Badge tone={marketplaceState.source === "supabase" ? "success" : marketplaceState.isFallback ? "warning" : "neutral"}>{sourceLabel}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {marketplaceCategories.map((category) => {
            const Icon = categoryIcons[category.name as keyof typeof categoryIcons] || Building2;
            const localizedCategory = localizeMarketplaceCategory(category.name, category.description, locale);
            return (
              <button
                key={category.name}
                type="button"
                onClick={() => setCategoryFilter(category.name)}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 text-start shadow-ds-sm transition hover:-translate-y-1 hover:border-[#D4AF37]/32 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D4AF37]/12 text-gold shadow-gold-glow">
                    <Icon className="h-6 w-6 transition group-hover:-rotate-6" />
                  </span>
                  <Badge tone="gold">{category.count} companies</Badge>
                </div>
                <h3 className="mt-4 text-lg font-black text-white">{localizedCategory.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ds-text/56">{localizedCategory.description}</p>
              </button>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_160px_160px_190px_160px]">
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
            <Search className="h-4 w-4 text-gold" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search marketplace"
              className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36"
            />
          </label>
          <MarketplaceFilter value={categoryFilter} onChange={setCategoryFilter} options={["All categories", ...marketplaceCategories.map((category) => category.name)]} />
          <MarketplaceFilter value={countryFilter} onChange={setCountryFilter} options={["All countries", ...Array.from(new Set(marketplaceCompanies.map((company) => company.country)))]} />
          <MarketplaceFilter value={cityFilter} onChange={setCityFilter} options={["All cities", ...Array.from(new Set(marketplaceCompanies.map((company) => company.city)))]} />
          <MarketplaceFilter value={verificationFilter} onChange={setVerificationFilter} options={["All verification", "Verified", "Pending verification"]} />
          <MarketplaceFilter value={ratingFilter} onChange={setRatingFilter} options={["All ratings", "4+ stars", "4.5+ stars", "4.8+ stars"]} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MarketplaceFilter value={experienceFilter} onChange={setExperienceFilter} options={["All experience", "5+ years", "10+ years", "15+ years"]} />
          <MarketplaceFilter value={availabilityFilter} onChange={setAvailabilityFilter} options={["All availability", "Available", "Limited slots", "By request"]} />
          <MarketplaceFilter value={languageFilter} onChange={setLanguageFilter} options={["All languages", ...languages]} />
          <MarketplaceFilter value={serviceFilter} onChange={setServiceFilter} options={["All services", ...services]} />
          <MarketplaceFilter value={sortFilter} onChange={(value) => setSortFilter(value as MarketplaceSort)} options={["recommended", "rating", "experience", "completed-projects", "response-time", "newest"]} />
        </div>
        {marketplaceState.error && marketplaceState.isFallback && (
          <p className="mt-3 text-sm font-bold text-warning">Production marketplace data is unavailable, so Vorqa is showing the demo marketplace fallback.</p>
        )}
      </GlassCard>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="gold">Featured Companies</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">Verified construction partners</h2>
          </div>
          <Button variant="secondary" icon={<Filter className="h-4 w-4" />} onClick={() => {
            window.localStorage.setItem("vorqa-marketplace-filters", JSON.stringify({ query, categoryFilter, countryFilter, cityFilter, verificationFilter, ratingFilter, experienceFilter, availabilityFilter, languageFilter, serviceFilter, sortFilter }));
            pushToast("Marketplace filters saved", "Your current marketplace search can now be restored on this device.");
          }}>Save filters</Button>
        </div>

        {marketplaceState.loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredCompanies.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.name}
                company={company}
                inCompare={compareSlugs.includes(company.slug)}
                inShortlist={shortlistSlugs.includes(company.slug)}
                compareDisabled={!compareSlugs.includes(company.slug) && compareSlugs.length >= 4}
                onToggleCompare={() => setCompareSlugs((current) => current.includes(company.slug) ? current.filter((slug) => slug !== company.slug) : current.length >= 4 ? current : [...current, company.slug])}
                onToggleShortlist={() => setShortlistSlugs((current) => current.includes(company.slug) ? current.filter((slug) => slug !== company.slug) : [...current, company.slug])}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No marketplace companies found"
            description="Adjust the search, category, verification, city, or rating filters to discover more B2B partners."
            action={<Button variant="secondary" onClick={() => { setQuery(""); setCategoryFilter("All categories"); setCountryFilter("All countries"); setCityFilter("All cities"); setVerificationFilter("All verification"); setRatingFilter("All ratings"); }}>Reset filters</Button>}
          />
        )}
      </section>

      <GlassCard className="p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="blue">State readiness</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">Marketplace loading and empty states</h2>
          </div>
          <Badge tone="neutral">UI only</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <StateCard title="Loading state" text="Skeleton marketplace cards are ready for future live supplier data." />
          <StateCard title="Empty state" text="Helpful recovery actions appear when filters return no marketplace results." />
          <StateCard title="Verification state" text="Pending and verified businesses are visually separated for future procurement trust flows." />
        </div>
      </GlassCard>

      <CompareTray selectedSlugs={compareSlugs} onRemove={(slug) => setCompareSlugs((current) => current.filter((item) => item !== slug))} onClear={() => setCompareSlugs([])} />
    </div>
  </AutoLocalizedContent>);
}

function CompanyCard({
  company,
  inCompare,
  inShortlist,
  compareDisabled,
  onToggleCompare,
  onToggleShortlist
}: {
  company: MarketplaceCompany;
  inCompare: boolean;
  inShortlist: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
  onToggleShortlist: () => void;
}) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <CompanyLogo logo={company.logo} />
        <Badge tone={company.verified ? "success" : "warning"}>{company.status}</Badge>
      </div>
      <h3 className="mt-5 text-2xl font-black text-white">{company.name}</h3>
      <p className="mt-2 text-sm leading-7 text-ds-text/58">{company.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="blue">{company.category}</Badge>
        <Badge tone="neutral">{company.city}, {company.country}</Badge>
        <Badge tone="gold"><Star className="h-3 w-3 fill-current" /> {company.rating}</Badge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniMetric icon={<HardHat className="h-4 w-4" />} label="Active projects" value={String(company.activeProjects)} />
        <MiniMetric icon={<MapPin className="h-4 w-4" />} label="Location" value={company.city} />
      </div>
      <div className="mt-5">
        <ProgressBar value={company.rating * 20} label="Marketplace trust score" tone={company.verified ? "gold" : "warning"} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant={inCompare ? "primary" : "secondary"} disabled={compareDisabled} onClick={onToggleCompare}>{inCompare ? "Remove compare" : "Add compare"}</Button>
        <Button variant={inShortlist ? "primary" : "secondary"} onClick={onToggleShortlist}>{inShortlist ? "Saved" : "Shortlist"}</Button>
      </div>
      <Link href={`/marketplace/${company.slug}`} className="mt-5 block">
        <Button className="w-full" variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>View company profile</Button>
      </Link>
    </GlassCard>
  </AutoLocalizedContent>);
}

function CompareTray({ selectedSlugs, onRemove, onClear }: { selectedSlugs: string[]; onRemove: (slug: string) => void; onClear: () => void }) {
  if (!selectedSlugs.length) return null;
  const companies = marketplaceCompanies.filter((company) => selectedSlugs.includes(company.slug));
  const maxed = selectedSlugs.length >= 4;

  return (<AutoLocalizedContent>
    <div className="fixed inset-x-3 bottom-4 z-[80] mx-auto max-w-5xl rounded-[1.75rem] border border-[#D4AF37]/24 bg-[#0B1120]/94 p-3 shadow-ds-lg backdrop-blur-2xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone="gold">Compare tray</Badge>
            {maxed && <Badge tone="warning">Maximum 4 selected</Badge>}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {companies.map((company) => (
              <div key={company.slug} className="flex min-w-52 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-2">
                <CompanyLogo logo={company.logo} />
                <span className="min-w-0 flex-1 truncate text-sm font-black text-white">{company.name}</span>
                <button type="button" onClick={() => onRemove(company.slug)} aria-label={`Remove ${company.name}`} className="grid h-8 w-8 place-items-center rounded-xl text-ds-text/50 transition hover:bg-white/10 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onClear}>Clear all</Button>
          <Link href="/marketplace/compare"><Button>Compare now</Button></Link>
          <Link href="/marketplace/shortlist"><Button variant="secondary">View shortlist</Button></Link>
        </div>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function CompanyLogo({ logo }: { logo: string }) {
  return (<AutoLocalizedContent>
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/28 bg-[#D4AF37]/12 text-sm font-black text-gold shadow-gold-glow">
      {logo}
    </span>
  </AutoLocalizedContent>);
}

function MarketplaceKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </GlassCard>
  </AutoLocalizedContent>);
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div>
      <p className="mt-2 truncate font-black text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

function MarketplaceFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-black text-white outline-none transition focus:border-[#D4AF37]/44">
      {options.map((option) => <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>)}
    </select>
  </AutoLocalizedContent>);
}

function StateCard({ title, text }: { title: string; text: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
      <Badge tone="neutral">{title}</Badge>
      <p className="mt-3 text-sm leading-7 text-ds-text/56">{text}</p>
    </div>
  </AutoLocalizedContent>);
}
