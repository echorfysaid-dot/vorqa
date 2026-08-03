"use client";

import { HistoryList } from "@/components/history-list";
import { useI18n } from "@/components/i18n-provider";
import { SearchBar } from "@/components/ui";
import { VoraWorkspaceHero } from "@/components/vorqa-visuals";

export default function HistoryPage() {
  const { dictionary: t } = useI18n();
  return (
    <div className="space-y-6">
      <VoraWorkspaceHero title={t.pages.historyTitle} description={t.pages.historyDescription} />
      <SearchBar placeholder={t.common.search} />
      <HistoryList />
    </div>
  );
}
