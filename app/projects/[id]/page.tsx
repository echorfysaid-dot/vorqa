"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { Button, GlassCard, SkeletonCard } from "@/components/ui";
import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";
import { useProjectMembersRepository, useProjectRepository } from "@/lib/repositories/projectHooks";

const ProjectWorkspace = dynamic(() => import("@/components/project-workspace").then((mod) => mod.ProjectWorkspace), {
  loading: () => (
    <div className="space-y-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ),
  ssr: false
});

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const { locale, translate } = useI18n();
  const projectId = decodeURIComponent(params.id);
  const { data: project, loading, error, isFallback } = useProjectRepository(projectId);
  useProjectMembersRepository(projectId);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!project) {
    return (
      <LocalizedContent locale={locale}><GlassCard className="p-6">
        <p className="text-2xl font-black text-white">Project not found</p>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ds-text/58">
          This project is not available for the current data source or authenticated account.
        </p>
        {error && isFallback && <p className="mt-3 text-sm font-bold text-ds-text/48">Demo fallback is active because production project data is unavailable.</p>}
        <Link href="/projects" className="mt-5 inline-flex">
          <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Back to projects</Button>
        </Link>
      </GlassCard></LocalizedContent>
    );
  }

  return (
    <LocalizedContent locale={locale}><ProjectWorkspace project={project} /></LocalizedContent>
  );
}
