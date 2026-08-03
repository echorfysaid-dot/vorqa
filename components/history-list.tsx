"use client";

import { useEffect, useState } from "react";
import { Clock3, FileText } from "lucide-react";
import { EmptyState, GlassCard, SkeletonCard } from "@/components/ui";
import { authFetch } from "@/lib/auth-client";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

type HistoryRow = {
  id: string;
  tool_slug: string;
  provider: string;
  output_content: string;
  created_at: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function HistoryList() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    authFetch("/api/history")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) {
          setError(data.error || "تعذر تحميل السجل.");
          return;
        }
        setHistory(Array.isArray(data.history) ? data.history : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "تعذر تحميل السجل.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (<AutoLocalizedContent>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <SkeletonCard key={item} />
        ))}
      </div>
    </AutoLocalizedContent>);
  }

  if (error && !history.length) {
    return (<AutoLocalizedContent>
      <GlassCard className="p-6">
        <div className="rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/10 p-4 text-sm font-bold leading-7 text-[#ffb4b4]">
          {error}
        </div>
      </GlassCard>
    </AutoLocalizedContent>);
  }

  if (!history.length) {
    return (<AutoLocalizedContent>
      <EmptyState
        title="لا يوجد سجل توليد بعد"
        description="عندما تنشئ محتوى عبر VORA سيظهر السجل هنا مع الوقت، الأداة، والمزوّد المستخدم."
      />
    </AutoLocalizedContent>);
  }

  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      {error && <p className="mb-4 rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/10 p-3 text-sm font-bold text-[#ffb4b4]">{error}</p>}
      <div className="grid gap-4">
        {history.map((item, index) => (
          <div key={item.id} className="relative flex gap-4 rounded-2xl border border-[#e6c46a]/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f1cf72]/10 text-[#f1cf72]">
              <FileText className="h-6 w-6" />
            </span>
            {index < history.length - 1 && <span className="absolute right-10 top-16 h-6 w-px bg-[#e6c46a]/16" />}
            <div className="min-w-0">
              <p className="font-black text-[#f8efd7]">{item.tool_slug} · {item.provider === "openai" ? "OpenAI" : "الوضع التجريبي"}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#f8efd7]/48">{item.output_content}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#f1cf72]">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDate(item.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}
