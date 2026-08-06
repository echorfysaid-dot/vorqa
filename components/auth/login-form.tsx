"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { safeAuthRedirect } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const { login, loading, error } = useAuth();
  const { dictionary: t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      const params = new URLSearchParams(window.location.search);
      router.replace(safeAuthRedirect(params.get("next")));
      router.refresh();
    }
  }

  return (<AutoLocalizedContent>
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field icon={<Mail className="h-5 w-5" />} label={t.common.email} placeholder="founder@vorqa.ai" value={email} onChange={setEmail} />
      <Field icon={<LockKeyhole className="h-5 w-5" />} label={t.common.password} placeholder="••••••••" type="password" value={password} onChange={setPassword} />
      {error && <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">{error}</p>}
      <button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#f1cf72] to-[#8d641d] px-5 py-4 font-black text-black shadow-[0_22px_60px_rgba(215,180,90,0.2)] disabled:opacity-60">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowLeft className="h-5 w-5" />}
        {t.common.login}
      </button>
      <Link href="/register" className="inline-flex w-full items-center justify-center rounded-2xl border border-[#e6c46a]/14 bg-white/[0.04] px-5 py-4 font-black text-[#f8efd7]">
        {t.common.register}
      </Link>
    </form>
  </AutoLocalizedContent>);
}

function Field({ icon, label, placeholder, type = "text", value, onChange }: { icon: React.ReactNode; label: string; placeholder: string; type?: string; value: string; onChange: (value: string) => void }) {
  return (<AutoLocalizedContent>
    <label className="grid gap-2 text-sm font-black text-[#f8efd7]/82">
      {label}
      <div className="flex items-center gap-3 rounded-2xl border border-[#e6c46a]/14 bg-black/24 px-4 py-3">
        <span className="text-[#f1cf72]">{icon}</span>
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[#f8efd7] outline-none placeholder:text-[#f8efd7]/32" />
      </div>
    </label>
  </AutoLocalizedContent>);
}
