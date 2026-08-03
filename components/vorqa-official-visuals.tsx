"use client";

import Image from "next/image";
import { type ReactNode, useState } from "react";
import {
  type BlueprintAssetVariant,
  type CinematicBackgroundVariant,
  type VillaAssetVariant,
  type VorqaAsset,
  type VoraAssetVariant,
  vorqaOfficialAssets
} from "@/lib/vorqa-assets";

type BaseVisualProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
};

type FallbackProps = {
  className?: string;
  label?: string;
  tone?: "gold" | "cyan" | "dark";
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function VisualFallback({ className, label, tone = "dark" }: FallbackProps) {
  const toneClass =
    tone === "gold"
      ? "border-ds-token-gold/28 bg-[radial-gradient(circle_at_50%_38%,rgba(214,168,75,.16),rgba(7,8,8,.92)_58%)]"
      : tone === "cyan"
        ? "border-[#51D8FF]/24 bg-[radial-gradient(circle_at_50%_38%,rgba(81,216,255,.20),rgba(5,7,11,.72)_58%)]"
        : "border-ds-token-border bg-ds-token-secondary/90";

  return (
    <div className={cn("grid min-h-24 place-items-center overflow-hidden rounded-[inherit] border", toneClass, className)} aria-hidden={!label}>
      {label ? <span className="px-4 text-center text-xs font-semibold text-white/55">{label}</span> : null}
    </div>
  );
}

function ResponsiveAsset({
  asset,
  className,
  imageClassName,
  priority = false,
  sizes,
  fit = "contain",
  fallbackTone = "dark"
}: BaseVisualProps & {
  asset: VorqaAsset;
  fit?: "contain" | "cover";
  fallbackTone?: FallbackProps["tone"];
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <VisualFallback className={className} label={asset.alt || "Vorqa visual"} tone={fallbackTone} />;
  }

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ aspectRatio: `${asset.width} / ${asset.height}` }}>
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(fit === "cover" ? "object-cover" : "object-contain", imageClassName)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function VoraVisual({
  variant = "main",
  className,
  imageClassName,
  priority = false,
  sizes = "(max-width: 768px) 72vw, 420px"
}: BaseVisualProps & { variant?: VoraAssetVariant }) {
  return (
    <ResponsiveAsset
      asset={vorqaOfficialAssets.vora[variant]}
      className={cn("rounded-ds-2xl", className)}
      imageClassName={cn("drop-shadow-[0_0_44px_rgba(81,216,255,.28)]", imageClassName)}
      priority={priority}
      sizes={sizes}
      fallbackTone="cyan"
    />
  );
}

export function VillaVisual({
  variant = "hero",
  className,
  imageClassName,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 760px"
}: BaseVisualProps & { variant?: VillaAssetVariant }) {
  return (
    <ResponsiveAsset
      asset={vorqaOfficialAssets.villa[variant]}
      className={cn("rounded-ds-2xl", className)}
      imageClassName={imageClassName}
      priority={priority}
      sizes={sizes}
      fit="cover"
      fallbackTone="gold"
    />
  );
}

export function BlueprintOverlay({
  variant = "overlay",
  className,
  imageClassName,
  priority = false,
  sizes = "100vw"
}: BaseVisualProps & { variant?: BlueprintAssetVariant }) {
  return (
    <ResponsiveAsset
      asset={vorqaOfficialAssets.blueprints[variant]}
      className={cn("pointer-events-none absolute inset-0 rounded-none", className)}
      imageClassName={cn("object-cover opacity-65 mix-blend-screen", imageClassName)}
      priority={priority}
      sizes={sizes}
      fit="cover"
      fallbackTone="cyan"
    />
  );
}

export function CinematicBackground({
  variant = "hero",
  className,
  imageClassName,
  priority = false,
  sizes = "100vw",
  children
}: BaseVisualProps & { variant?: CinematicBackgroundVariant; children?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const asset = vorqaOfficialAssets.backgrounds[variant];

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-ds-token-bg", className)}>
      {!failed ? (
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(214,168,75,.10),transparent_28%),linear-gradient(145deg,#070808,#0c0e0f_52%,#050606)]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,4,8,.92),rgba(5,7,11,.58)_48%,rgba(2,4,8,.88))]" />
      {children}
    </div>
  );
}

function GlowVisual({
  asset,
  className,
  imageClassName,
  priority = false,
  sizes = "480px",
  fallbackTone
}: BaseVisualProps & { asset: VorqaAsset; fallbackTone: FallbackProps["tone"] }) {
  return (
    <ResponsiveAsset
      asset={asset}
      className={cn("pointer-events-none absolute rounded-full opacity-70 blur-[1px]", className)}
      imageClassName={cn("object-contain", imageClassName)}
      priority={priority}
      sizes={sizes}
      fallbackTone={fallbackTone}
    />
  );
}

export function GoldGlow(props: BaseVisualProps) {
  return <GlowVisual {...props} asset={vorqaOfficialAssets.lighting.goldGlow} fallbackTone="gold" />;
}

export function CyanGlow(props: BaseVisualProps) {
  return <GlowVisual {...props} asset={vorqaOfficialAssets.lighting.cyanGlow} fallbackTone="cyan" />;
}
