export type VorqaAssetKind = "image" | "svg" | "pattern";
export type VorqaAssetPath = `/${string}`;

export type VorqaAsset = {
  readonly src: VorqaAssetPath;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly kind: VorqaAssetKind;
};

const officialBase = "/vorqa/official" as const;

export const vorqaOfficialAssets = {
  vora: {
    main: {
      src: `${officialBase}/vora/vora-main.webp`,
      alt: "VORA assistant",
      width: 760,
      height: 920,
      kind: "image"
    },
    avatar: {
      src: `${officialBase}/vora/vora-avatar.webp`,
      alt: "VORA avatar",
      width: 512,
      height: 512,
      kind: "image"
    },
    thinking: {
      src: `${officialBase}/vora/vora-thinking.webp`,
      alt: "VORA thinking state",
      width: 760,
      height: 920,
      kind: "image"
    },
    success: {
      src: `${officialBase}/vora/vora-success.webp`,
      alt: "VORA success state",
      width: 760,
      height: 920,
      kind: "image"
    }
  },
  villa: {
    hero: {
      src: `${officialBase}/villa/villa-hero.webp`,
      alt: "Vorqa architectural villa hero visual",
      width: 1600,
      height: 1000,
      kind: "image"
    },
    dashboard: {
      src: `${officialBase}/villa/villa-dashboard.webp`,
      alt: "Vorqa dashboard villa preview",
      width: 1200,
      height: 760,
      kind: "image"
    },
    project: {
      src: `${officialBase}/villa/villa-project.webp`,
      alt: "Vorqa project villa preview",
      width: 1200,
      height: 760,
      kind: "image"
    }
  },
  blueprints: {
    overlay: {
      src: `${officialBase}/blueprints/blueprint-overlay.svg`,
      alt: "",
      width: 1400,
      height: 900,
      kind: "svg"
    },
    grid: {
      src: `${officialBase}/blueprints/grid-overlay.svg`,
      alt: "",
      width: 1400,
      height: 900,
      kind: "svg"
    }
  },
  backgrounds: {
    hero: {
      src: `${officialBase}/backgrounds/hero-background.webp`,
      alt: "",
      width: 1800,
      height: 1200,
      kind: "image"
    },
    dashboard: {
      src: `${officialBase}/backgrounds/dashboard-background.webp`,
      alt: "",
      width: 1800,
      height: 1200,
      kind: "image"
    }
  },
  lighting: {
    goldGlow: {
      src: `${officialBase}/lighting/gold-glow.webp`,
      alt: "",
      width: 900,
      height: 900,
      kind: "image"
    },
    cyanGlow: {
      src: `${officialBase}/lighting/cyan-glow.webp`,
      alt: "",
      width: 900,
      height: 900,
      kind: "image"
    }
  },
  patterns: {
    noise: {
      src: `${officialBase}/patterns/noise.png`,
      alt: "",
      width: 512,
      height: 512,
      kind: "pattern"
    }
  }
} as const satisfies {
  vora: Record<"main" | "avatar" | "thinking" | "success", VorqaAsset>;
  villa: Record<"hero" | "dashboard" | "project", VorqaAsset>;
  blueprints: Record<"overlay" | "grid", VorqaAsset>;
  backgrounds: Record<"hero" | "dashboard", VorqaAsset>;
  lighting: Record<"goldGlow" | "cyanGlow", VorqaAsset>;
  patterns: Record<"noise", VorqaAsset>;
};

export type VorqaOfficialAssets = typeof vorqaOfficialAssets;
export type VoraAssetVariant = keyof VorqaOfficialAssets["vora"];
export type VillaAssetVariant = keyof VorqaOfficialAssets["villa"];
export type BlueprintAssetVariant = keyof VorqaOfficialAssets["blueprints"];
export type CinematicBackgroundVariant = keyof VorqaOfficialAssets["backgrounds"];
export type GlowAssetVariant = keyof VorqaOfficialAssets["lighting"];
