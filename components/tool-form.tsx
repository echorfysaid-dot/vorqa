"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clipboard, Crown, Heart, Loader2, Save, Sparkles } from "lucide-react";
import { useToast } from "@/components/app-shell";
import { useI18n } from "@/components/i18n-provider";
import { BlueprintOverlay, VoraAssistantCard } from "@/components/vorqa-visuals";
import { authFetch } from "@/lib/auth-client";
import type { ToolDefinition } from "@/lib/tools";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

type FormValues = Record<string, string>;
type FormTool = Omit<ToolDefinition, "icon">;

export function ToolForm({ tool, minimal = false }: { tool: FormTool; minimal?: boolean }) {
  const { dictionary: t } = useI18n();
  const localizedTool = t.tools.definitions[tool.slug];
  const initialValues = useMemo(
    () => Object.fromEntries(tool.fields.map((field) => [field.name, translatedOptions(t, field.name, field.options)?.[0] || ""])),
    [tool.fields, t]
  );
  const { pushToast } = useToast();
  const [values, setValues] = useState<FormValues>(initialValues);
  const [output, setOutput] = useState("");
  const [provider, setProvider] = useState("mock");
  const [loading, setLoading] = useState(false);
  const [lastFailed, setLastFailed] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setOutput("");
    setLastFailed(false);

    try {
      const response = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ tool: tool.slug, payload: values })
      });

      const result = await response.json().catch(() => ({ error: t.tools.readError }));
      if (!response.ok) {
        setOutput(result.error || t.tools.createError);
        setProvider("mock");
        setLastFailed(true);
        pushToast(t.tools.failTitle, result.error || t.tools.failText);
        return;
      }

      setOutput(result.output || t.tools.createError);
      setProvider(result.provider || "mock");
      pushToast(t.tools.successTitle, result.provider === "openai" ? t.tools.successOpenAi : t.tools.successMock);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.tools.networkError;
      setOutput(message);
      setProvider("mock");
      setLastFailed(true);
      pushToast(t.tools.networkError, message);
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    pushToast(t.tools.copiedTitle, t.tools.copiedText);
  }

  function exportMarkdown() {
    if (!output || lastFailed) return;
    const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${tool.slug}-vora-output.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast(t.tools.markdownTitle, t.tools.markdownText);
  }

  if (minimal) {
    return (<AutoLocalizedContent>
      <div className="min-h-[calc(100vh-4.5rem)] border-t border-ds-token-border bg-[#080909]">
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[680px] flex-col px-4 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-4xl flex-1">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-ds-token-muted-soft">Intelligence</p>
              <h1 className="mt-2 text-3xl font-black text-ds-token-text">VORA</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ds-token-muted">{t.tools.studioDescription}</p>
            </div>

            <div className="mt-8 min-h-[360px] rounded-ds-lg border border-ds-token-border bg-[#0d0f0f] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-ds-token-border pb-4">
                <div>
                  <h2 className="font-bold text-ds-token-text">{t.tools.outputAtelier}</h2>
                  <p className="mt-1 text-xs text-ds-token-muted-soft">{provider === "openai" ? t.tools.openaiConnected : t.tools.mockMode}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={copyOutput} disabled={!output} className="grid h-9 w-9 place-items-center rounded-ds-sm border border-ds-token-border text-ds-token-muted transition hover:text-ds-token-gold disabled:opacity-30" aria-label={t.common.copy}><Clipboard className="h-4 w-4" /></button>
                  <button type="button" onClick={exportMarkdown} disabled={!output || lastFailed} className="grid h-9 w-9 place-items-center rounded-ds-sm border border-ds-token-border text-ds-token-muted transition hover:text-ds-token-gold disabled:opacity-30" aria-label={t.common.exportMarkdown}><Save className="h-4 w-4" /></button>
                  <button type="button" disabled={!output} className="grid h-9 w-9 place-items-center rounded-ds-sm border border-ds-token-border text-ds-token-muted transition hover:text-ds-token-gold disabled:opacity-30" aria-label={t.nav.favorites}><Heart className="h-4 w-4" /></button>
                </div>
              </div>
              {loading ? (
                <div className="grid gap-3"><div className="h-4 w-2/3 animate-pulse rounded bg-white/10" /><div className="h-3 w-full animate-pulse rounded bg-white/10" /><div className="h-3 w-5/6 animate-pulse rounded bg-white/10" /></div>
              ) : output ? (
                <pre className="whitespace-pre-wrap break-words text-sm leading-8 text-ds-token-text/88">{output}</pre>
              ) : (
                <div className="grid min-h-[270px] place-items-center text-center text-sm text-ds-token-muted-soft">{t.tools.emptyOutput}</div>
              )}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mx-auto mt-6 w-full max-w-4xl">
            <div className="flex items-end gap-3 rounded-ds-lg border border-ds-token-gold/44 bg-[#111313] p-3 shadow-ds-md focus-within:border-ds-token-gold">
              <textarea required value={values.extraDetails || ""} onChange={(event) => setValues((current) => ({ ...current, extraDetails: event.target.value }))} placeholder={t.tools.askVora} className="min-h-16 max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-6 text-ds-token-text outline-none placeholder:text-ds-token-muted-soft" />
              <button type="submit" disabled={loading || !(values.extraDetails || "").trim()} className="grid h-10 w-10 shrink-0 place-items-center rounded-ds-md bg-ds-token-gold text-black transition hover:brightness-105 disabled:opacity-50" aria-label={lastFailed ? t.tools.retryVora : t.tools.askVora}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </motion.main>
      </div>
    </AutoLocalizedContent>);
  }

  return (<AutoLocalizedContent>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="relative overflow-hidden rounded-[2rem] border border-[#e6c46a]/14 bg-white/[0.055] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl"
      >
        <BlueprintOverlay className="opacity-35" />
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e6c46a]/18 bg-[#f1cf72]/10 px-3 py-1 text-xs font-black text-[#f1cf72]">
            <Crown className="h-3.5 w-3.5" />
            {localizedTool.badge}
          </span>
          <h2 className="mt-4 text-2xl font-black text-[#f8efd7]">{localizedTool.shortTitle}</h2>
          <p className="mt-2 text-sm leading-7 text-[#f8efd7]/58">{localizedTool.description}</p>
        </div>
        <div className="mb-5">
          <VoraAssistantCard message="اختر المشروع واللغة والنبرة، وسأحوّل المدخلات إلى مخرج منظم وقابل للاستخدام." state="thinking" />
        </div>

        <div className="grid gap-4">
          {tool.fields.map((field) => {
            const label = localizedTool.fields[field.name as keyof typeof localizedTool.fields] || field.label;
            const options = translatedOptions(t, field.name, field.options);
            return (
              <label key={field.name} className="grid gap-2 text-sm font-black text-[#f8efd7]/82">
                {label}
                {field.type === "textarea" ? (
                  <textarea
                    value={values[field.name] || ""}
                    placeholder={field.placeholder}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    className="min-h-28 rounded-2xl border border-[#e6c46a]/14 bg-black/24 px-4 py-3 leading-7 text-[#f8efd7] outline-none transition placeholder:text-[#f8efd7]/30 focus:border-[#f1cf72]/50 focus:ring-4 focus:ring-[#f1cf72]/10"
                  />
                ) : field.type === "select" ? (
                  <select
                    value={values[field.name] || options?.[0] || ""}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    className="rounded-2xl border border-[#e6c46a]/14 bg-[#0b1020] px-4 py-3 text-[#f8efd7] outline-none transition focus:border-[#f1cf72]/50 focus:ring-4 focus:ring-[#f1cf72]/10"
                  >
                    {options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={values[field.name] || ""}
                    placeholder={field.placeholder}
                    onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    className="rounded-2xl border border-[#e6c46a]/14 bg-black/24 px-4 py-3 text-[#f8efd7] outline-none transition placeholder:text-[#f8efd7]/30 focus:border-[#f1cf72]/50 focus:ring-4 focus:ring-[#f1cf72]/10"
                  />
                )}
              </label>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#f1cf72] to-[#8d641d] px-5 py-4 font-black text-black shadow-[0_22px_60px_rgba(215,180,90,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {lastFailed ? t.tools.retryVora : t.tools.askVora}
        </button>
      </motion.form>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="relative overflow-hidden rounded-[2rem] border border-[#e6c46a]/16 bg-[#080b13]/88 p-5 text-[#f8efd7] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      >
        <BlueprintOverlay className="opacity-25" />
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">{t.tools.outputAtelier}</h2>
            <p className="mt-1 text-sm text-[#f8efd7]/48">{provider === "openai" ? t.tools.openaiConnected : t.tools.mockMode}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={copyOutput} disabled={!output} className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e6c46a]/14 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40" aria-label={t.common.copy}>
              <Clipboard className="h-5 w-5" />
            </button>
            <button type="button" onClick={exportMarkdown} disabled={!output || lastFailed} className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e6c46a]/14 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40" aria-label={t.common.exportMarkdown}>
              <Save className="h-5 w-5" />
            </button>
            <button type="button" disabled={!output} className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e6c46a]/14 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40" aria-label={t.nav.favorites}>
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-[520px] rounded-[1.5rem] border border-[#e6c46a]/12 bg-black/22 p-5">
          {loading ? (
            <div className="grid gap-3">
              <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-32 animate-pulse rounded-2xl bg-white/10" />
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap break-words text-sm leading-8 text-[#f8efd7]/88">{output}</pre>
          ) : (
            <div className="flex h-full min-h-[470px] items-center justify-center text-center text-[#f8efd7]/42">{t.tools.emptyOutput}</div>
          )}
        </div>
      </motion.section>
    </div>
  </AutoLocalizedContent>);
}

function translatedOptions(t: ReturnType<typeof useI18n>["dictionary"], fieldName: string, fallback?: string[]): readonly string[] | undefined {
  if (fieldName === "documentType") return t.tools.options.documentType;
  if (fieldName === "language") return t.tools.options.outputLanguage;
  if (fieldName === "tone") return t.tools.options.tone;
  if (fieldName === "style") return t.tools.options.style;
  if (fieldName === "channel") return t.tools.options.channel;
  return fallback;
}
