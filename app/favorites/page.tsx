"use client";

import { Heart } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { EmptyState, GlassCard, SearchBar } from "@/components/ui";
import { VoraWorkspaceHero } from "@/components/vorqa-visuals";
import { projectRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const savedGenerations = projectRepository.listSavedGenerations();

export default function FavoritesPage() {
  const { dictionary: t } = useI18n();
  const favorites = savedGenerations.filter((item) => item.favorite);

  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <VoraWorkspaceHero title={t.pages.favoritesTitle} description={t.pages.favoritesDescription} />
      <SearchBar placeholder={t.common.search} />
      {favorites.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((item, index) => (
            <GlassCard key={item.title} delay={index * 0.04} className="p-5">
              <Heart className="h-7 w-7 fill-[#f1cf72] text-[#f1cf72]" />
              <h2 className="mt-5 text-xl font-black text-[#f8efd7]">{item.title}</h2>
              <p className="mt-2 text-sm text-[#f8efd7]/48">{item.tool}</p>
              <p className="mt-4 text-xs font-black text-[#f1cf72]">{item.date}</p>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No favorites yet" description="Favorite important VORA outputs so they appear here." />
      )}
    </div>
  </AutoLocalizedContent>);
}
