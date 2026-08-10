"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  UsersRound,
  WandSparkles
} from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar } from "@/components/ui";
import { BlueprintOverlay, VoraVisual } from "@/components/vorqa-official-visuals";
import { marketplaceRepository, type DemoMarketplaceCompany } from "@/lib/repositories";
import { MarketplaceProfileActions } from "@/components/marketplace-profile-actions";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

type MarketplaceCompany = DemoMarketplaceCompany;
export default function MarketplaceCompanyProfilePage({ params }: { params: { slug: string } }) {
  const demoCompany = marketplaceRepository.getCompanyBySlug(params.slug);
  const [company, setCompany] = useState<MarketplaceCompany | undefined>(demoCompany);
  const [loading, setLoading] = useState(!demoCompany);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    marketplaceRepository.getCompany(params.slug).then((result) => {
      if (!active) return;
      setCompany(result.data);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.slug]);

  if (loading) {
    return <GlassCard className="p-8"><p className="text-sm font-bold text-ds-text/60">Loading company profile...</p></GlassCard>;
  }
  if (!company) {
    return <EmptyState title="Company profile unavailable" description={error ? "Marketplace data could not be loaded. Please try again." : "This company is not available in the current marketplace."} action={<Link href="/marketplace"><Button>Back to marketplace</Button></Link>} />;
  }

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <CompanyHeader company={company} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="space-y-6">
          <CompanyOverview company={company} />
          <CompanyKpis company={company} />
          <ServicesSection company={company} />
          <PortfolioSection company={company} />
          <TeamSection company={company} />
          <ReviewsSection company={company} />
          <DocumentsSection company={company} />
        </main>

        <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <ContactPanel company={company} />
          <VoraInsights company={company} />
        </aside>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function CompanyHeader({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="relative overflow-hidden p-5 sm:p-6 xl:p-7">
      <BlueprintOverlay className="opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(215,180,90,.18),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(79,140,255,.14),transparent_32%)]" />
      <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <Link href="/marketplace" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-gold transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CompanyLogo logo={company.logo} large />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={company.verified ? "success" : "warning"}>{company.verified ? "Verified business" : "Verification pending"}</Badge>
                <Badge tone="blue">{company.category}</Badge>
                <Badge tone="gold"><Star className="h-3 w-3 fill-current" /> {company.rating}</Badge>
              </div>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">{company.name}</h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-ds-text/62">{company.description}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-ds-text/54">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" />{company.city}, {company.country}</span>
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" />{company.yearsInBusiness} years in business</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-gold" />{company.responseTime}</span>
              </div>
            </div>
          </div>
        </div>
        <MarketplaceProfileActions company={company} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function CompanyOverview({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Badge tone="gold">Company Overview</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">About and capabilities</h2>
        </div>
        <ShieldCheck className="h-6 w-6 text-gold" />
      </div>
      <p className="text-sm leading-8 text-ds-text/62">{company.about}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <InfoList title="Main services" items={company.services} />
        <InfoList title="Industries served" items={company.industries} />
        <InfoList title="Service areas" items={company.serviceAreas} />
        <InfoList title="Languages" items={company.languages} />
        <InfoList title="Certifications" items={company.certifications} />
        <InfoList title="Legal / verification" items={[company.legalStatus]} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function CompanyKpis({ company }: { company: MarketplaceCompany }) {
  const kpis = [
    { label: "Completed projects", value: String(company.completedProjects), icon: BriefcaseBusiness },
    { label: "Active projects", value: String(company.activeProjects), icon: Building2 },
    { label: "Employees", value: String(company.employees), icon: UsersRound },
    { label: "Partners", value: String(company.partners), icon: ShieldCheck },
    { label: "Average rating", value: String(company.rating), icon: Star },
    { label: "Response rate", value: company.responseRate, icon: Clock3 }
  ];

  return (<AutoLocalizedContent>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <GlassCard key={kpi.label} className="p-4">
            <div className="flex items-center gap-2 text-gold"><Icon className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{kpi.label}</span></div>
            <p className="mt-3 text-2xl font-black text-white">{kpi.value}</p>
          </GlassCard>
        );
      })}
    </div>
  </AutoLocalizedContent>);
}

function ServicesSection({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <SectionHeader eyebrow="Services" title="Available services" />
      <div className="grid gap-4 md:grid-cols-3">
        {company.serviceCards.map((service) => (
          <div key={service.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
            <Badge tone={service.availability === "Available" ? "success" : "warning"}>{service.availability}</Badge>
            <h3 className="mt-4 text-lg font-black text-white">{service.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ds-text/56">{service.description}</p>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">Typical delivery</p>
            <p className="mt-1 font-black text-gold">{service.delivery}</p>
            <Button className="mt-4 w-full" variant="secondary">Request service</Button>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function PortfolioSection({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <SectionHeader eyebrow="Portfolio" title="Project portfolio" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {company.portfolio.map((project) => (
          <div key={project.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
            <Badge tone="blue">{project.status}</Badge>
            <h3 className="mt-4 text-lg font-black text-white">{project.title}</h3>
            <div className="mt-3 grid gap-2 text-sm text-ds-text/56">
              <span>{project.location} · {project.type}</span>
              <span>{project.budget}</span>
              <span>Completion: {project.date}</span>
            </div>
            <Button className="mt-4 w-full" variant="secondary">View project</Button>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function TeamSection({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <SectionHeader eyebrow="Team" title="Leadership and technical experts" />
      <div className="grid gap-4 md:grid-cols-3">
        {company.team.map((member) => (
          <div key={member.name} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
            <CompanyLogo logo={member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)} />
            <h3 className="mt-4 text-lg font-black text-white">{member.name}</h3>
            <p className="mt-1 text-sm text-gold">{member.role}</p>
            <p className="mt-3 text-sm leading-6 text-ds-text/56">{member.skills}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function ReviewsSection({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="gold">Reviews</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">Ratings and verified client feedback</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">Quality</Badge>
          <Badge tone="blue">Response</Badge>
          <Badge tone="blue">Delivery</Badge>
        </div>
      </div>
      {company.reviews.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {company.reviews.map((review) => (
            <div key={`${review.name}-${review.rating}`} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
              <Badge tone="success">Verified client</Badge>
              <div className="mt-4 flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                <span className="ms-2 text-sm font-black">{review.rating}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-ds-text/62">{review.text}</p>
              <p className="mt-4 font-black text-white">{review.name}</p>
              <p className="text-xs text-ds-text/46">{review.company}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews yet" description="Verified client reviews will appear here when marketplace activity starts." />
      )}
    </GlassCard>
  </AutoLocalizedContent>);
}

function DocumentsSection({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <SectionHeader eyebrow="Documents" title="Documents and certifications" />
      <div className="grid gap-3 md:grid-cols-2">
        {company.documents.map((document) => (
          <div key={document} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <FileText className="h-5 w-5 text-gold" />
            <span className="min-w-0 flex-1 truncate font-black text-white">{document}</span>
            <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />}>Download</Button>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function ContactPanel({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <Badge tone="gold">Business Contact</Badge>
      <h2 className="mt-3 text-2xl font-black text-white">{company.contact.person}</h2>
      <p className="mt-2 text-sm text-ds-text/52">{company.name}</p>
      <div className="mt-5 grid gap-3">
        <ContactRow icon={<Mail className="h-4 w-4" />} label="Email" value={company.contact.email ?? "Not available"} />
        <ContactRow icon={<Phone className="h-4 w-4" />} label="Phone" value={company.contact.phone ?? "Not available"} />
        <ContactRow icon={<Globe className="h-4 w-4" />} label="Website" value={company.contact.website ?? "Not available"} />
        <ContactRow icon={<Clock3 className="h-4 w-4" />} label="Working hours" value={company.contact.hours ?? "Not available"} />
        <ContactRow icon={<MapPin className="h-4 w-4" />} label="Service area" value={company.serviceAreas.join(", ")} />
      </div>
      <div className="mt-5 grid gap-2">
        <Button icon={<MessageSquare className="h-4 w-4" />}>Send message</Button>
        <Button variant="secondary" icon={<CalendarDays className="h-4 w-4" />}>Schedule meeting</Button>
        <Button variant="secondary" icon={<FileText className="h-4 w-4" />}>Request quotation</Button>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function VoraInsights({ company }: { company: MarketplaceCompany }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4">
        <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
        <div>
          <Badge tone="blue">VORA Company Insights</Badge>
          <h2 className="mt-3 text-xl font-black text-white">AI comparison preview</h2>
        </div>
      </div>
      <div className="mt-5">
        <ProgressBar value={company.insights.fit} label="Company fit score" />
      </div>
      <div className="mt-5 grid gap-3">
        <InsightBlock title="Delivery reliability" text={company.insights.reliability} icon={<CheckCircle2 className="h-4 w-4" />} />
        <InsightBlock title="Capacity summary" text={company.insights.capacity} icon={<UsersRound className="h-4 w-4" />} />
        <InsightBlock title="Risk signals" text={company.insights.risks.join(", ")} icon={<ShieldCheck className="h-4 w-4" />} />
        <InsightBlock title="Recommended use cases" text={company.insights.useCases.join(", ")} icon={<WandSparkles className="h-4 w-4" />} />
        <InsightBlock title="Comparison preview" text={company.insights.comparison} icon={<Star className="h-4 w-4" />} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (<AutoLocalizedContent>
    <div className="mb-5">
      <Badge tone="gold">{eyebrow}</Badge>
      <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
    </div>
  </AutoLocalizedContent>);
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-text/42">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div>
      <p className="mt-2 text-sm font-black leading-6 text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

function InsightBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-2 text-gold">{icon}<p className="font-black text-white">{title}</p></div>
      <p className="mt-2 text-sm leading-6 text-ds-text/58">{text}</p>
    </div>
  </AutoLocalizedContent>);
}

function CompanyLogo({ logo, large = false }: { logo: string; large?: boolean }) {
  return (<AutoLocalizedContent>
    <span className={`grid shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/28 bg-[#D4AF37]/12 font-black text-gold shadow-gold-glow ${large ? "h-20 w-20 text-2xl" : "h-14 w-14 text-sm"}`}>
      {logo}
    </span>
  </AutoLocalizedContent>);
}
