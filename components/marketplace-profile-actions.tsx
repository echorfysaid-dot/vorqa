"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Heart, MessageSquare, Scale } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { DemoMarketplaceCompany } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { marketplaceRepository } from "@/lib/repositories";
import { marketplaceSelection } from "@/lib/marketplace-selection";
import { useToast } from "@/components/app-shell";

export function MarketplaceProfileActions({ company }: { company: DemoMarketplaceCompany }) {
  const { pushToast } = useToast();
  const [inCompare, setInCompare] = useState(() => marketplaceSelection.getCompare().includes(company.slug));
  const [inShortlist, setInShortlist] = useState(() => marketplaceSelection.getShortlist().includes(company.slug));
  const [contacting, setContacting] = useState(false);

  const toggleCompare = () => {
    const current = marketplaceSelection.getCompare();
    const next = current.includes(company.slug) ? current.filter((slug) => slug !== company.slug) : [...current, company.slug].slice(0, 4);
    marketplaceSelection.setCompare(next);
    setInCompare(next.includes(company.slug));
  };

  const toggleShortlist = async () => {
    const current = marketplaceSelection.getShortlist();
    const next = current.includes(company.slug) ? current.filter((slug) => slug !== company.slug) : [...current, company.slug];
    marketplaceSelection.setShortlist(next);
    setInShortlist(next.includes(company.slug));
    if (!current.includes(company.slug) && company.id) {
      const result = await marketplaceRepository.addFavorite({ companyId: company.id });
      if (result.error && !result.isFallback) pushToast("Company saved locally", "Production favorites are unavailable, but this company remains saved on this device.");
    }
  };

  const contactCompany = async () => {
    if (!company.id || contacting) return;
    setContacting(true);
    const result = await marketplaceRepository.createConnection({ targetCompanyId: company.id, intent: "Marketplace contact request" });
    setContacting(false);
    pushToast(result.data ? "Contact request sent" : "Contact request unavailable", result.data ? `${company.name} can now respond through your marketplace connection.` : "Please try again after checking your account connection.");
  };

  return (<AutoLocalizedContent>
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant={inShortlist ? "primary" : "secondary"} icon={<Heart className="h-4 w-4" />} onClick={toggleShortlist}>
          {inShortlist ? "Saved to shortlist" : "Save company"}
        </Button>
        <Button variant={inCompare ? "primary" : "secondary"} icon={<Scale className="h-4 w-4" />} onClick={toggleCompare}>
          {inCompare ? "Remove compare" : "Add to compare"}
        </Button>
        <Button variant="secondary" disabled={contacting || !company.id} icon={<MessageSquare className="h-4 w-4" />} onClick={contactCompany}>{contacting ? "Sending..." : "Contact company"}</Button>
        <Link href={`/marketplace/rfq/new?company=${encodeURIComponent(company.slug)}`}><Button icon={<FileText className="h-4 w-4" />}>Request quote</Button></Link>
      </div>
      {inCompare && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#D4AF37]/24 bg-[#D4AF37]/10 p-3">
          <Badge tone="gold">{company.logo}</Badge>
          <span className="text-sm font-black text-white">{company.name} is ready for comparison.</span>
          <Link href="/marketplace/compare" className="ms-auto text-sm font-black text-gold hover:text-white">View comparison</Link>
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}
