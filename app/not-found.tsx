import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button, GlassCard } from "@/components/ui";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function NotFoundPage() {
  return (<AutoLocalizedContent>
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-16 text-center">
      <GlassCard className="p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">404</p>
        <h1 className="mt-3 text-3xl font-black text-ds-text">الصفحة غير موجودة</h1>
        <p className="mt-3 text-sm leading-7 text-ds-text/58">المسار المطلوب غير متاح أو تم نقله. يمكنك العودة إلى مساحة العمل والمتابعة بأمان.</p>
        <Link href="/dashboard" className="mt-6 inline-flex">
          <Button icon={<ArrowLeft className="h-4 w-4" />}>العودة إلى لوحة التحكم</Button>
        </Link>
      </GlassCard>
    </main>
  </AutoLocalizedContent>);
}
