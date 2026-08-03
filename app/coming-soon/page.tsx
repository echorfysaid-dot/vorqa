"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function ComingSoonPage() {
  const capability = useSearchParams().get("capability")?.replace(/-/g, " ") || "This capability";
  return (<AutoLocalizedContent><div className="mx-auto max-w-2xl py-12"><EmptyState icon={<Clock3 className="h-6 w-6" />} title="Coming Soon" description={`${capability} is not available in the current release.`} action={<Link href="/dashboard"><Button variant="secondary" icon={<ArrowLeft className="h-4 w-4 rtl:rotate-180" />}>Back to dashboard</Button></Link>} /></div></AutoLocalizedContent>);
}
