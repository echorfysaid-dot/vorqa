"use client";

import { PageHeader } from "@/components/ui";
import { ToolForm } from "@/components/tool-form";
import { useI18n } from "@/components/i18n-provider";
import { VoraWorkspaceHero } from "@/components/vorqa-visuals";
import { getTool, type ToolSlug } from "@/lib/tools";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export function ToolStudioPage({ slug }: { slug: ToolSlug }) {
  const { dictionary: t } = useI18n();
  const tool = getTool(slug);
  if (!tool) return null;

  const localizedTool = t.tools.definitions[slug];
  const formTool = {
    slug: tool.slug,
    title: localizedTool.title,
    shortTitle: localizedTool.shortTitle,
    description: localizedTool.description,
    category: localizedTool.category,
    badge: localizedTool.badge,
    cta: localizedTool.cta,
    accent: tool.accent,
    fields: tool.fields
  };

  return (<AutoLocalizedContent>
    <div className={slug === "document" ? "-m-4 sm:-m-6 lg:-m-7" : "space-y-6"}>
      {slug !== "document" && <VoraWorkspaceHero title={localizedTool.title} description={localizedTool.pageDescription || t.tools.studioDescription} />}
      {slug !== "document" && <PageHeader eyebrow="AI Studio" title={localizedTool.title} description={localizedTool.pageDescription || t.tools.studioDescription} />}
      <ToolForm tool={formTool} minimal={slug === "document"} />
    </div>
  </AutoLocalizedContent>);
}
