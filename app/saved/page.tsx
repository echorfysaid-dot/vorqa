"use client";

import { FileText, Star } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { EmptyState, GlassCard, SearchBar } from "@/components/ui";
import { VoraWorkspaceHero } from "@/components/vorqa-visuals";
import { projectRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const savedGenerations = projectRepository.listSavedGenerations();

export default function SavedPage() {
  const { dictionary: t } = useI18n();
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <VoraWorkspaceHero title={t.pages.savedTitle} description={t.pages.savedDescription} />
      <SearchBar placeholder={t.common.search} />
      {savedGenerations.length ? (
        <div id="documents" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {savedGenerations.map((item, index) => (
            <GlassCard key={item.title} delay={index * 0.04} className="p-5">
              <div className="flex items-start justify-between">
                <FileText className="h-7 w-7 text-[#f1cf72]" />
                {item.favorite && <Star className="h-5 w-5 fill-[#f1cf72] text-[#f1cf72]" />}
              </div>
              <h2 className="mt-5 text-xl font-black text-[#f8efd7]">{item.title}</h2>
              <p className="mt-2 text-sm text-[#f8efd7]/48">{item.tool}</p>
              <p className="mt-4 text-xs font-black text-[#f1cf72]">{item.date}</p>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No saved outputs yet" description="Generated VORA outputs that you save will appear here." />
      )}
    </div>
  </AutoLocalizedContent>);
}
