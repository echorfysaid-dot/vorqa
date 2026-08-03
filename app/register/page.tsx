"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { Badge, Button, GlassCard } from "@/components/ui";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

type RegistrationResult = { email: string; message: string; authenticated: boolean };

export default function RegisterPage() {
  const [result, setResult] = useState<RegistrationResult | null>(null);
  if (result && !result.authenticated) return <EmailConfirmationSuccess email={result.email} />;

  return (<AutoLocalizedContent>
    <main className="relative mx-auto min-h-[calc(100vh-7rem)] max-w-7xl overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative flex min-h-[calc(100vh-11rem)] flex-col">
        <section className="mx-auto w-full max-w-4xl text-center">
          <Badge tone="gold" className="px-3.5 py-1.5 text-sm font-bold">Step 2 of 3</Badge>
          <h1 className="mt-4 text-4xl font-black leading-[1.12] text-ds-token-text sm:text-5xl">Create your account</h1>
          <p className="mx-auto mt-3 max-w-3xl text-base font-medium leading-7 text-ds-token-text/70 sm:text-lg">Choose how you work, select your role, and create the Vorqa workspace that fits your projects.</p>
        </section>
        <GlassCard className="relative mt-7 flex-1 overflow-hidden border-ds-token-border/80 bg-ds-token-surface/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-7 lg:p-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ds-token-gold/70 to-transparent" />
          <RegisterForm onRegistered={setResult} />
        </GlassCard>
      </div>
    </main>
  </AutoLocalizedContent>);
}

function EmailConfirmationSuccess({ email }: { email: string }) {
  return (<AutoLocalizedContent><GlassCard className="mx-auto mt-10 max-w-2xl p-8 text-center">
    <div className="mx-auto grid h-16 w-16 place-items-center rounded-ds-lg border border-ds-token-gold/30 bg-ds-token-gold/10 text-gold"><Mail className="h-7 w-7" /></div>
    <Badge tone="success" className="mt-6">Account created</Badge>
    <h1 className="mt-4 text-3xl font-bold text-ds-token-text">Confirm your email</h1>
    <p className="mt-3 text-sm text-ds-token-muted">Use the confirmation link sent to <span className="font-semibold text-ds-token-text" dir="ltr">{email}</span>, then continue to workspace setup.</p>
    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><a href="mailto:"><Button icon={<Mail className="h-4 w-4" />}>Open email</Button></a><Link href="/login"><Button variant="secondary">Back to login</Button></Link></div>
  </GlassCard></AutoLocalizedContent>);
}
