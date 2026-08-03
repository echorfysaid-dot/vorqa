"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Heart, MessageSquare, Scale } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { DemoMarketplaceCompany } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export function MarketplaceProfileActions({ company }: { company: DemoMarketplaceCompany }) {
  const [inCompare, setInCompare] = useState(false);
  const [inShortlist, setInShortlist] = useState(false);

  return (<AutoLocalizedContent>
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant={inShortlist ? "primary" : "secondary"} icon={<Heart className="h-4 w-4" />} onClick={() => setInShortlist((value) => !value)}>
          {inShortlist ? "Saved to shortlist" : "Save company"}
        </Button>
        <Button variant={inCompare ? "primary" : "secondary"} icon={<Scale className="h-4 w-4" />} onClick={() => setInCompare((value) => !value)}>
          {inCompare ? "Remove compare" : "Add to compare"}
        </Button>
        <Button variant="secondary" icon={<MessageSquare className="h-4 w-4" />}>Contact company</Button>
        <Button icon={<FileText className="h-4 w-4" />}>Request quote</Button>
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
