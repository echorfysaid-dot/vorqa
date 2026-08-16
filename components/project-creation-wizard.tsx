"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, MapPin, Sparkles } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button, Input, Textarea } from "@/components/ui";
import { createProjectInputFromJourney } from "@/lib/project-owner-journey";
import { projectOwnerStageIds, projectTypeIds, type ProjectCreationAnswers } from "@/types/project-journey";
import type { ProjectInput } from "@/lib/models";

type NamedOption = Readonly<{ id: string; name: string }>;

type ProjectCreationWizardProps = {
  defaultOrganizationId?: string;
  organizations: readonly NamedOption[];
  departments: readonly NamedOption[];
  managers: readonly NamedOption[];
  busy?: boolean;
  onCancel: () => void;
  onCreate: (input: ProjectInput) => Promise<void>;
};

const stepKeys = ["basics", "location", "readiness", "plan"] as const;

export function ProjectCreationWizard({ defaultOrganizationId, organizations, departments, managers, busy = false, onCancel, onCreate }: ProjectCreationWizardProps) {
  const { translate } = useI18n();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<ProjectCreationAnswers>({
    title: "",
    projectType: "not_decided",
    stage: "not_decided",
    currency: "MAD",
    drawingsStatus: "unknown",
    organizationId: defaultOrganizationId || "atlas"
  });

  const progress = Math.round(((step + 1) / stepKeys.length) * 100);
  const stepTitle = translate(`projectJourney.create.step.${stepKeys[step]}.title`);
  const stepDescription = translate(`projectJourney.create.step.${stepKeys[step]}.description`);
  const canContinue = step > 0 || Boolean(answers.title.trim());
  const summary = useMemo(() => [
    translate(`projectJourney.type.${answers.projectType}`),
    answers.city,
    translate(`projectJourney.stage.${answers.stage}`)
  ].filter(Boolean).join(" · "), [answers.city, answers.projectType, answers.stage, translate]);

  function update<K extends keyof ProjectCreationAnswers>(key: K, value: ProjectCreationAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function next() {
    if (!canContinue) {
      setError(translate("projectJourney.create.nameRequired"));
      return;
    }
    setStep((current) => Math.min(stepKeys.length - 1, current + 1));
  }

  async function submit() {
    if (!answers.title.trim()) {
      setStep(0);
      setError(translate("projectJourney.create.nameRequired"));
      return;
    }
    await onCreate(createProjectInputFromJourney(answers));
  }

  return (
    <section aria-labelledby="project-creation-title" className="overflow-hidden rounded-ds-lg border border-ds-token-border bg-ds-token-surface shadow-ds-lg">
      <div className="border-b border-ds-token-border px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-ds-token-gold">{translate("projectJourney.create.eyebrow")}</p>
            <h2 id="project-creation-title" className="mt-1 text-xl font-semibold text-ds-token-text sm:text-2xl">{translate("projectJourney.create.title")}</h2>
            <p className="mt-1 text-sm leading-6 text-ds-token-muted">{translate("projectJourney.create.description")}</p>
          </div>
          <bdi dir="ltr" className="text-sm font-semibold text-ds-token-muted">{step + 1} / {stepKeys.length}</bdi>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full bg-ds-token-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-ds-token-text">{stepTitle}</h3>
          <p className="mt-1 text-sm leading-6 text-ds-token-muted">{stepDescription}</p>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <Input autoFocus label={translate("projectJourney.field.name")} value={answers.title} onChange={(event) => update("title", event.target.value)} error={error || undefined} />
            <ChoiceGrid label={translate("projectJourney.field.type")} values={projectTypeIds} selected={answers.projectType} labelFor={(value) => translate(`projectJourney.type.${value}`)} onSelect={(value) => update("projectType", value)} />
            <Textarea label={translate("projectJourney.field.description")} value={answers.description || ""} placeholder={translate("projectJourney.field.descriptionPlaceholder")} onChange={(event) => update("description", event.target.value)} />
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={translate("projectJourney.field.country")} value={answers.country || ""} onChange={(event) => update("country", event.target.value)} icon={<MapPin className="h-4 w-4" />} />
            <Input label={translate("projectJourney.field.city")} value={answers.city || ""} onChange={(event) => update("city", event.target.value)} />
            <div className="sm:col-span-2"><Input label={translate("projectJourney.field.location")} value={answers.location || ""} placeholder={translate("projectJourney.field.locationPlaceholder")} onChange={(event) => update("location", event.target.value)} /></div>
            <Input type="number" min="0" inputMode="decimal" label={translate("projectJourney.field.landArea")} value={answers.landArea || ""} placeholder={translate("projectJourney.optional")} onChange={(event) => update("landArea", event.target.value)} />
            <Input type="number" min="0" inputMode="decimal" label={translate("projectJourney.field.constructionArea")} value={answers.constructionArea || ""} placeholder={translate("projectJourney.unknown") } onChange={(event) => update("constructionArea", event.target.value)} />
            <Input type="number" min="0" inputMode="numeric" label={translate("projectJourney.field.floors")} value={answers.floors || ""} placeholder={translate("projectJourney.unknown")} onChange={(event) => update("floors", event.target.value)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <ChoiceGrid label={translate("projectJourney.field.stage")} values={projectOwnerStageIds} selected={answers.stage} labelFor={(value) => translate(`projectJourney.stage.${value}`)} onSelect={(value) => update("stage", value)} columns="sm:grid-cols-2" />
            <div className="grid gap-4 sm:grid-cols-3">
              <ChoiceSelect label={translate("projectJourney.field.landStatus")} value={answers.landStatus || "not_decided"} options={["owned", "purchasing", "not_decided"]} onChange={(value) => update("landStatus", value)} translate={translate} prefix="projectJourney.landStatus" />
              <ChoiceSelect label={translate("projectJourney.field.permitStatus")} value={answers.permitStatus || "unknown"} options={["not_started", "in_progress", "approved", "unknown"]} onChange={(value) => update("permitStatus", value)} translate={translate} prefix="projectJourney.permitStatus" />
              <ChoiceSelect label={translate("projectJourney.field.drawings")} value={answers.drawingsStatus || "unknown"} options={["yes", "no", "unknown"]} onChange={(value) => update("drawingsStatus", value as ProjectCreationAnswers["drawingsStatus"])} translate={translate} prefix="projectJourney.answer" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-ds-md border border-ds-token-border bg-white/[0.025] p-4">
              <p className="text-sm font-semibold text-ds-token-text">{answers.title}</p>
              <p className="mt-1 text-sm text-ds-token-muted">{summary}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="number" min="0" inputMode="decimal" label={translate("projectJourney.field.budget")} value={answers.budgetAmount || ""} placeholder={translate("projectJourney.unknown")} onChange={(event) => update("budgetAmount", event.target.value)} />
              <ChoiceSelect label={translate("projectJourney.field.currency")} value={answers.currency || "MAD"} options={["MAD", "EUR", "USD", "not_decided"]} onChange={(value) => update("currency", value)} translate={translate} prefix="projectJourney.currency" />
              <Input type="date" label={translate("projectJourney.field.startDate")} value={answers.desiredStartDate || ""} onChange={(event) => update("desiredStartDate", event.target.value)} />
              <ChoiceSelect label={translate("projectJourney.field.timeframe")} value={answers.completionTimeframe || "not_decided"} options={["under_6_months", "6_12_months", "12_24_months", "over_24_months", "not_decided"]} onChange={(value) => update("completionTimeframe", value)} translate={translate} prefix="projectJourney.timeframe" />
            </div>

            <details className="rounded-ds-md border border-ds-token-border bg-white/[0.02]">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ds-token-text">{translate("projectJourney.workspaceDetails")}</summary>
              <div className="grid gap-4 border-t border-ds-token-border p-4 sm:grid-cols-3">
                <NamedSelect label={translate("Organization")} value={answers.organizationId || ""} options={organizations} onChange={(value) => update("organizationId", value)} emptyLabel={translate("projectJourney.notDecided")} />
                <NamedSelect label={translate("Department")} value={answers.departmentId || ""} options={departments} onChange={(value) => update("departmentId", value)} emptyLabel={translate("projectJourney.notDecided")} />
                <NamedSelect label={translate("Manager")} value={answers.projectManagerId || ""} options={managers} onChange={(value) => update("projectManagerId", value)} emptyLabel={translate("projectJourney.notDecided")} />
              </div>
            </details>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-ds-token-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={step === 0 ? onCancel : () => setStep((current) => Math.max(0, current - 1))} icon={<ArrowLeft className="h-4 w-4 rtl:rotate-180" />}>{step === 0 ? translate("Cancel") : translate("Previous")}</Button>
          {step < stepKeys.length - 1 ? (
            <Button onClick={next} icon={<ArrowRight className="h-4 w-4 rtl:rotate-180" />}>{translate("Next")}</Button>
          ) : (
            <Button onClick={submit} disabled={busy} icon={busy ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4" />}>{busy ? translate("projectJourney.create.creating") : translate("projectJourney.create.finish")}</Button>
          )}
        </div>
      </div>
    </section>
  );
}

function ChoiceGrid<T extends string>({ label, values, selected, labelFor, onSelect, columns = "sm:grid-cols-2 lg:grid-cols-4" }: { label: string; values: readonly T[]; selected: T; labelFor: (value: T) => string; onSelect: (value: T) => void; columns?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-ds-token-muted">{label}</legend>
      <div className={`grid gap-2 ${columns}`}>
        {values.map((value) => {
          const active = selected === value;
          return <button key={value} type="button" aria-pressed={active} onClick={() => onSelect(value)} className={`min-h-12 rounded-ds-sm border px-3 py-2 text-sm font-semibold transition-colors ${active ? "border-ds-token-gold bg-ds-token-gold/12 text-ds-token-gold" : "border-ds-token-border bg-white/[0.025] text-ds-token-text hover:border-ds-token-gold/35"}`}>{labelFor(value)}</button>;
        })}
      </div>
    </fieldset>
  );
}

function ChoiceSelect({ label, value, options, onChange, translate, prefix }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; translate: (value: string) => string; prefix: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ds-token-text">
      <span className="text-xs text-ds-token-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-ds-sm border border-ds-token-border bg-[#111827] px-3 text-ds-token-text outline-none focus:border-ds-token-gold">
        {options.map((option) => <option key={option} value={option}>{translate(`${prefix}.${option}`)}</option>)}
      </select>
    </label>
  );
}

function NamedSelect({ label, value, options, onChange, emptyLabel }: { label: string; value: string; options: readonly NamedOption[]; onChange: (value: string) => void; emptyLabel: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ds-token-text">
      <span className="text-xs text-ds-token-muted">{label}</span>
      <span className="relative">
        <Building2 className="pointer-events-none absolute start-3 top-3.5 h-4 w-4 text-ds-token-gold" />
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-ds-sm border border-ds-token-border bg-[#111827] ps-9 pe-3 text-ds-token-text outline-none focus:border-ds-token-gold">
          <option value="">{emptyLabel}</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </span>
    </label>
  );
}
