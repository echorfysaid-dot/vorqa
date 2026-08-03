"use client";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { translateUiText, type Locale } from "@/lib/i18n";

const localizedAttributes = [
  "aria-label",
  "placeholder",
  "title",
  "alt",
  "label",
  "description",
  "eyebrow",
  "message",
  "text",
  "hint"
] as const;

function localizeStructuredProp(value: unknown, locale: Locale): unknown {
  if (typeof value === "string") return translateUiText(value, locale);
  if (Array.isArray(value)) return value.map((entry) => localizeStructuredProp(entry, locale));
  if (!value || typeof value !== "object" || isValidElement(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    key === "value" ? entry : localizeStructuredProp(entry, locale)
  ]));
}

function localizeNode(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === "string") return translateUiText(node, locale);
  if (Array.isArray(node)) return node.map((child) => localizeNode(child, locale));
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<Record<string, unknown>>;
  const nextProps: Record<string, unknown> = {};
  let changed = false;

  for (const attribute of localizedAttributes) {
    const value = element.props[attribute];
    if (typeof value !== "string") continue;
    const translated = translateUiText(value, locale);
    if (translated !== value) {
      nextProps[attribute] = translated;
      changed = true;
    }
  }


  for (const attribute of ["options", "tabs"] as const) {
    if (!(attribute in element.props)) continue;
    nextProps[attribute] = localizeStructuredProp(element.props[attribute], locale);
    changed = true;
  }

  if ("children" in element.props) {
    nextProps.children = Children.map(element.props.children as ReactNode, (child) => localizeNode(child, locale));
    changed = true;
  }

  return changed ? cloneElement(element, nextProps) : element;
}

export function LocalizedContent({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div data-vorqa-locale={locale} className="contents">
      {localizeNode(children, locale)}
    </div>
  );
}
