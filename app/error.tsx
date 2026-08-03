"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, GlassCard } from "@/components/ui";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

export default function GlobalErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (<AutoLocalizedContent>
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-16 text-center">
      <GlassCard className="p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/10 text-[#FFB4B4]">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-[#EF4444]">Runtime error</p>
        <h1 className="mt-3 text-3xl font-black text-ds-text">حدث خطأ غير متوقع</h1>
        <p className="mt-3 text-sm leading-7 text-ds-text/58">لم يتم تغيير بياناتك. أعد المحاولة، وإذا استمر الخطأ راجع سجل التشغيل في بيئة الإنتاج.</p>
        <Button className="mt-6" onClick={reset} icon={<RotateCcw className="h-4 w-4" />}>إعادة المحاولة</Button>
      </GlassCard>
    </main>
  </AutoLocalizedContent>);
}
